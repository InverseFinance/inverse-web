import 'source-map-support'
import { getCacheFromRedis, getCacheFromRedisAsObj, redisSetWithTimestamp } from '@app/util/redis'
import { NetworkIds } from '@app/types';
import { CHAIN_TOKENS } from '@app/variables/tokens';
import { ARCHIVED_UTC_DATES_BLOCKS } from '@app/fixtures/utc-dates-blocks';
import { DAILY_UTC_CACHE_KEY } from '../cron-daily-block-timestamp';
import { getBnToNumber, getHistoricalTokenData } from '@app/util/markets';
import { getMulticallOutput } from '@app/util/multicall';
import { Contract } from 'ethers';
import { VE_NFT_ABI } from '@app/config/abis';
import { getHistoricalProvider, getPaidProvider, getProvider } from '@app/util/providers';
import { getOrClosest, timestampToUTC } from '@app/util/misc';
import { DRAFT_WHITELIST, ONE_DAY_SECS } from '@app/config/constants';
import { cgPricesCacheKey } from '../prices';
import { getLast100TxsOf } from '@app/util/covalent';
import { fetchZerionTransactionsWithRetry } from '@app/util/zerion';
import { getNetworkConfigConstants } from '@app/util/networks';
import { getLogs } from '@app/util/etherscan';

const startingBlocks = {
    // [NetworkIds.optimism]: 10078713,//veNft v1
    [NetworkIds.optimism]: 105896834,
    [NetworkIds.base]: 3200584,
    [NetworkIds.bsc]: 24435328,
    [NetworkIds.arbitrum]: 69988101,
}

const { MULTISIGS } = getNetworkConfigConstants();

// TODO: refacto historical script part to another file
export default async function handler(req, res) {
    const { ignoreCache } = req.query;
    const cacheKey = `venfts-claims-v1.0.0`;
    const cacheDuration = 3600;
    res.setHeader('Cache-Control', `public, max-age=${cacheDuration}`);
    const { data: cachedData, isValid } = await getCacheFromRedisAsObj(cacheKey, false, cacheDuration);
    try {
        // // if not from cron job, return cached data
        // if (req.method !== 'POST' || req.headers.authorization !== `Bearer ${process.env.API_SECRET_KEY}`) {
        //   return res.status(200).json(cachedData);
        // }

        if (ignoreCache !== 'true' && isValid) {
          res.status(200).send(cachedData);
          return
        }

        const now = Date.now();
        const utcDateNow = timestampToUTC(now);

        const claimAbi = ["event Claimed(uint256 indexed tokenId, uint256 indexed epochStart, uint256 indexed epochEnd, uint256 amount)"];

        const abis = {
            // '0xAAA86B908A3B500A0DE661301ea63966923a97b1': ["event Claimed(uint256 indexed tokenId, uint256 amount, uint256 indexed epochStart, uint256 indexed epochEnd)"],
            // fucking not indexed :/
            '0xA6e0e731Cb1E99AedE0f9C9128d04F948E18727D': ["event Claimed(uint256 tokenId, uint256 amount, uint256 epochStart, uint256 epochEnd)"],
        }

        const codes = {
            [NetworkIds.optimism]: 'optimism',
            [NetworkIds.base]: 'base',
            // [NetworkIds.bsc]: 'bsc',
            // [NetworkIds.arbitrum]: 'arbitrum',
        }

        // RewardDistributors
        const rewardAddresses = {
            [NetworkIds.base]: ['0x227f65131A261548b057215bB1D5Ab2997964C7d'],
            [NetworkIds.optimism]: [
                '0x9D4736EC60715e71aFe72973f7885DCBC21EA99b',
                //'0x5d5Bea9f0Fc13d967511668a60a3369fD53F784F'
            ],
            // [NetworkIds.arbitrum]: [
            //     '0xAAA86B908A3B500A0DE661301ea63966923a97b1',
            //     '0xF6e540DCe09baA7B37A75011ca253c0C889d8aE5',
            //     '0xa5Deb72bB260CEe71379A8C9eaB51d5e24Eb4263',// claimrewards
            // ],
            // [NetworkIds.bsc]: ['0xA6e0e731Cb1E99AedE0f9C9128d04F948E18727D'
            //     //'0xE9fE83aA430Ace4b703C299701142f9dFdde730E'
            // ],
        }

        const veNfts = [
            ...Object
                .values(CHAIN_TOKENS[NetworkIds.optimism]).filter(({ veNftId }) => !!veNftId)
                .map((lp) => ({ chainId: NetworkIds.optimism, ...lp })),
            ...Object
                .values(CHAIN_TOKENS[NetworkIds.base]).filter(({ veNftId }) => !!veNftId)
                .map((lp) => ({ chainId: NetworkIds.base, ...lp })),
            // ...Object
            //     .values(CHAIN_TOKENS[NetworkIds.bsc]).filter(({ veNftId }) => !!veNftId)
            //     .map((lp) => ({ chainId: NetworkIds.bsc, ...lp })),
            // ...Object
            //     .values(CHAIN_TOKENS[NetworkIds.arbitrum]).filter(({ veNftId }) => veNftId === '31')
            //     .map((lp) => ({ chainId: NetworkIds.arbitrum, ...lp })),
        ];

        const claimEvents = await Promise.all(
            veNfts.map(v => {
                const rewardDistributors = rewardAddresses[v.chainId];
                return Promise.all(
                    rewardDistributors.map(rd => {
                        const contract = new Contract(rd, abis[rd] || claimAbi, getPaidProvider(v.chainId));
                        return contract.queryFilter(contract.filters.Claimed(v.veNftId), startingBlocks[v.chainId])
                        // return contract.queryFilter(contract.filters.Claimed(), 42940125, 42940135)
                    })
                )
            })
        );

        // return res.status(200).send({
        //     veNfts,
        //     // eth: await getLogs('0xA6e0e731Cb1E99AedE0f9C9128d04F948E18727D', NetworkIds.bsc),
        //     // claimEvents,
        // });

        const claimTxHashes = [...new Set(claimEvents.map(veNftClaims => veNftClaims.flat().map(e => e.transactionHash)).flat())].map(h => h.toLowerCase());
   
        const zerionData = await Promise.all(
            veNfts.map(v => {
                const multisig = MULTISIGS.find(m => m.chainId === v.chainId && m.shortName.includes('TWG'));
                return fetchZerionTransactionsWithRetry(
                    v?.twgAddress || multisig?.address,
                    codes[v.chainId],
                    true,
                )
            })
        );

        const results = {
            timestamp: now,
            // claimTxHashes,
            // zerionData,
            veNfts: veNfts
                .map((veNft, vi) => {
                    return {
                        ...veNft,
                        claims: zerionData[vi]
                            ?.filter(t => t.attributes.status === 'confirmed' && claimTxHashes.includes(t.attributes.hash.toLowerCase()))
                            .map(t => {
                                const timestamp = new Date(t.attributes.mined_at).getTime();
                                const multisig = MULTISIGS.find(m => m.chainId === veNft.chainId && m.shortName.includes('TWG'));
                                return {
                                    txHash: t.attributes.hash,
                                    block: t.attributes.mined_at_block,
                                    timestamp,
                                    utcDate: timestampToUTC(timestamp),
                                    totalValue: t.attributes.transfers
                                        .filter(tf => tf.direction === 'in'
                                            && tf.recipient.toLowerCase() === (veNft.twgAddress || multisig?.address).toLowerCase()
                                        )
                                        .reduce((prev, curr) => prev + curr.value, 0),
                                }
                            })
                    }
                })
        };

        await redisSetWithTimestamp(cacheKey, results);    

        return res.status(200).send(results);
    } catch (err) {
        console.error(err);
        // if an error occured, try to return last cached results
        try {
            if (cachedData) {
                console.log('Api call failed, returning last cache found');
                res.status(200).send(cachedData);
            } else {
                res.status(500).send({ success: false });
            }
        } catch (e) {
            console.error(e);
            res.status(500).send({ success: false });
        }
    }
}