import { Contract } from 'ethers'
import 'source-map-support'
import { BONDS_ABIS, BOND_V2_FIXED_TELLER_ABI } from '@app/config/abis'

import { getProvider } from '@app/util/providers';
import { getCacheFromRedis, redisSetWithTimestamp } from '@app/util/redis'
import { NetworkIds } from '@app/types';
import { getBnToNumber } from '@app/util/markets'
import { BONDS, TOKENS, getToken } from '@app/variables/tokens';
import { addBlockTimestamps } from '@app/util/timestamps';
import { BLOCKS_PER_DAY, ONE_DAY_SECS } from '@app/config/constants';
import { BOND_V2_FIXED_TERM, BOND_V2_FIXED_TERM_TELLER } from '@app/variables/bonds';
import { BONDS_V2_IDS_API_CACHE_KEY } from '../bonds';
import { getBondV2Contract } from '@app/util/bonds';

export default async function handler(req, res) {

    const cacheKey = `bonds-cache-v1.0.4`;

    try {
        const cacheDuration = 600;
        res.setHeader('Cache-Control', `public, max-age=${cacheDuration}`);
        const validCache = await getCacheFromRedis(cacheKey, true, cacheDuration);
        if (validCache) {
          res.status(200).json(validCache);
          return
        }

        const provider = getProvider(NetworkIds.mainnet);

        const depositsV1 = await Promise.all(
            BONDS.map(b => {
                const contract = new Contract(b.bondContract, BONDS_ABIS[b.abiType], provider)
                return contract.queryFilter(contract.filters.BondCreated())
            })
        );

        // bonds V2 with bond protocol
        const allV2BondsMarketIds = await getCacheFromRedis(BONDS_V2_IDS_API_CACHE_KEY, false) || ["3","23","63","98"];

        const [depositsV2, marketInfos, terms] = await Promise.all([
            Promise.all(
                allV2BondsMarketIds.map(v2id => {
                    const contract = new Contract(BOND_V2_FIXED_TERM_TELLER, BOND_V2_FIXED_TELLER_ABI, provider);                
                    return contract.queryFilter(contract.filters.Bonded(parseInt(v2id)));
                })
            ),
            Promise.all(allV2BondsMarketIds.map(id => getBondV2Contract(BOND_V2_FIXED_TERM, provider).markets(id))),
            Promise.all(allV2BondsMarketIds.map(id => getBondV2Contract(BOND_V2_FIXED_TERM, provider).terms(id))),
        ]);

        const blocks = depositsV1.map(d => d.map(e => e.blockNumber)).flat()
            .concat(depositsV2.map(d => d.map(e => e.blockNumber)).flat());

        const timestamps = await addBlockTimestamps(
            blocks,
            NetworkIds.mainnet,
        );        

        const formattedDepositsV1 = depositsV1.map((d, i) => {
            const bond = BONDS[i];
            return d.map(e => {
                const expires = getBnToNumber(e.args[2], 0);
                const duration = Math.round((expires - e.blockNumber) / BLOCKS_PER_DAY);
                return {
                    timestamp: timestamps[NetworkIds.mainnet][e.blockNumber] * 1000,
                    input: bond.underlying.symbol,
                    duration,
                    type: `${bond.underlying.symbol}-${duration}`,
                    inputAmount: getBnToNumber(e.args[0]),
                    outputAmount: getBnToNumber(e.args[1]),
                    txHash: e.transactionHash,
                }
            })
        }).flat();

        const formattedDepositsV2 = depositsV2.map((d, i) => {
            const underlying = getToken(TOKENS, marketInfos[i][2]);
            const vestingDays = Math.round(parseFloat(terms[i][2].toString()) / ONE_DAY_SECS);
            return d.map(e => {
                return {
                    timestamp: timestamps[NetworkIds.mainnet][e.blockNumber] * 1000,
                    input: underlying.symbol,
                    duration: vestingDays,
                    type: `${underlying.symbol}-${vestingDays}-v2`,
                    inputAmount: getBnToNumber(e.args.amount),
                    outputAmount: getBnToNumber(e.args.payout),
                    txHash: e.transactionHash,
                }
            })
        }).flat();

        const formattedDeposits = formattedDepositsV1.concat(formattedDepositsV2);
        formattedDeposits.sort((a, b) => a.timestamp - b.timestamp);

        const acc = { 'output': 0 };

        const resultData = {
            lastUpdate: (+new Date()),
            deposits: formattedDeposits.map(d => {
                if (!acc[d.input]) { acc[d.input] = 0 }
                if (!acc[d.type]) { acc[d.type] = 0 }
                acc[d.type] += d.inputAmount;
                acc[d.input] += d.inputAmount;
                acc['output'] += d.outputAmount;
                return {
                    ...d,
                    accInputAmount: acc[d.input],
                    accTypeAmount: acc[d.type],
                    accOutputAmount: acc['output'],
                };
            }),
            acc,
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
            console.error(e);
        }
    }
}