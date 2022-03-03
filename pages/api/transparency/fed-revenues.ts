import 'source-map-support'
import { getNetworkConfig, getNetworkConfigConstants } from '@app/util/networks'
import { getCacheFromRedis, redisSetWithTimestamp } from '@app/util/redis'
import { NetworkIds } from '@app/types';
import { getBnToNumber } from '@app/util/markets'
import { getTransfers } from '@app/util/covalent';
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
    if(fees) {
        const hypotheticalFee = value * fees.fee;
        if(hypotheticalFee < fees.min) {
            return value - fees.min;
        } else if(hypotheticalFee > fees.max) {
            return value - fees.max;
        } else {
            return value - hypotheticalFee;
        }
    }
    return value;
}

export default async function handler(req, res) {

    const { DOLA, FEDS, TREASURY } = getNetworkConfigConstants(NetworkIds.mainnet);
    const ftmConfig = getNetworkConfig(NetworkIds.ftm, false);
    const cacheKey = `revenues-v1.0.3`;

    try {

        const validCache = await getCacheFromRedis(cacheKey, true, 300);
        if (validCache) {
            res.status(200).json(validCache);
            return
        }

        const feds = FEDS;

        const transfers = await Promise.all(
            feds.map(fed => getTransfers(fed.isXchain ? ftmConfig?.DOLA! :  DOLA, fed.address, 1000, 0, fed.chainId))
        )

        const filteredTransfers = transfers.map((r, i) => {
            const fed = feds[i];
            const toAddress = fed.isXchain ? '0x0000000000000000000000000000000000000000' : TREASURY.toLowerCase();  

            const items = r.data.items
                .filter(item => item.successful)
                .filter(item => !!item.transfers.find(t => t.to_address?.toLowerCase() === toAddress))
                .sort((a, b) => a.block_height - b.block_height);

                return items.map(item => {
                    const filtered = item.transfers.find(t => t.to_address?.toLowerCase() === toAddress)
                    return {
                        blockNumber: item.block_height,
                        timestamp: +(new Date(item.block_signed_at)),
                        profit: deduceBridgeFees(getBnToNumber(parseUnits(filtered.delta, 0)), fed.chainId),
                        transactionHash: item.tx_hash,
                    }
                });
        });

        const accProfits: { [key: string]: number } = {};
        let total = 0;

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
                return { ...event, totalAccProfit: total }
            });

        const resultData = {
            totalRevenues: accProfits,
            totalEvents: fedRevenues,
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