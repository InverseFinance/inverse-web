import { Contract } from 'ethers'
import 'source-map-support'
import { BOND_V2_AGGREGATOR_ABI } from '@app/config/abis'
import { getNetworkConfig } from '@app/util/networks'
import { getProvider } from '@app/util/providers';
import { getCacheFromRedis, redisSetWithTimestamp } from '@app/util/redis'
import { BOND_V2_AGGREGATOR, BOND_V2_FIXED_TERM } from '@app/variables/bonds'
import { getBondV2Contract } from '@app/util/bonds'
import { getBnToNumber } from '@app/util/markets'
import { getToken, REWARD_TOKEN, TOKENS } from '@app/variables/tokens'

const PAYOUT_TOKEN = process.env.NEXT_PUBLIC_REWARD_TOKEN!;
// const PAYOUT_TOKEN = '0x4C1948bf7E33c711c488f765B3A8dDD9f7bEECb4';

export default async function handler(req, res) {
    const networkConfig = getNetworkConfig(process.env.NEXT_PUBLIC_CHAIN_ID!, true)!;
    const cacheKey = `${networkConfig.chainId}-bonds-v2.0.0`;

    try {
        const validCache = await getCacheFromRedis(cacheKey, true, 30);
        if(validCache) {
          res.status(200).send(validCache);
          return
        }

        const provider = getProvider(networkConfig.chainId);
        const contract = new Contract(BOND_V2_AGGREGATOR, BOND_V2_AGGREGATOR_ABI, provider);

        // todo: register with aggregator
        // const data = await contract.liveMarketsFor(PAYOUT_TOKEN, true);
        // const liveMarketsForINV = Array.isArray(data) ? data : [data];
        // const liveMarketsIds = liveMarketsForINV.map(b => b.toString());
        const liveMarketsIds = ['102', '103'];

        const [
            prices,
            tellers,
            marketInfos,
            terms,
        ] = await Promise.all([
            Promise.all(liveMarketsIds.map(id => contract.marketPrice(id))),
            Promise.all(liveMarketsIds.map(id => contract.getTeller(id))),
            Promise.all(liveMarketsIds.map(id => getBondV2Contract(BOND_V2_FIXED_TERM, provider).markets(id))),
            Promise.all(liveMarketsIds.map(id => getBondV2Contract(BOND_V2_FIXED_TERM, provider).terms(id))),
        ]);          
        
        const now = Date.now();

        const bonds = liveMarketsIds.map((id, i) => {
            const bondPrice = !!prices && !!prices[i] ? getBnToNumber(prices[i], 36) : 0
            const conclusion = parseFloat(terms[i][3].toString()) * 1000;
            return {
                id,
                bondContract: BOND_V2_FIXED_TERM,
                output: PAYOUT_TOKEN,
                bondPrice,
                inputUsdPrice: 1,
                underlying: getToken(TOKENS, marketInfos[i][2]),
                howToGetLink: 'https://inverse.finance/swap',
                input: marketInfos[i][2],
                teller: tellers[i],
                capacityInQuote: marketInfos[i][4],
                capacity: getBnToNumber(marketInfos[i][5], REWARD_TOKEN?.decimals),
                totalDebt: getBnToNumber(marketInfos[i][6], REWARD_TOKEN?.decimals),
                minPrice: getBnToNumber(marketInfos[i][7], REWARD_TOKEN?.decimals),
                maxPayout: getBnToNumber(marketInfos[i][8], REWARD_TOKEN?.decimals),
                sold: getBnToNumber(marketInfos[i][9], REWARD_TOKEN?.decimals),
                purchased: getBnToNumber(marketInfos[i][10], REWARD_TOKEN?.decimals),
                scale: getBnToNumber(marketInfos[i][11], REWARD_TOKEN?.decimals),
                // terms
                controlVar: terms[i][0],
                maxDebt: parseFloat(terms[i][1].toString()),
                vestingDays: Math.round(parseFloat(terms[i][2].toString()) / 86400),
                conclusion,
                isNotConcluded: now < conclusion,
            }
        })

        const result = {
            bonds,
        }

        await redisSetWithTimestamp(cacheKey, result);

        res.status(200).send(result);
    } catch (err) {
        console.error(err);
        // if an error occured, try to return last cached results
        try {
            const cache = await getCacheFromRedis(cacheKey, false);
            if (cache) {
                console.log('Api call failed, returning last cache found');
                res.status(200).send(cache);
            } else {
                res.status(500).send({})
            }
        } catch (e) {
            console.error(e);
            res.status(500).send({})
        }
    }
}