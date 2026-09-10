import 'source-map-support'
import { getCacheFromRedis, getCacheFromRedisAsObj, redisSetWithTimestamp } from '@app/util/redis'

export const INV_VALUATION_CACHE_KEY = `inv-valuation-v1.0.3`;

const BASE_URL = 'https://www.inverse.finance';

// INV & DBR are excluded from the "hard" book value: their worth derives from the protocol itself
const OWN_TOKENS = ['INV', 'DBR'];

const safeDiv = (a: number | null, b: number | null): number | null => {
  return (typeof a === 'number' && isFinite(a) && typeof b === 'number' && isFinite(b) && b > 0) ? a / b : null;
}

const fetchApi = async (path: string, asNumber = false) => {
  const res = await fetch(`${BASE_URL}${path}`);
  if (asNumber) {
    return parseFloat(await res.text());
  }
  return await res.json();
}

const settled = (result: PromiseSettledResult<any>, fallback: any = null) => {
  return result.status === 'fulfilled' && result.value !== undefined ? result.value : fallback;
}

const getTokenPrice = (prices: { [key: string]: number }, token?: { symbol?: string, coingeckoId?: string }): number => {
  if (!token) { return 0 }
  return (!!token.symbol && prices[token.symbol])
    || (!!token.coingeckoId && prices[token.coingeckoId])
    || 0;
}

// note: only excludes own tokens held directly, INV/DBR sitting inside an LP position still counts
const sumFunds = (funds: any[], prices: { [key: string]: number }, excludeOwnTokens = false): number => {
  return (funds || []).reduce((prev, fund) => {
    if (!fund?.token || !(fund.balance > 0)) { return prev }
    if (excludeOwnTokens && OWN_TOKENS.includes(fund.token.symbol)) { return prev }
    // zerion already gives us a price for most treasury/multisig assets
    const price = fund.price || getTokenPrice(prices, fund.token);
    return prev + (fund.balance * price);
  }, 0);
}

export default async function handler(req, res) {
  const { cacheFirst } = req.query;

  try {
    const cacheDuration = 60;
    res.setHeader('Cache-Control', `public, max-age=${cacheDuration}`);
    const { data: cachedData, isValid } = await getCacheFromRedisAsObj(INV_VALUATION_CACHE_KEY, cacheFirst !== 'true', cacheDuration);
    if (isValid && cachedData) {
      res.status(200).json(cachedData);
      return
    }

    const [
      pricesRes,
      circSupplyRes,
      totalSupplyRes,
      firmTvlRes,
      marketsRes,
      treasuryRes,
      dbrRes,
      dolaCircSupplyRes,
    ] = await Promise.allSettled([
      fetchApi('/api/prices?cacheFirst=true'),
      fetchApi('/api/inv/circulating-supply', true),
      fetchApi('/api/inv/supply', true),
      fetchApi('/api/f2/tvl?cacheFirst=true'),
      fetchApi('/api/f2/fixed-markets?v=1.2&cacheFirst=true'),
      fetchApi('/api/transparency/treasury-assets?cacheFirst=true'),
      fetchApi('/api/dbr?withExtra=true&cacheFirst=true'),
      fetchApi('/api/dola/circulating-supply', true),
    ]);

    const prices = settled(pricesRes, {});
    const invPrice = prices['inverse-finance'] || prices['INV'] || 0;
    const circulatingSupply = settled(circSupplyRes, 0) || 0;
    const totalSupply = settled(totalSupplyRes, 0) || 0;

    const marketCap = invPrice * circulatingSupply;
    const fdv = invPrice * totalSupply;

    // -- Book value: treasury contract + multisigs + leftover Frontier reserves
    const dao = settled(treasuryRes, {});
    const treasuryFunds = dao?.treasury || [];
    const anchorReserves = dao?.anchorReserves || [];
    const multisigFunds = (dao?.multisigs || []).map(m => m.funds || []).flat();
    const allFunds = [...treasuryFunds, ...anchorReserves, ...multisigFunds];

    const bookValueTotal = sumFunds(allFunds, prices);
    const bookValueExclOwnTokens = sumFunds(allFunds, prices, true);

    // -- Revenue: DBR burned (interest paid by FiRM borrowers) + Fed income realized by the DAO
    const dbrData = settled(dbrRes, {});
    const dbrPrice = dbrData?.priceUsd || prices['dola-borrowing-right'] || 0;

    const now = Date.now();

    // -- Protocol size denominators
    const firmTvl = settled(firmTvlRes, {})?.firmTotalTvl ?? null;
    const markets = settled(marketsRes, {})?.markets || [];
    const firmBorrows = markets.length
      ? markets.reduce((prev, m) => prev + (m.totalDebt || 0), 0)
      : null;
    const dolaCirculatingSupply = settled(dolaCircSupplyRes, null);

    // DBR burns are recognized lumpily (a borrower's accrued DBR is deducted in one go on borrow/repay/force-replenish),
    // so annualizing a short window is noise. The run-rate is the sound forward-looking denominator:
    // every DOLA borrowed consumes exactly 1 DBR per year, so yearly interest = borrows * DBR price.
    // Fed income is excluded on purpose: it is trailing and lumpy, mixing it in would break the forward-looking reading
    const firmInterestRunRate = firmBorrows !== null ? firmBorrows * dbrPrice : null;
    const annualizedRunRate = firmInterestRunRate;

    const resultData = {
      timestamp: now,
      price: invPrice,
      supply: {
        circulating: circulatingSupply,
        total: totalSupply,
      },
      marketCap,
      fdv,
      revenue: {
        annualizedRunRate,
        breakdown: {
          firmInterestRunRate,
          dbrBurns: { dbrPrice },
        },
      },
      bookValue: {
        total: bookValueTotal,
        excludingOwnTokens: bookValueExclOwnTokens,
        perToken: safeDiv(bookValueTotal, circulatingSupply),
        perTokenExcludingOwnTokens: safeDiv(bookValueExclOwnTokens, circulatingSupply),
        breakdown: {
          treasuryContract: sumFunds(treasuryFunds, prices),
          multisigs: sumFunds(multisigFunds, prices),
          frontierReserves: sumFunds(anchorReserves, prices),
        },
      },
      protocol: {
        firmTvl,
        firmBorrows,
        dolaCirculatingSupply,
      },
      ratios: {
        priceToSales: {
          runRate: safeDiv(marketCap, annualizedRunRate),
        },
        priceToBook: {
          total: safeDiv(marketCap, bookValueTotal),
          excludingOwnTokens: safeDiv(marketCap, bookValueExclOwnTokens),
        },
        marketCapToTvl: safeDiv(marketCap, firmTvl),
        // annualized borrower fees over collateral deposited: decomposes into utilization x borrow rate.
        // uses the run-rate so numerator and denominator are both measured now, a trailing numerator
        // over a spot TVL would report a take rate the protocol is not currently earning.
        salesToTvl: safeDiv(annualizedRunRate, firmTvl),
        marketCapToBorrows: safeDiv(marketCap, firmBorrows),
        marketCapToDolaCirculatingSupply: safeDiv(marketCap, dolaCirculatingSupply),
        fdvToSales: {
          runRate: safeDiv(fdv, annualizedRunRate),
        },
        fdvToBook: {
          total: safeDiv(fdv, bookValueTotal),
          excludingOwnTokens: safeDiv(fdv, bookValueExclOwnTokens),
        },
        // inverse of P/S, how much yearly revenue each dollar of market cap buys
        revenueYield: safeDiv(annualizedRunRate, marketCap),
        revenuePerToken: safeDiv(annualizedRunRate, circulatingSupply),
      },
      notes: {
        revenue: 'Protocol revenue = DBR burned (FiRM borrowing interest, each day valued at that day\'s DBR price) + Fed income realized by the DAO (already USD at event time).',
        annualizedRunRate: 'Preferred P/S denominator: FiRM borrows * DBR price (1 DBR is consumed per DOLA borrowed per year). FiRM fees only.',
        salesToTvl: 'Annualized borrower fees divided by FiRM TVL, i.e. the take rate on deposited collateral. Equals utilization (borrows / TVL) times the effective borrow rate (DBR price). A business-efficiency measure, not a valuation multiple.',
        annualizedFromShortWindows: 'annualizedFrom30d/90d are noisy: DBR is burned in lumps rather than continuously, so a single large borrower event can dominate a short window.',
        bookValue: 'Gross assets (treasury contract + multisigs + leftover Frontier reserves), not net of liabilities such as payroll or bad debt. excludingOwnTokens drops directly held INV & DBR but not INV/DBR sitting inside LP positions.',
      },
    };

    await redisSetWithTimestamp(INV_VALUATION_CACHE_KEY, resultData);

    res.status(200).json(resultData)
  } catch (err) {
    console.error(err);
    // if an error occured, try to return last cached results
    try {
      const cache = await getCacheFromRedis(INV_VALUATION_CACHE_KEY, false);
      if (cache) {
        console.log('Api call failed, returning last cache found');
        res.status(200).json(cache);
      } else {
        res.status(500).json({ success: false });
      }
    } catch (e) {
      console.error(e);
      res.status(500).json({ success: false });
    }
  }
}
