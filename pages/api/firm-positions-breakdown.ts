import 'source-map-support'
import { Contract } from 'ethers'
import { DOLA3POOLCRV_ABI, ERC20_ABI } from '@app/config/abis'
import { getNetworkConfigConstants } from '@app/util/networks'
import { getPaidProvider, getProvider } from '@app/util/providers';
import { getCacheFromRedis, getCacheFromRedisAsObj, redisSetWithTimestamp } from '@app/util/redis'
import { getBnToNumber } from '@app/util/markets'
import { getGroupedMulticallOutputs } from '@app/util/multicall';
import { uniqueBy } from '@app/util/misc';
import { CHAIN_ID, SDOLA_ADDRESS } from '@app/config/constants';
import { CHAIN_TOKENS, getToken } from '@app/variables/tokens';
import { F2_POSITIONS_CACHE_KEY, getFirmPositions } from './f2/firm-positions';
import { F2_MARKETS_CACHE_KEY } from './f2/fixed-markets';
import { pricesCacheKey } from './prices';

const { F2_MARKETS, DOLA } = getNetworkConfigConstants();

export const FIRM_POSITIONS_BREAKDOWN_CACHE_KEY = 'firm-positions-breakdown-v1.1.0';
// max age of the cached firm-positions data, in seconds, fresh data is fetched otherwise
const POSITIONS_MAX_AGE = 1800;
// tokens counted in the dola percentage of the LPs
const DOLA_TOKENS = [DOLA, SDOLA_ADDRESS].map(ad => ad.toLowerCase());

// Curve LP of a market: the collateral itself or the LP in the collateral vault (rootLp)
const getMarketLp = (market) => {
    const lp = getToken(CHAIN_TOKENS[CHAIN_ID], market.rootLp || market.collateral);
    return lp?.isCrvLP && lp.pairs?.length > 0 ? lp : undefined;
}

// underlying tokens of an amount of LP, pro-rata of the pool balances
const getLpBreakdown = (pool, lpBalance: number) => {
    const poolShare = pool.totalSupply > 0 ? lpBalance / pool.totalSupply : 0;
    return {
        lp: pool.address,
        lpSymbol: pool.symbol,
        lpName: pool.name,
        lpBalance,
        poolSharePercentage: poolShare * 100,
        underlying: pool.coins.map(({ address, symbol, balance, price, percentage }) => ({
            address,
            symbol,
            balance: balance * poolShare,
            balanceUsd: balance * poolShare * price,
            percentage,
        })),
        dolaPercentage: pool.dolaPercentage,
    };
}

// all the markets and positions, or only the LP ones
const getResponseData = (data, lpOnly: boolean) => {
    const markets = lpOnly ? data.markets.filter(m => !!m.lpBreakdown) : data.markets;
    const positions = lpOnly ? data.positions.filter(p => !!p.lpBreakdown) : data.positions;
    return {
        timestamp: data.timestamp,
        nbUniqueUsers: uniqueBy(positions, (a, b) => a.user === b.user).length,
        markets,
        positions,
    };
}

// firm-positions data enriched with the markets infos and the underlying tokens of the LP positions
export default async function handler(req, res) {
    const lpOnly = req.query.lpOnly === 'true';
    const cacheDuration = 300;
    res.setHeader('Cache-Control', `public, max-age=${cacheDuration}`);
    const { isValid, data: cachedData } = await getCacheFromRedisAsObj(FIRM_POSITIONS_BREAKDOWN_CACHE_KEY, true, cacheDuration);

    try {
        // the timestamp is the one of the firm-positions data
        if (isValid && !!cachedData && Date.now() - cachedData.timestamp < POSITIONS_MAX_AGE * 1000) {
            return res.status(200).json(getResponseData(cachedData, lpOnly));
        }

        const provider = getProvider(CHAIN_ID);

        const { isValid: isPositionsCacheRecent, data: cachedPositions } = await getCacheFromRedisAsObj(F2_POSITIONS_CACHE_KEY, true, POSITIONS_MAX_AGE);
        let firmPositions = isPositionsCacheRecent ? cachedPositions : undefined;
        if (!firmPositions) {
            firmPositions = await getFirmPositions(provider, getPaidProvider(CHAIN_ID));
            await redisSetWithTimestamp(F2_POSITIONS_CACHE_KEY, firmPositions);
        }

        const lpMarkets = F2_MARKETS
            .map(market => ({ market, lp: getMarketLp(market) }))
            .filter(({ lp }) => !!lp);
        const lps = uniqueBy(lpMarkets.map(({ lp }) => lp), (a, b) => a.address === b.address);
        const vaultMarkets = lpMarkets.filter(({ market }) => !!market.rootLp);

        const [prices, marketsCache, multicallResults] = await Promise.all([
            getCacheFromRedis(pricesCacheKey, false),
            getCacheFromRedis(F2_MARKETS_CACHE_KEY, false),
            getGroupedMulticallOutputs(
                [
                    ...lps.map(lp => {
                        const pool = new Contract(lp.address, DOLA3POOLCRV_ABI, provider);
                        return lp.pairs.map((pair, i) => ({ contract: pool, functionName: 'balances', params: [i] }));
                    }),
                    lps.map(lp => ({ contract: new Contract(lp.address, ERC20_ABI, provider), functionName: 'totalSupply' })),
                    lps.map(lp => ({ contract: new Contract(lp.address, ERC20_ABI, provider), functionName: 'symbol' })),
                    lps.map(lp => ({ contract: new Contract(lp.address, ERC20_ABI, provider), functionName: 'name' })),
                    vaultMarkets.map(({ market }) => {
                        const vault = new Contract(market.collateral, ['function pricePerShare() public view returns (uint)'], provider);
                        return { contract: vault, functionName: 'pricePerShare' };
                    }),
                ],
                1,
                undefined,
                provider,
            ),
        ]);
        // collateral prices for the deposits values
        if (!marketsCache?.markets) {
            throw new Error('fixed-markets cache unavailable');
        }
        const poolsBalancesBn = multicallResults.slice(0, lps.length);
        const [totalSuppliesBn, lpSymbols, lpNames, pricePerSharesBn] = multicallResults.slice(lps.length);

        // composition of the Curve pools, the percentages are by USD value
        const pools = lps.map((lp, lpIndex) => {
            const coins = lp.pairs.map((pair, i) => {
                const token = getToken(CHAIN_TOKENS[CHAIN_ID], pair);
                const balance = getBnToNumber(poolsBalancesBn[lpIndex][i], token.decimals);
                const price = prices?.[token.coingeckoId || token.symbol] || 1;
                return { address: token.address, symbol: token.symbol, balance, price, value: balance * price };
            });
            const totalValue = coins.reduce((prev, curr) => prev + curr.value, 0);
            const coinsWithPercentage = coins.map(coin => ({ ...coin, percentage: totalValue > 0 ? coin.value / totalValue * 100 : 0 }));
            return {
                address: lp.address,
                symbol: lpSymbols[lpIndex],
                name: lpNames[lpIndex],
                totalSupply: getBnToNumber(totalSuppliesBn[lpIndex], lp.decimals),
                coins: coinsWithPercentage,
                // sDOLA counts as DOLA
                dolaPercentage: coinsWithPercentage
                    .filter(coin => DOLA_TOKENS.includes(coin.address.toLowerCase()))
                    .reduce((prev, curr) => prev + curr.percentage, 0),
            };
        });

        // pool and amount of LP per unit of collateral of the LP markets, vault shares hold pricePerShare LP each
        const lpMarketsData = Object.fromEntries(lpMarkets.map(({ market, lp }) => {
            const vaultIndex = vaultMarkets.findIndex(vm => vm.market.address === market.address);
            const lpPerCollateral = vaultIndex === -1 ? 1 : getBnToNumber(pricePerSharesBn[vaultIndex], getToken(CHAIN_TOKENS[CHAIN_ID], market.collateral).decimals);
            return [market.address, { pool: pools.find(p => p.address === lp.address), lpPerCollateral }];
        }));

        const positions = firmPositions.positions.map(position => {
            const market = F2_MARKETS[position.marketIndex];
            const lpMarketData = lpMarketsData[market.address];
            const price = marketsCache.markets.find(m => m.address === market.address)?.price || 0;
            return {
                user: position.user,
                marketName: market.name,
                market: market.address,
                collateral: market.collateral,
                collateralSymbol: getToken(CHAIN_TOKENS[CHAIN_ID], market.collateral)?.symbol,
                deposits: position.deposits,
                depositsValue: position.deposits * price,
                debt: position.debt,
                lpBreakdown: lpMarketData ? getLpBreakdown(lpMarketData.pool, position.deposits * lpMarketData.lpPerCollateral) : null,
            }
        });
        const listedPositions = positions.filter(p => p.depositsValue >= 1);

        // the market totals include the positions that are not listed
        const markets = F2_MARKETS
            .map(market => {
                const marketPositions = positions.filter(p => p.market === market.address);
                const lpMarketData = lpMarketsData[market.address];
                return {
                    marketName: market.name,
                    market: market.address,
                    collateral: market.collateral,
                    collateralSymbol: getToken(CHAIN_TOKENS[CHAIN_ID], market.collateral)?.symbol,
                    totalDebt: marketPositions.reduce((prev, curr) => prev + curr.debt, 0),
                    nbPositions: listedPositions.filter(p => p.market === market.address).length,
                    lpBreakdown: lpMarketData ?
                        getLpBreakdown(lpMarketData.pool, marketPositions.reduce((prev, curr) => prev + curr.lpBreakdown.lpBalance, 0))
                        : null,
                }
            })
            // markets with debt or with listed positions
            .filter(m => m.totalDebt >= 1 || m.nbPositions > 0);

        const resultData = {
            // when the firm-positions data was fetched
            timestamp: firmPositions.timestamp,
            markets,
            positions: listedPositions,
        }

        await redisSetWithTimestamp(FIRM_POSITIONS_BREAKDOWN_CACHE_KEY, resultData);

        res.status(200).json(getResponseData(resultData, lpOnly))
    } catch (err) {
        console.error(err);
        // if an error occured, try to return last cached results
        if (cachedData) {
            console.log('Api call failed, returning last cache found');
            res.status(200).json(getResponseData(cachedData, lpOnly));
        } else {
            res.status(500).json({ success: false });
        }
    }
}
