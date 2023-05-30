import 'source-map-support'
import { getNetworkConfigConstants } from '@app/util/networks'
import { getCacheFromRedis, redisSetWithTimestamp } from '@app/util/redis'
import { Fed, NetworkIds } from '@app/types';
import { getBnToNumber } from '@app/util/markets'
import { getTxsOf } from '@app/util/covalent';
import { parseUnits } from '@ethersproject/units';
import { pricesCacheKey } from '../prices';
import { throttledPromises } from '@app/util/misc';

const COINGECKO_IDS = {
    'CRV': 'curve-dao-token',
    'CVX': 'convex-finance',
    'VELO': 'velodrome-finance',
    'BAL': 'balancer',
    'AURA': 'aura-finance',
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

const getProfits = async (FEDS: Fed[], TREASURY: string, cachedCurrentPrices: { [key: string]: number }, cachedTotalEvents?: any) => {
    const transfers = await throttledPromises(
        (fed: Fed) => getTxsOf(fed.incomeSrcAd || fed.address, 1000, 0, fed.incomeChainId || fed.chainId),
        FEDS,
        // max 5 req per sec
        5,
        500,
    );

    return await Promise.all(transfers.map(async (r, i) => {
        const fed = FEDS[i];

        if(fed.hasEnded && !!cachedTotalEvents) {
            return cachedTotalEvents.filter(event => event.fedIndex === i);
        }

        const toAddress = (fed?.incomeTargetAd || TREASURY)?.toLowerCase();
        const srcAddress = (fed?.incomeSrcAd || fed?.address)?.toLowerCase();
        const eventName = fed?.isXchain ? 'LogSwapout' : 'Transfer';
        
        const items = r.data.items
                .filter(item => item.successful)
                .filter(item => !!item.log_events
                    .find(e => !!e.decoded && e.decoded.name === eventName
                        && e?.decoded?.params[0]?.value?.toLowerCase() == srcAddress
                        && e?.decoded?.params[1]?.value?.toLowerCase() == toAddress
                    ))
                .sort((a, b) => a.block_height - b.block_height);

        return await Promise.all(items.map(async item => {
            const filteredEvents = item.log_events
                .filter(e => !!e.decoded && e.decoded.name === eventName
                    && e?.decoded?.params[0]?.value?.toLowerCase() == srcAddress
                    && e?.decoded?.params[1]?.value?.toLowerCase() == toAddress
                )
            let income = 0;
            const timestamp = +(new Date(item.block_signed_at));
            const dateSplit = item.block_signed_at.substring(0, 10).split('-');
            const histoDateDDMMYYYY = `${dateSplit[2]}-${dateSplit[1]}-${dateSplit[0]}`;
            await Promise.all(filteredEvents.map(async e => {
                const amount = getBnToNumber(parseUnits(e.decoded.params[2].value, 0));
                if (['CRV', 'CVX', 'VELO', 'BAL', 'AURA'].includes(e.sender_contract_ticker_symbol)) {
                    const cgId = COINGECKO_IDS[e.sender_contract_ticker_symbol];
                    let histoPrice = 1;
                    const histoCacheKey = `price-${cgId}-${histoDateDDMMYYYY}`;
                    const cachedHistoPrice = await getCacheFromRedis(histoCacheKey, false);

                    if (!cachedHistoPrice) {
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
    }));
}

export default async function handler(req, res) {
    const { cacheFirst } = req.query;
    const { FEDS, TREASURY } = getNetworkConfigConstants(NetworkIds.mainnet);
    const cacheKey = `revenues-v1.0.14`;

    try {
        const cacheDuration = 900;
        res.setHeader('Cache-Control', `public, max-age=${cacheDuration}`);
        const validCache = await getCacheFromRedis(cacheKey, cacheFirst !== 'true', cacheDuration);
        if (validCache) {
            res.status(200).json(validCache);
            return
        }

        const [archived, cachedCurrentPrices] = await Promise.all([
            getCacheFromRedis(cacheKey, false),
            getCacheFromRedis(pricesCacheKey, false),
        ]);

        let withOldAddresses: (Fed & { oldAddress: string })[] = [];
        FEDS.filter(fed => !!fed.oldAddresses).forEach(fed => {
            fed.oldAddresses?.forEach(oldAddress => withOldAddresses.push({ ...fed, oldAddress }));
        });
        const [filteredTransfers, oldFilteredTransfers] = await Promise.all(
            [
                getProfits(FEDS, TREASURY, cachedCurrentPrices, archived.totalEvents),
                getProfits(withOldAddresses.map(f => ({ ...f, address: f.oldAddress })), TREASURY, cachedCurrentPrices, []),
            ]
        );

        withOldAddresses.forEach((old, i) => {
            const fedIndex = FEDS.findIndex(f => f.name === old.name);
            filteredTransfers[fedIndex] = filteredTransfers[fedIndex].concat(oldFilteredTransfers[i]);
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