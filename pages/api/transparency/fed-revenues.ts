import 'source-map-support'
import { getNetworkConfigConstants } from '@app/util/networks'
import { getCacheFromRedis, redisSetWithTimestamp } from '@app/util/redis'
import { NetworkIds } from '@app/types';
import { getBnToNumber } from '@app/util/markets'
import { getTxsOf } from '@app/util/covalent';
import { parseUnits } from '@ethersproject/units';

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

export default async function handler(req, res) {

    const { FEDS, TREASURY } = getNetworkConfigConstants(NetworkIds.mainnet);
    const cacheKey = `revenues-v1.0.7`;

    try {

        const validCache = await getCacheFromRedis(cacheKey, true, 150);
        if (validCache) {
            res.status(200).json(validCache);
            return
        }

        const transfers = await Promise.all(
            FEDS.map(fed => getTxsOf(fed.address, 1000, 0, fed.chainId))
        )

        const filteredTransfers = transfers.map((r, i) => {
            const fed = FEDS[i];
            const toAddress = TREASURY.toLowerCase();
            const eventName = fed.isXchain ? 'LogSwapout' : 'Transfer';

            const items = r.data.items
                .filter(item => item.successful)
                .filter(item => !!item.log_events
                    .find(e => !!e.decoded && e.decoded.name === eventName
                        && e.decoded.params[0].value.toLowerCase() == fed.address.toLowerCase()
                        && e.decoded.params[1].value.toLowerCase() == toAddress
                    ))
                .sort((a, b) => a.block_height - b.block_height);

            return items.map(item => {
                const filteredEvent = item.log_events.find(e => e.decoded.name === eventName && e.decoded.params[0].value.toLowerCase() == fed.address.toLowerCase() && e.decoded.params[1].value.toLowerCase() == toAddress)
                const amount = filteredEvent.decoded.params[2].value;
                return {
                    blockNumber: item.block_height,
                    timestamp: +(new Date(item.block_signed_at)),
                    profit: deduceBridgeFees(getBnToNumber(parseUnits(amount, 0)), fed.chainId),
                    transactionHash: item.tx_hash,
                }
            });
        });

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