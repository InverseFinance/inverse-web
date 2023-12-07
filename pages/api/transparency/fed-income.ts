import 'source-map-support'
import { getNetworkConfigConstants } from '@app/util/networks'
import { getCacheFromRedis, getCacheFromRedisAsObj, redisSetWithTimestamp } from '@app/util/redis'
import { Fed, NetworkIds } from '@app/types';
import { getBnToNumber } from '@app/util/markets'
import { getLast100TxsOf } from '@app/util/covalent';
import { parseUnits } from '@ethersproject/units';
import { pricesCacheKey } from '../prices';
import { throttledPromises } from '@app/util/misc';
import { Contract } from 'ethers';
import { getProvider } from '@app/util/providers';
import { addBlockTimestamps, getCachedBlockTimestamps } from '@app/util/timestamps';
import { DOLA_ABI } from '@app/config/abis';

const COINGECKO_IDS = {
    'CRV': 'curve-dao-token',
    'CVX': 'convex-finance',
    'VELO': 'velodrome-finance',
    'BAL': 'balancer',
    'AURA': 'aura-finance',
    'AERO': 'aerodrome-finance',
}

// Crosschain Fee is 0.1 %, Minimum Crosschain Fee is 83 DOLA, Maximum Crosschain Fee is 1,040 DOLA
const bridgeFees: { [key: string]: { fee: number, min: number, max: number } } = {
    [NetworkIds.ftm]: {
        fee: 0.001,
        min: 83,
        max: 1040,
    }
}

const deduceBridgeFees = (value: number, chainId: string) => {
    const fees = bridgeFees[chainId];
    if (fees) {
        const hypotheticalFee = value * fees.fee;
        if (hypotheticalFee < fees.min) {
            return value - fees.min;
        } else if (hypotheticalFee > fees.max) {
            return value - fees.max;
        } else {
            return value - hypotheticalFee;
        }
    }
    return value;
}

// For cross-chain feds, also take into account DOLA transfers happening on mainnet from Fed mainnet address to Treasury
const getXchainMainnetProfits = async (FEDS: Fed[], DOLA: string, TREASURY: string, cachedTotalEvents?: any) => {
    const xchainFeds = FEDS.filter(fed => !fed.hasEnded && !!fed.incomeChainId && fed.incomeChainId !== NetworkIds.mainnet);
    const dolaContract = new Contract(DOLA, DOLA_ABI, getProvider(NetworkIds.mainnet, undefined, true));
    const transfersToTreasury = await Promise.all(
        xchainFeds.map((fed) => {
            const lastMainnetTransferEvents = cachedTotalEvents.filter(event => event.isMainnetTxForXchainFed && event.fedAddress === fed.address);
            const startingBlock = lastMainnetTransferEvents?.length ? lastMainnetTransferEvents[lastMainnetTransferEvents.length - 1].blockNumber + 1 : undefined;
            return dolaContract.queryFilter(dolaContract.filters.Transfer(fed.address, TREASURY), startingBlock);
        })
    );
    const uniqueBlocks = [...new Set(transfersToTreasury.map((fedTransfers, i) => fedTransfers.map(ev => ev.blockNumber)).flat())];
    await addBlockTimestamps(uniqueBlocks, NetworkIds.mainnet);
    const timestamps = await getCachedBlockTimestamps();    
    return xchainFeds.map((fed, i) => {
        return {
            fedAddress: fed.address,
            events: transfersToTreasury[i].map(ev => {
                return {
                    timestamp: timestamps[NetworkIds.mainnet][ev.blockNumber] * 1000,
                    blockNumber: ev.blockNumber,
                    transactionHash: ev.transactionHash,
                    profit: getBnToNumber(ev.args![2]),
                    isMainnetTxForXchainFed: true,
                }
            })
        }
    })
}

const getProfits = async (FEDS: Fed[], TREASURY: string, cachedCurrentPrices: { [key: string]: number }, cachedTotalEvents?: any) => {
    const transfers = await throttledPromises(
        (fed: Fed) => getLast100TxsOf(fed.incomeSrcAd || fed.address, fed.incomeChainId || fed.chainId),
        FEDS,
        // max 5 req per sec
        5,
        500,
    );
    return await Promise.all(transfers.map(async (r, i) => {
        const fed = FEDS[i];
        const archivedFedData = cachedTotalEvents.filter(event => event.fedIndex === i);
        if (fed.hasEnded && !!cachedTotalEvents) {
            return archivedFedData;
        }

        const toAddress = (fed?.incomeTargetAd || TREASURY)?.toLowerCase();
        const srcAddress = (fed?.incomeSrcAd || fed?.address)?.toLowerCase();
        const eventName = fed?.isXchain ? 'LogSwapout' : 'Transfer';

        const items = r.data.items
            .filter(item => item.successful)
            .filter(item => !archivedFedData.find(archTx => archTx.transactionHash === item.tx_hash && archTx.fedIndex === i))
            .filter(item => !!item.log_events?.find(e => !!e.decoded && e.decoded.name === eventName
                    && e?.decoded?.params[0]?.value?.toLowerCase() == srcAddress
                    && e?.decoded?.params[1]?.value?.toLowerCase() == toAddress
                ))
            .sort((a, b) => a.block_height - b.block_height);

        const unarchivedData = await Promise.all(items.map(async item => {
            const filteredEvents = item.log_events?.filter(e => !!e.decoded && e.decoded.name === eventName
                    && e?.decoded?.params[0]?.value?.toLowerCase() == srcAddress
                    && e?.decoded?.params[1]?.value?.toLowerCase() == toAddress
                )
            let income = 0;
            const timestamp = +(new Date(item.block_signed_at));
            const dateSplit = item.block_signed_at.substring(0, 10).split('-');
            const histoDateDDMMYYYY = `${dateSplit[2]}-${dateSplit[1]}-${dateSplit[0]}`;
            await Promise.all(filteredEvents.map(async e => {
                const amount = getBnToNumber(parseUnits(e.decoded.params[2].value, 0));
                if (['CRV', 'CVX', 'VELO', 'BAL', 'AURA', 'AERO'].includes(e.sender_contract_ticker_symbol)) {
                    const cgId = COINGECKO_IDS[e.sender_contract_ticker_symbol];
                    let histoPrice = 1;
                    const histoCacheKey = `price-${cgId}-${histoDateDDMMYYYY}`;
                    const cachedHistoPrice = await getCacheFromRedis(histoCacheKey, false);

                    if (!cachedHistoPrice) {
                        // TODO: use historical api with daily data
                        const histoPriceUrl = `https://api.coingecko.com/api/v3/coins/${cgId}/history?date=${histoDateDDMMYYYY}&localization=false`;
                        const res = await fetch(histoPriceUrl);
                        const historicalData = await res.json();
                        try {
                            histoPrice = historicalData.market_data.current_price.usd;
                            await redisSetWithTimestamp(histoCacheKey, { usd: histoPrice });
                        } catch (err) {
                            console.log('err fetching histo price');
                            console.log(histoPriceUrl);
                            console.log(e.sender_contract_ticker_symbol)
                            console.log('-- Falling back on cached current price', cachedCurrentPrices[cgId])
                            histoPrice = cachedCurrentPrices[cgId] || 1;
                        }
                    } else {
                        console.log('found cached histo price', cachedHistoPrice.usd)
                        histoPrice = cachedHistoPrice.usd;
                    }
                    income += histoPrice * amount;
                } else {
                    income += amount;
                }
            }))
            return {
                blockNumber: item.block_height,
                timestamp,
                profit: deduceBridgeFees(income, fed.chainId),
                transactionHash: item.tx_hash,
            }
        }));
        return archivedFedData.concat(unarchivedData);
    }));
}

export default async function handler(req, res) {
    const { cacheFirst } = req.query;
    const { FEDS, DOLA, TREASURY } = getNetworkConfigConstants(NetworkIds.mainnet);

    const archiveCacheKey = `revenues-v1.0.22`;
    const cacheKey = `revenues-v1.0.23`;

    try {

        const cacheDuration = 1800;
        res.setHeader('Cache-Control', `public, max-age=${cacheDuration}`);
        const [archive, cache] = await Promise.all([
            getCacheFromRedisAsObj(archiveCacheKey, false, cacheDuration),
            getCacheFromRedisAsObj(cacheKey, cacheFirst !== 'true', cacheDuration)
        ]);

        const { data: archived } = archive;     
        const { data: cachedData, isValid } = cache;

        if (isValid) {
            res.status(200).json(cachedData);
            return
        }

        const [cachedCurrentPrices] = await Promise.all([
            getCacheFromRedis(pricesCacheKey, false),
        ]);

        let withOldAddresses: (Fed & { oldAddress?: string, oldIncomeSrcAd?: string })[] = [];
        FEDS.filter(fed => !!fed.oldAddresses).forEach(fed => {
            fed.oldAddresses?.forEach(oldAddress => withOldAddresses.push({ ...fed, oldAddress }));
        });
        FEDS.filter(fed => !!fed.oldIncomeSrcAds).forEach(fed => {
            fed.oldIncomeSrcAds?.forEach(oldAddress => withOldAddresses.push({ ...fed, oldIncomeSrcAd: oldAddress }));
        });
        const oldFilteredTransfers = withOldAddresses.map(old => []);
        // const [filteredTransfers, oldFilteredTransfers] = await Promise.all(
        const [filteredTransfers, xchainMainnetTransfers] = await Promise.all(
            [
                getProfits(FEDS, TREASURY, cachedCurrentPrices, archived?.totalEvents||[]),
                getXchainMainnetProfits(FEDS, DOLA, TREASURY, archived?.totalEvents||[]),
                // getProfits(withOldAddresses.map(f => ({
                //     ...f,
                //     address: f.oldAddress || f.address,
                //     incomeSrcAd: f.oldIncomeSrcAd || f.incomeSrcAd,
                // })), TREASURY, cachedCurrentPrices, []),
            ]
        );

        withOldAddresses.forEach((old, i) => {
            const fedIndex = FEDS.findIndex(f => f.name === old.name);
            filteredTransfers[fedIndex] = filteredTransfers[fedIndex].concat(oldFilteredTransfers[i]);
        });
        xchainMainnetTransfers.forEach((activeXchainFed, i) => {
            const fedIndex = FEDS.findIndex(f => f.address === activeXchainFed.fedAddress);
            filteredTransfers[fedIndex] = filteredTransfers[fedIndex].concat(activeXchainFed.events);
        });

        const accProfits: { [key: string]: number } = {};
        let total = 0;
        let _key = 0;

        const fedsIncomes = filteredTransfers.map((fedTransfers, fedIndex) => {
            if (!accProfits[fedIndex]) { accProfits[fedIndex] = 0 }
            fedTransfers.sort((a, b) => a.timestamp - b.timestamp);
            return fedTransfers.map(t => {
                accProfits[fedIndex] += t.profit;
                return {
                    ...t,
                    fedIndex: fedIndex,
                    fedAddress: FEDS[fedIndex].address,
                    accProfit: accProfits[fedIndex],
                };
            })
        })
            .reduce((prev, curr) => prev.concat(curr), [])
            .sort((a, b) => a.timestamp - b.timestamp)
            .map(event => {
                total += event.profit
                return { ...event, totalAccProfit: total, _key: _key++ }
            });

        const resultData = {
            timestamp: +(new Date()),
            totalFedsIncomes: accProfits,
            totalEvents: fedsIncomes,
            feds: FEDS,
        }

        await redisSetWithTimestamp(cacheKey, resultData);

        res.status(200).json(resultData)
    } catch (err) {
        console.error(err);
        // if an error occured, try to return last cached results
        try {
            const cache = await getCacheFromRedis(cacheKey, false);
            if (cache) {
                console.log('Api call failed, returning last cache found');
                res.status(200).json(cache);
            }
        } catch (e) {
            res.status(500).send('')
            console.error(e);
        }
    }
}