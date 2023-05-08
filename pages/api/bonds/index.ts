import { Contract } from 'ethers'
import 'source-map-support'
import { BOND_V2_AGGREGATOR_ABI } from '@app/config/abis'
import { getProvider } from '@app/util/providers';
import { getCacheFromRedis, redisSetWithTimestamp } from '@app/util/redis'
import { BOND_V2_AGGREGATOR, BOND_V2_FIXED_TERM } from '@app/variables/bonds'
import { getBondV2Contract } from '@app/util/bonds'
import { getBnToNumber } from '@app/util/markets'
import { getToken, REWARD_TOKEN, TOKENS } from '@app/variables/tokens'
import { ONE_DAY_SECS } from '@app/config/constants';

const PAYOUT_TOKEN = process.env.NEXT_PUBLIC_REWARD_TOKEN!;

export const BONDS_V2_API_CACHE_KEY = 'bonds-v2.0.4'
export const BONDS_V2_IDS_API_CACHE_KEY = 'bonds-ids-v1.0.0'

export default async function handler(req, res) {
    try {
        const validCache = await getCacheFromRedis(BONDS_V2_API_CACHE_KEY, true, 30);
        if(validCache) {
          res.status(200).send(validCache);
          return
        }

        const provider = getProvider(process.env.NEXT_PUBLIC_CHAIN_ID!);
        const contract = new Contract(BOND_V2_AGGREGATOR, BOND_V2_AGGREGATOR_ABI, provider);
        
        const envBondsIds = process.env.NEXT_PUBLIC_BONDS_IDS;
        let liveMarketsIds: string[];
        if(!envBondsIds) {
            const data = await contract.liveMarketsFor(PAYOUT_TOKEN, true);
            const liveMarketsForINV = Array.isArray(data) ? data : [data];
            liveMarketsIds = liveMarketsForINV.map(b => b.toString());    
        } else {
            liveMarketsIds = envBondsIds.replace(/\s+/g, '').split(',');
        }

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
            const scale = getBnToNumber(marketInfos[i][11], 0);
            const bondPrice = !!prices && !!prices[i] ? getBnToNumber(prices[i], 0)/scale : 0
            const conclusion = parseFloat(terms[i][3].toString()) * 1000;

            return {
                id,
                bondContract: BOND_V2_FIXED_TERM,
                output: PAYOUT_TOKEN,
                bondPrice,
                inputUsdPrice: 1,
                owner: marketInfos[i][0],
                underlying: getToken(TOKENS, marketInfos[i][2]),
                howToGetLink: 'https://inverse.finance/swap',
                input: marketInfos[i][2],
                teller: tellers[i],
                capacityInQuote: marketInfos[i][4],
                capacity: getBnToNumber(marketInfos[i][5], REWARD_TOKEN?.decimals),
                totalDebt: getBnToNumber(marketInfos[i][6], REWARD_TOKEN?.decimals),
                minPrice: getBnToNumber(marketInfos[i][7], 0)/scale,
                maxPayout: getBnToNumber(marketInfos[i][8], REWARD_TOKEN?.decimals),
                sold: getBnToNumber(marketInfos[i][9], REWARD_TOKEN?.decimals),
                purchased: getBnToNumber(marketInfos[i][10], REWARD_TOKEN?.decimals),
                scale: getBnToNumber(marketInfos[i][11], 0),
                // terms
                controlVar: terms[i][0],
                maxDebt: parseFloat(terms[i][1].toString()),
                vestingDays: Math.round(parseFloat(terms[i][2].toString()) / ONE_DAY_SECS),
                conclusion,
                isNotConcluded: now < conclusion,
            }
        })

        // includes closed markets
        const allMarketIds = await getCacheFromRedis(BONDS_V2_IDS_API_CACHE_KEY, false) || [];
        bonds.forEach(b => {
            if(!allMarketIds.includes(b.id)) {
                allMarketIds.push(b.id);
            }
        });

        const result = {
            bonds,
            allMarketIds,
        }

        await redisSetWithTimestamp(BONDS_V2_IDS_API_CACHE_KEY, allMarketIds);
        await redisSetWithTimestamp(BONDS_V2_API_CACHE_KEY, result);

        res.status(200).send(result);
    } catch (err) {
        console.error(err);
        // if an error occured, try to return last cached results
        try {
            const cache = await getCacheFromRedis(BONDS_V2_API_CACHE_KEY, false);
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