import { Contract } from 'ethers'
import 'source-map-support'
import { ERC20_ABI } from '@app/config/abis'
import { getNetworkConfigConstants } from '@app/util/networks'
import { getProvider } from '@app/util/providers';
import { getCacheFromRedis, getCacheFromRedisAsObj, redisSetWithTimestamp } from '@app/util/redis'
import { Multisig, NetworkIds, Token } from '@app/types';
import { getBnToNumber, getYieldOppys } from '@app/util/markets'
import { CHAIN_TOKENS } from '@app/variables/tokens';
import { fedOverviewCacheKey } from './fed-overview';
import { getCurveNestedLpData, getLPBalances, getUniV3PositionsOf } from '@app/util/contracts';
import { pricesCacheKey } from '../prices';
import { PROTOCOLS_BY_IMG, PROTOCOL_DEFILLAMA_MAPPING } from '@app/variables/images';
import { NETWORKS_BY_CHAIN_ID } from '@app/config/networks';

export const liquidityCacheKey = `liquidity-v1.2.93`;

export default async function handler(req, res) {
    const { cacheFirst } = req.query;
    const { TREASURY, MULTISIGS } = getNetworkConfigConstants(NetworkIds.mainnet);
    try {
        const cacheDuration = 180;
        res.setHeader('Cache-Control', `public, max-age=${cacheDuration}`);
        const { data: cachedData, isValid } = await getCacheFromRedisAsObj(liquidityCacheKey, cacheFirst !== 'true', cacheDuration);
        if (isValid && cachedData) {
            res.status(200).json(cachedData);
            return
        }

        // TODO: refacto as service
        // refresh Fed overview data & prices
        // trigger for next call
        fetch('https://www.inverse.finance/api/transparency/fed-overview');
        // fetch overview cache
        await Promise.all([
            fetch('https://www.inverse.finance/api/transparency/fed-overview?cacheFirst=true'),
            // fetch('https://www.inverse.finance/api/prices'),
        ]);
        const fedsOverviewCache = await getCacheFromRedis(fedOverviewCacheKey, false);

        const multisigsToShow = MULTISIGS;

        const chainLpsToCheck = [
            NetworkIds.mainnet,
            NetworkIds.optimism,
            NetworkIds.bsc,
            NetworkIds.arbitrum,
            NetworkIds.polygon,
            NetworkIds.avalanche,
            NetworkIds.base,
            NetworkIds.mode,
            NetworkIds.blast,
        ];

        const lps = chainLpsToCheck.map(chainId => {
            return Object
            .values(CHAIN_TOKENS[chainId]).filter(({ isLP }) => isLP)
            .map((lp) => ({ chainId, ...lp }))
        }).flat();

        const TWG = multisigsToShow.find(m => m.shortName === 'TWG')!;

        const [univ3TWGpositions, yields] = await Promise.all([
            getUniV3PositionsOf(getProvider('1'), TWG.address),
            getYieldOppys(),
        ]);

        const chainTWG: { [key: string]: Multisig } = {
            [NetworkIds.mainnet]: TWG,
            [NetworkIds.ftm]: multisigsToShow.find(m => m.shortName === 'TWG on FTM')!,
            [NetworkIds.optimism]: multisigsToShow.find(m => m.shortName === 'TWG on OP')!,
            [NetworkIds.bsc]: multisigsToShow.find(m => m.shortName === 'TWG on BSC')!,
            [NetworkIds.arbitrum]: multisigsToShow.find(m => m.shortName === 'TWG on ARB 1')!,
            [NetworkIds.polygon]: multisigsToShow.find(m => m.shortName === 'TWG on PLG')!,
            [NetworkIds.avalanche]: multisigsToShow.find(m => m.shortName === 'TWG on AVAX')!,
            [NetworkIds.base]: multisigsToShow.find(m => m.shortName === 'TWG on BASE')!,
            [NetworkIds.mode]: multisigsToShow.find(m => m.shortName === 'TWG on MODE')!,
        }

        const fedPols = fedsOverviewCache?.fedOverviews || [];

        const prices = (await getCacheFromRedis(pricesCacheKey, false)) || {};

        // TODO: temp skip some low / inactive lps
        const lpsToSkipCalc = ['0x6a279e847965ba5dDc0AbFE8d669642F73334A2C', '0x20BB4a325924917E3336753BA5350a84F70f392e', '0x57a2c7925bAA1894a939f9f6721Ea33F2EcFD0e2', '0xc7C1B907BCD3194C0D9bFA2125251af98BdDAfbb', '0x0404d05F3992347d2f0dC3a97bdd147D77C85c1c', '0xA36d3799eA28f4B75653EBF9D91DDA4519578086', '0x445494F823f3483ee62d854eBc9f58d5B9972A25', '0x0995a508dF9606f1C6D512a2d6BA875Cf3cE94C3', '0xbCe40f1840A449cAAaF374Df0A1fEe1e212784CB', '0x08c0833AF1331831759b8e0BFeF1BC5738436325', '0x1Fc80CfCF5B345b904A0fB36d4222196Ed9eB8a5', '0x342D24F2a3233F7Ac8A7347fA239187BFd186066', '0xfb5137Aa9e079DB4b7C2929229caf503d0f6DA96', '0xcC2EFb8bEdB6eD69ADeE0c3762470c38D4730C50', '0xe5F625e8f4D2A038AE9583Da254945285E5a77a4', '0x6949145469362F9eeaB3c96Ea41b51D9B4cC2b21', '0x9a2d1b49b7c8783E37780AcE4ffA3416Eea64357', '0x5a473b418193C6a3967aF0913135534B7b3B23E9', '0x92104a7BeC32297DdD022A8f242bf498d0470876', '0x052f7890E50fb5b921BCAb3B10B79a58A3B9d40f', '0x8806e6B5F57C780180827E77115794d9C8100Cb7', '0xAc7025Dec5E216025C76414f6ac1976227c20Ff0', '0x394DeB5c87e1df9aa7400e99F5cd27a0cD0A64f2', '0x8B0630Cb57d8E63444E97C19a2e82Bb1988399e2', '0x72b11596523B35b2ACac5A33915b6297f5e942Ac', '0x896ffE2cd28Ba13ddDa98103a3B66E82bb36BeE3', '0x867dFdb75786c58f6fDf64d955EA2524A147a98C', '0xb701382d647C0EB171D33b8F30B1DF2214F9Bba4'];

        const getPol = async (lp: Token & { chainId: string }) => {
            const isSkippCalc = lpsToSkipCalc.includes(lp.address);
            if (isSkippCalc) {
                return cachedData?.liquidity?.find(l => l.address === lp.address);
            }
            // final protocol in the Fed strategy for the lp
            const fedPol = fedPols.find(f => {
                return f?.strategy?.pools?.[f?.strategy?.pools?.length - 1]?.address?.toLowerCase() === lp.address?.toLowerCase();
            });

            // case where Fed has an LP that is then staked in a protocol, relatedFedPol is the original protocol for the lp
            const relatedFedPol = fedPols.find(f => {
                return !!f?.strategy?.pools?.find(p => p.address?.toLowerCase() === lp.address?.toLowerCase());
            });
            const fedPolData = fedPol || relatedFedPol;

            const provider = getProvider(lp.chainId);

            const protocol = PROTOCOLS_BY_IMG[lp.protocolImage];
            const defiLlamaProjectName = PROTOCOL_DEFILLAMA_MAPPING[protocol];
            const lpName = lp.symbol.replace(/(-LP|-SLP|-AURA| [a-zA-Z0-9]*lp)/ig, '').replace(/-ETH/ig, '-WETH');
            const balancerPoolAd = lp.balancerInfos?.poolId?.substring(0, 42)?.toLowerCase();
            const yieldData = yields.find(y => {
                return y.pool === lp.defillamaPoolId || (defiLlamaProjectName === y.project
                    && (y.underlyingTokens?.length > 0 ? y.underlyingTokens.join(',').toLowerCase() === lp.pairs?.filter(pa => pa.toLowerCase() !== balancerPoolAd).join(',').toLowerCase() : y.symbol === lpName))
            });

            const subBalances = fedPol?.subBalances || (await getLPBalances(lp, lp.chainId, provider));
            const isDolaMain = lp.symbol.includes('DOLA');
            const isSDolaMain = lp.symbol.toUpperCase().includes('SDOLA') && !/(^DOLA|.*-DOLA.*)/i.test(lp.symbol);
            const virtualTotalSupply = subBalances.reduce((prev, curr) => prev + curr.balance, 0);

            const mainPart = subBalances.find(d => d.symbol.toUpperCase() === (isSDolaMain ? 'SDOLA' : isDolaMain ? 'DOLA' : 'INV'));
            const pairPart = subBalances.find(d => d.symbol.toUpperCase() !== (isSDolaMain ? 'SDOLA' : isDolaMain ? 'DOLA' : 'INV'));
            const dolaWorth = (mainPart?.balance || 0) * (prices[isSDolaMain ? 'staked-dola' : isDolaMain ? 'dola-usd' : 'inverse-finance'] || 1);

            let dolaFraxBpCase;
            if (lp.isNestedCrvLp) {
                dolaFraxBpCase = await getCurveNestedLpData(lp, [prices['frax'], prices['usd-coin']], provider);
                dolaFraxBpCase.tvl = dolaFraxBpCase.depth + dolaWorth;
            }

            const srcTvl = subBalances.reduce((prev, curr) => prev + curr.balance * (prices[curr.coingeckoId || curr.symbol] || 1), 0);
            const tvl = lp.isUniV3 ? srcTvl : dolaFraxBpCase?.tvl || yieldData?.tvlUsd || srcTvl;
            const virtualLpPrice = tvl / virtualTotalSupply;

            const dolaPerc = dolaFraxBpCase?.tvl ? (dolaWorth / dolaFraxBpCase?.tvl) : (dolaWorth / srcTvl);
            let ownedAmount = 0;
            const owned: { [key: string]: number } = {};
            if (!fedPolData) {
                const contract = new Contract(lp.lpBalanceContract || lp.address, ERC20_ABI, provider);
                if (lp.isCrvLP && !!lp.poolAddress) {
                    const [lpBal, lpSupply] = await Promise.all([
                        contract.balanceOf(TWG.address),
                        contract.totalSupply(),
                    ]);
                    const share = getBnToNumber(lpBal) / getBnToNumber(lpSupply);
                    owned.twg = share * tvl;
                } else if (!lp.isUniV3) {
                    const twgAd = lp.twgAddress || chainTWG[lp.chainId]?.address;
                    owned.twg = !twgAd ? 0 : getBnToNumber(await contract.balanceOf(twgAd));
                    if (lp.chainId === NetworkIds.mainnet) {
                        // no more
                        // owned.bondsManager = getBnToNumber(await contract.balanceOf(OP_BOND_MANAGER));
                        owned.treasuryContract = getBnToNumber(await contract.balanceOf(TREASURY));
                    }
                } else {
                    // univ3 pool liquidity
                    const univ3liquidity = getBnToNumber(await (new Contract((lp.uniV3Pool || lp.address), ['function liquidity() public view returns (uint)'], provider)).liquidity());
                    // share of twg
                    const univ3liquidityOwnedByTWG = univ3TWGpositions
                        .filter(p => p.token0 === lp.pairs[0] && p.token1 === lp.pairs[1])
                        .reduce((prev, curr) => prev + getBnToNumber(curr.liquidity), 0);
                    const share = univ3liquidity ? univ3liquidityOwnedByTWG / univ3liquidity : 0;
                    owned.twg = share * tvl;
                }
                ownedAmount = Object.values(owned).reduce((prev, curr) => prev + curr, 0)
                    * (lp.isStable && !/SDOLA/i.test(lp.symbol) ? virtualLpPrice : (prices[lp.coingeckoId || lp.symbol] || 1));
            } else {
                ownedAmount = fedPolData.dontUseSupplyForPolCalc ? fedPolData.lpBalance * fedPolData.lpPrice : fedPolData.supply;
            }
            ownedAmount = ownedAmount || 0;
            const perc = Math.min(ownedAmount / tvl * 100, 100);

            // bb-e-usd exception due to euler exploit to not throw off avgs
            const apy = lpName.toLowerCase().includes('-bb-e') ? 0 : yieldData?.apy;
            const isFed = !!fedPol;

            return {
                ...lp,
                lpName,
                apy,
                apyMean30d: yieldData?.apyMean30d,
                protocol,
                project: defiLlamaProjectName || protocol,
                networkName: NETWORKS_BY_CHAIN_ID[lp.chainId].name,
                tvl,
                srcTvl,
                dolaFraxBpCase,
                owned,
                ownedAmount,
                perc,
                pairingDepth: tvl - (tvl * dolaPerc),
                dolaBalance: tvl * dolaPerc,
                dolaWeight: dolaPerc * 100,
                rewardDay: ownedAmount * (apy || 0) / 100 / 365,
                isFed,
                fedName: isFed ? fedPol.name : undefined,
                fedSupply: isFed ? fedPol.supply : undefined,
                fedBorrows: isFed ? fedPol.borrows || 0 : undefined,
                mainPartBalance: mainPart?.balance,
                pairPartBalance: pairPart?.balance,
            }
        }

        const liquidity = (await Promise.all([
            ...lps.map(lp => getPol(lp))
        ])).filter(d => !!d && d.tvl > 1);

        // readjust dola balances of child pools
        liquidity
            .filter(lp => ['aura', 'convex-finance'].includes(lp.project))
            .forEach((lp) => {
                const parentLp = liquidity.find(plp => plp?.deduce?.includes(lp.address));
                if (!!parentLp && parentLp.tvl) {
                    const ratio = parentLp.dolaFraxBpCase ? parentLp.dolaFraxBpCase.convexRatio : lp.tvl / parentLp.tvl;
                    lp.mainPartBalance = ratio * parentLp.mainPartBalance;
                    lp.pairingDepth = ratio * parentLp.pairingDepth;
                    lp.parentMainPartBalance = parentLp.mainPartBalance;
                    lp.dolaWeight = parentLp.dolaWeight;
                    lp.tvl = ratio * parentLp.tvl;
                    lp.dolaBalance = ratio * parentLp.dolaBalance;
                }
            });
        const resultData = {
            timestamp: (+(new Date()) - 1000),
            liquidity,
            firmBorrows: fedPols.filter(d => d.isFirm).reduce((prev, curr) => prev + (curr.borrows || 0), 0),
        }
        await redisSetWithTimestamp(liquidityCacheKey, resultData);

        res.status(200).json(resultData)
    } catch (err) {
        console.error(err);
        // if an error occured, try to return last cached results
        try {
            const cache = await getCacheFromRedis(liquidityCacheKey, false);
            if (cache) {
                console.log('Api call failed, returning last cache found');
                res.status(200).json(cache);
            }
        } catch (e) {
            console.error(e);
            return res.status(500);
        }
    }
}