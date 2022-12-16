import 'source-map-support'
import { getNetworkConfigConstants } from '@app/util/networks'
import { getCacheFromRedis, redisSetWithTimestamp } from '@app/util/redis'
import { Fed, NetworkIds } from '@app/types';
import { getBnToNumber } from '@app/util/markets'
import { getTxsOf } from '@app/util/covalent';
import { parseUnits } from '@ethersproject/units';

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

const getProfits = async (FEDS: Fed[], TREASURY: string) => {
    const transfers = await Promise.all(
        FEDS.map(fed => getTxsOf(fed.revenueSrcAd||fed.address, 1000, 0, fed.revenueChainId||fed.chainId))
    )

    return await Promise.all(transfers.map(async (r, i) => {
        const fed = FEDS[i];
        const toAddress = (fed.revenueTargetAd||TREASURY).toLowerCase();
        const eventName = fed.isXchain ? 'LogSwapout' : 'Transfer';

        const items = r.data.items
            .filter(item => item.successful)
            .filter(item => !!item.log_events
                .find(e => !!e.decoded && e.decoded.name === eventName
                    && e.decoded.params[0].value.toLowerCase() == fed.address.toLowerCase()
                    && e.decoded.params[1].value.toLowerCase() == toAddress
                ))
            .sort((a, b) => a.block_height - b.block_height);

        return await Promise.all(items.map(async item => {
            const filteredEvents = item.log_events.filter(e => e.decoded.name === eventName && e.decoded.params[0].value.toLowerCase() == fed.address.toLowerCase() && e.decoded.params[1].value.toLowerCase() == toAddress)                
            let revenues = 0;
            const timestamp = +(new Date(item.block_signed_at));
            const dateSplit = item.block_signed_at.substring(0, 10).split('-');
            const histoDateDDMMYYYY = `${dateSplit[2]}-${dateSplit[1]}-${dateSplit[0]}`;
            await Promise.all(filteredEvents.map(async e => {
                const amount = getBnToNumber(parseUnits(e.decoded.params[2].value, 0));
                if(['CRV', 'CVX', 'VELO', 'BAL', 'AURA'].includes(e.sender_contract_ticker_symbol)) {
                    const cgId = COINGECKO_IDS[e.sender_contract_ticker_symbol];
                    const res = await fetch(`https://api.coingecko.com/api/v3/coins/${cgId}/history?date=${histoDateDDMMYYYY}&localization=false`);
                    const historicalData = await res.json();                   
                    const histoPrice = historicalData.market_data.current_price.usd;
                    revenues += histoPrice * amount;
                } else {
                    revenues += amount;
                }
            }))
            return {
                blockNumber: item.block_height,
                timestamp,
                profit: deduceBridgeFees(revenues, fed.chainId),
                transactionHash: item.tx_hash,
            }
        }));
    }));
}

export default async function handler(req, res) {

    const { FEDS, TREASURY } = getNetworkConfigConstants(NetworkIds.mainnet);
    const cacheKey = `revenues-v1.0.11`;

    try {

        const validCache = await getCacheFromRedis(cacheKey, true, 150);
        if (validCache) {
            res.status(200).json(validCache);
            return
        }

        const filteredTransfers = await getProfits(FEDS, TREASURY);
        // add old Convex Fed to Convex Fed
        const convexFed = FEDS.find(f => f.name === 'Convex Fed')!;
        const oldConvexFedProfits = await getProfits([{ ...convexFed, address: convexFed.oldAddress }], TREASURY);        
        const convexFedIndex = FEDS.findIndex(f => f.name === 'Convex Fed');
        filteredTransfers[convexFedIndex] = filteredTransfers[convexFedIndex].concat(oldConvexFedProfits[0]);

        const accProfits: { [key: string]: number } = {};
        let total = 0;
        let _key = 0;

        const fedRevenues = filteredTransfers.map((fedTransfers, fedIndex) => {
            if (!accProfits[fedIndex]) { accProfits[fedIndex] = 0 }
            return fedTransfers.map(t => {
                accProfits[fedIndex] += t.profit;
                return {
                    ...t,
                    fedIndex: fedIndex,
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
            totalRevenues: accProfits,
            totalEvents: fedRevenues,
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