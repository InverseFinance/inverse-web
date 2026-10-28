import { BigNumber, Contract } from 'ethers'
import 'source-map-support'
import { CTOKEN_ABI, VE_NFT_ABI } from '@app/config/abis'
import { getNetwork, getNetworkConfigConstants } from '@app/util/networks'
import { getPaidProvider, getProvider } from '@app/util/providers';
import { getCacheFromRedis, redisSetWithTimestamp } from '@app/util/redis'
import { Multisig, NetworkIds, Token } from '@app/types';
import { getBnToNumber } from '@app/util/markets'
import { CHAIN_TOKENS, CHAIN_TOKEN_ADDRESSES } from '@app/variables/tokens';
import { isAddress } from 'ethers/lib/utils';
import { BaseProvider } from '@ethersproject/providers';
import { getGroupedMulticallOutputs, getMulticallOutput } from '@app/util/multicall';
import { fetchZerionWithRetry } from '@app/util/zerion';
import { timestampToUTC } from '@app/util/misc';
import { PROTOCOL_IMAGES, TOKEN_IMAGES } from '@app/variables/images';
import { liquidityCacheKey } from './liquidity';
import { getPayrollData } from './compensations';

const formatBn = (bn: BigNumber, token: Token) => {
  return { token, balance: getBnToNumber(bn, token.decimals) }
}

// Frontier is deprecated, we know reserves will stay at 0 for the others
const ANCHOR_RESERVES_TO_CHECK = [
  //'DOLA', 'ETH-1', 'WBTC-1', 'xSUSHI', 'YFY-1'
  '0x697b4acAa24430F254224eB794d2a85ba1Fa1FB8',
  '0x17786f3813E6bA35343211bd8Fe18EC4de14F28b',
  '0x7Fcb7DAC61eE35b3D4a51117A7c58D53f0a8a670',
  '0xD60B06B457bFf7fc38AC5E7eCE2b5ad16B288326',
  '0xde2af899040536884e062D3a334F2dD36F34b4a4',
];

// Aero (unified Aerodrome & Velodrome protocol) DOLA-USDC concentrated liquidity pool on mainnet, its gauge and positions nft
const AERO_DOLA_USDC_POOL = '0x8751b7494B206c73A49BA034225EF36466569545';
const AERO_DOLA_USDC_GAUGE = '0x6dc4417b7Ff0dE51aa106bB33B854A9980a6dFC1';
const AERO_CL_POSITIONS_NFT = '0x4857DB576eE0e45F10525eC59527BfD10beeC60b';

// zerion does not price the SwanDAO token and its staked version (1:1), they are valued at the Curve SWAN/WETH pool price
const SWAN = '0xd0a32f6d4850f9d6df7d4f8f84af1fcd3cf993cc';
const SSWAN = '0xcbc108384e874d9b0436ade3918685baa709e48c';
const SWAN_WETH_CURVE_POOL = '0xffb7f90354c496210c471459133da2e452d8138a';

// token amounts of a concentrated liquidity position (uniswap v3 math)
const getClPositionAmounts = (liquidity: BigNumber, tickLower: number, tickUpper: number, sqrtPriceX96: BigNumber) => {
  const L = getBnToNumber(liquidity, 0);
  const [sqrtA, sqrtB] = [tickLower, tickUpper].map(tick => Math.sqrt(1.0001 ** tick));
  // current price bounded to the position range
  const sqrtP = Math.min(Math.max(getBnToNumber(sqrtPriceX96, 0) / 2 ** 96, sqrtA), sqrtB);
  return [L * (sqrtB - sqrtP) / (sqrtP * sqrtB), L * (sqrtP - sqrtA)];
}

// the account positions in the Aero DOLA-USDC pool, staked in the gauge or not
const getAeroDolaUsdcPositions = async (account: string, provider: BaseProvider): Promise<{ id: string, dolaAmount: number, usdcAmount: number }[]> => {
  const nft = new Contract(AERO_CL_POSITIONS_NFT, [
    'function balanceOf(address) view returns (uint256)',
    'function tokenOfOwnerByIndex(address, uint256) view returns (uint256)',
    'function positions(uint256) view returns (uint96 nonce, address operator, address token0, address token1, int24 tickSpacing, int24 tickLower, int24 tickUpper, uint128 liquidity, uint256 feeGrowthInside0LastX128, uint256 feeGrowthInside1LastX128, uint128 tokensOwed0, uint128 tokensOwed1)',
  ], provider);
  const gauge = new Contract(AERO_DOLA_USDC_GAUGE, ['function stakedValues(address) view returns (uint256[])'], provider);
  const pool = new Contract(AERO_DOLA_USDC_POOL, ['function slot0() view returns (uint160 sqrtPriceX96, int24 tick, uint16, uint16, uint16, bool)'], provider);
  const [stakedIds, nbUnstaked, slot0] = await getMulticallOutput([
    { contract: gauge, functionName: 'stakedValues', params: [account] },
    { contract: nft, functionName: 'balanceOf', params: [account] },
    { contract: pool, functionName: 'slot0' },
  ], 1, undefined, provider);
  const unstakedIds = nbUnstaked.gt(0) ? await getMulticallOutput(
    [...Array(nbUnstaked.toNumber()).keys()].map(i => ({ contract: nft, functionName: 'tokenOfOwnerByIndex', params: [account, i] })),
    1, undefined, provider,
  ) : [];
  const ids: BigNumber[] = [...stakedIds, ...unstakedIds];
  if (!ids.length) {
    return [];
  }
  const positions: any[] = await getMulticallOutput(ids.map(id => ({ contract: nft, functionName: 'positions', params: [id] })), 1, undefined, provider);
  const [dola, usdc] = [CHAIN_TOKEN_ADDRESSES[NetworkIds.mainnet].DOLA, CHAIN_TOKEN_ADDRESSES[NetworkIds.mainnet].USDC]
    .map(address => CHAIN_TOKENS[NetworkIds.mainnet][address]);
  return positions
    .map((p, i) => ({ ...p, id: ids[i].toString() }))
    // the unstaked nfts can be positions of other pools
    .filter(p => p.token0 === dola.address && p.token1 === usdc.address && p.tickSpacing === 1 && p.liquidity.gt(0))
    .map(p => {
      const [dolaAmount, usdcAmount] = getClPositionAmounts(p.liquidity, p.tickLower, p.tickUpper, slot0.sqrtPriceX96);
      return { id: p.id, dolaAmount: dolaAmount / 10 ** dola.decimals, usdcAmount: usdcAmount / 10 ** usdc.decimals };
    });
}

const calcStables = (multisigs: Multisig[], treasury: Token[], anchorReserves: Token[], prices = {}) => {
  const TWGmultisigs = multisigs?.filter(m => m.shortName.includes('TWG') && m.chainId !== NetworkIds.ftm) || [];

  // stable reserves
  const treasuryStables = treasury?.filter(f => (f.token.isStable) || (['DOLA', 'USDC', 'USDT', 'sDOLA', 'DAI', 'USDS'].includes(f.token.symbol))).map(f => {
    return { ...f, label: `${f.token.symbol} (Treasury)`, balance: f.balance, onlyUsdValue: true, usdPrice: (f.price || prices[f.token.symbol]?.usd || prices[f.token.coingeckoId]?.usd || 1) }
  }) || [];

  const twgStables = TWGmultisigs.map(m => {
    return m.funds.filter(f => (f.token.isStable) || (['DOLA', 'USDC', 'USDT', 'sDOLA', 'DAI', 'USDS', 'sinvUSD', 'invUSD', 'apxUSD'].includes(f.token.symbol))).map(f => {
      return { ...f, label: `${f.token.symbol.replace(/ [a-z]*lp$/ig, '')} (${m.shortName})`, balance: f.balance, onlyUsdValue: true, usdPrice: (f.price || prices[f.token.symbol]?.usd || prices[f.token.coingeckoId]?.usd || 1) }
    });
  }).flat();

  const dolaFrontierReserves = anchorReserves.filter(f => f.token.symbol === 'DOLA')
    .map(f => {
      return { ...f, label: 'DOLA (Frontier Reserves)', balance: f.balance, onlyUsdValue: true, usdPrice: 1 }
    });

  const stableReserves = [
    ...treasuryStables,
    ...twgStables,
    ...dolaFrontierReserves,
  ];
  return stableReserves.reduce((prev, curr) => prev + curr.balance * curr.usdPrice, 0);

}

const takeSnapshot = async (data, snapshotKey, provider, paidProvider) => {
  const [prices, payrollData] = await Promise.all([
    fetch('https://www.inverse.finance/api/prices?cacheFirst=true').then(res => res.json()),
    getPayrollData(provider, paidProvider),
  ]);

  const formattedPrices = Object.entries(prices).reduce((prev, [key, val]) => ({ ...prev, [key]: { usd: val } }), {});
  const stableReserves = calcStables(data.multisigs, data.treasury, data.anchorReserves, formattedPrices);
  const snaps = (await getCacheFromRedis(snapshotKey, false)) || { dailyValues: [] };
  const utcDate = timestampToUTC(Date.now());

  const { currentPayrolls, currentLiabilities, payrollTotalEvolutionByDay } = payrollData;

  if (!snaps.dailyValues.find(s => s.utcDate === utcDate)) {
    const totalCurrentPayrolls = currentPayrolls.reduce((prev, curr) => prev + curr.amount, 0);
    const preRunwayInYears = totalCurrentPayrolls ? stableReserves / totalCurrentPayrolls : 0;
    const preRunwayInMonths = preRunwayInYears * 12;

    const reservesMinusPendingClaims = Math.max(0, stableReserves - currentLiabilities);
    const runwayInYears = totalCurrentPayrolls ? reservesMinusPendingClaims / totalCurrentPayrolls : 0;
    const runwayInMonths = runwayInYears * 12;

    // add runway/payroll data if not there before in cache
    snaps.dailyValues.forEach(d => {
      const totalPayrollsAtDate = payrollTotalEvolutionByDay.findLast(pd => d.utcDate >= pd.utcDate);
      if (!!totalPayrollsAtDate) {
        if (!d.payrolls) d.payrolls = totalPayrollsAtDate.total;
        if (!d.unclaimedPayrolls) d.unclaimedPayrolls = null;
        if (!d.preRunway) d.preRunway = totalPayrollsAtDate.total ? 12 * (d.stableReserves||0) / totalPayrollsAtDate.total : 0;
        if (!d.runway) d.runway = d.preRunway;
      }
    })

    snaps.dailyValues.push({
      timestamp: Date.now(),
      utcDate: timestampToUTC(Date.now()),
      stableReserves,
      unclaimedPayrolls: currentLiabilities,
      preRunway: preRunwayInMonths,
      runway: runwayInMonths,
      payrolls: totalCurrentPayrolls,
    });
  }
  await redisSetWithTimestamp(snapshotKey, snaps);
  return snaps;
}

export const treasuryAssetsSnapshotsCacheKey = `treasury-assets-snapshots-v1.0.1`;

export default async function handler(req, res) {
  const { cacheFirst } = req.query;
  const isTakeSnapshot = req.method === 'POST' && req.headers.authorization === `Bearer ${process.env.API_SECRET_KEY}`;

  const { ANCHOR_TOKENS, UNDERLYING, TREASURY, MULTISIGS } = getNetworkConfigConstants(NetworkIds.mainnet);
  const cacheKey = `treasury-assets-cache-v1.0.1`;

  try {
    const cacheDuration = 120;
    res.setHeader('Cache-Control', `public, max-age=${cacheDuration}`);
    const validCache = await getCacheFromRedis(cacheKey, cacheFirst !== 'true', cacheDuration);

    const provider = getProvider(NetworkIds.mainnet);
    const paidProvider = getPaidProvider(1);

    if (validCache) {
      if (isTakeSnapshot) {
        await takeSnapshot(validCache, treasuryAssetsSnapshotsCacheKey, provider, paidProvider);
      }
      res.status(200).json(validCache);
      return
    }

    const mainnet = getNetwork(NetworkIds.mainnet);
    const multisigsToShow = MULTISIGS;

    const mainnetTokens = CHAIN_TOKEN_ADDRESSES["1"];

    const [[anchorReserves, [swanWethPrice]], prices] = await Promise.all([
      getGroupedMulticallOutputs([
        ANCHOR_TOKENS.map((ad: string) => {
          const contract = new Contract(ad, CTOKEN_ABI, provider);
          return { contract, functionName: 'totalReserves', params: [], forceFallback: !ANCHOR_RESERVES_TO_CHECK.includes(ad), fallbackValue: BigNumber.from('0') };
        }),
        // ema price of SWAN in WETH (pool coins: WETH, SWAN)
        [{ contract: new Contract(SWAN_WETH_CURVE_POOL, ['function price_oracle() view returns (uint256)'], provider), functionName: 'price_oracle' }],
      ]),
      fetch('https://www.inverse.finance/api/prices?cacheFirst=true').then(res => res.json()),
    ]);

    const swanPrice = getBnToNumber(swanWethPrice) * prices['weth'];
    const zerionFallbackPrices = { [SWAN]: swanPrice, [SSWAN]: swanPrice };

    const multisigsFundsToCheck = {
      [NetworkIds.mainnet]: Object.keys(CHAIN_TOKENS[NetworkIds.mainnet])
        .filter(key => isAddress(key))
        .filter(key => ![mainnetTokens.MIM, mainnetTokens.FLOKI, mainnetTokens.THREECRV, mainnetTokens.XSUSHI, mainnetTokens.DOLAUSDCUNIV3].includes(key)),
      [NetworkIds.ftm]: [],// not used anymore
      [NetworkIds.optimism]: Object.keys(CHAIN_TOKENS[NetworkIds.optimism]).filter(key => isAddress(key)),
      [NetworkIds.bsc]: Object.keys(CHAIN_TOKENS[NetworkIds.bsc]).filter(key => isAddress(key)),
      [NetworkIds.arbitrum]: Object.keys(CHAIN_TOKENS[NetworkIds.arbitrum]).filter(key => isAddress(key)),
      [NetworkIds.polygon]: Object.keys(CHAIN_TOKENS[NetworkIds.polygon]).filter(key => isAddress(key)),
      [NetworkIds.avalanche]: Object.keys(CHAIN_TOKENS[NetworkIds.avalanche]).filter(key => isAddress(key)),
      [NetworkIds.base]: Object.keys(CHAIN_TOKENS[NetworkIds.base]).filter(key => isAddress(key)),
    }

    // the veAERO and veVELO nfts were migrated to sAERO nfts
    const sAeroToken = CHAIN_TOKENS[NetworkIds.base][CHAIN_TOKEN_ADDRESSES[NetworkIds.base].SAERO];
    const sAero = new Contract(sAeroToken.address, VE_NFT_ABI, getProvider(NetworkIds.base));
    const twg = multisigsToShow.find(m => m.shortName === 'TWG' && m.chainId === NetworkIds.mainnet)!;

    const [treasuryBalances, multisigsFunds, liquidityCachedData, sAeroStakes, aeroDolaUsdcPositions] = await Promise.all(
      [
        fetchZerionWithRetry(TREASURY, mainnet.zerionId || mainnet.codename, zerionFallbackPrices),
        Promise.all(
          multisigsToShow.map(multisig => {
            const net = getNetwork(multisig.chainId);
            return fetchZerionWithRetry(multisig.address, net.zerionId || net.codename, zerionFallbackPrices)
          })
        ),
        getCacheFromRedis(liquidityCacheKey, false),
        Promise.all(sAeroToken.veNftIds!.map(id => sAero.staked(id))),
        getAeroDolaUsdcPositions(twg.address, provider),
      ]
    );

    const formattedPrices = Object.entries(prices).reduce((prev, [key, val]) => ({ ...prev, [key]: { usd: val } }), {});

    multisigsFunds.map((bns, i) => {
      const multisig = multisigsToShow[i];
      const chainFundsToCheck = multisigsFundsToCheck[multisig.chainId];
      return bns.map((bn, j) => {
        const token = CHAIN_TOKENS[multisig.chainId][chainFundsToCheck[j]]
        if (!!token?.address) {
          const alreadyInFundsIndex = multisigsFunds[i].findIndex(mf => mf.token.address?.toLowerCase() === token.address?.toLowerCase());
          if (alreadyInFundsIndex !== -1) {
            multisigsFunds[i][alreadyInFundsIndex].allowance = 0
          } else {
            multisigsFunds[i].push({
              token,
              balance: 0,
              allowance: null,
            });
          }
        }
      })
    })


    const multisigData = multisigsToShow.map((m, i) => ({
      ...m,
      funds: multisigsFunds[i]
        .map(m => {
          // bad zerion data
          if (m.key === "40 Acres-40 Acres Lending (#7)") {
            return { balance: 0 };
          }
          // temporary: for invUSD use liquidity TVL data for now
          if (!!liquidityCachedData && m.token.address === '0xe430e64081a3e7a39d24c5f507d9d4b492b2ed52') {
            const invUsdLiquidityData = liquidityCachedData.liquidity.find(l => l.address.toLowerCase() === '0xe430e64081a3e7a39d24c5f507d9d4b492b2ed52');
            if (!invUsdLiquidityData) {
              return m;
            }
            return { ...m, balance: invUsdLiquidityData.tvl }
          }
          return m
        })
        .filter(d => d.balance || 0 > 0 || d.allowance || 0 > 0),
    }));

    // temp: zerion is missing the sAERO nfts (VotingEscrow v3, staked AERO)
    if (!multisigData.find(m => m.shortName === 'TWG on BASE' && m.funds.some(f => ['veAERO', 'sAERO'].includes(f.token.symbol) && f.balance > 0))) {
      const baseMultisigIndex = multisigData.findIndex(m => m.shortName === 'TWG on BASE');
      const aeroToken = multisigData[baseMultisigIndex].funds.find(f => f.token.address?.toLowerCase() === CHAIN_TOKEN_ADDRESSES[NetworkIds.base].AEROV2.toLowerCase());
      // the price of the old AERO token as last fallback
      const aeroPrice = aeroToken?.price || prices['aero'] || prices['aerodrome-finance'];
      const stakedAero = sAeroStakes.reduce((prev, curr) => prev + getBnToNumber(curr.amount), 0);
      multisigData[baseMultisigIndex].funds.push({
        "balance": stakedAero * aeroPrice,
        "price": 1,
        "onlyUsdValue": true,
        "allowance": 0,
        "token": {
          "decimals": 18,
          "name": sAeroToken.name,
          "symbol": sAeroToken.symbol,
          "image": sAeroToken.image,
          "address": sAeroToken.address,
          "_price": aeroPrice,
          // a veNftId puts the fund in the veNFTs category of the treasury pages
          "veNftId": sAeroToken.veNftIds!.join(', '),
        },
        "chainCodeName": "base",
        "key": `Aero sAERO veNfts ${sAeroToken.veNftIds!.join(', ')}`,
      });
    }

    // temp: zerion does not support the Aero protocol yet, the TWG DOLA-USDC positions are added if zerion does not have them
    const twgFunds: any[] = multisigData.find(m => m.address === twg.address && m.chainId === twg.chainId)!.funds;
    const aeroIds = aeroDolaUsdcPositions.map(p => p.id);
    const isAeroDolaUsdcInZerion = twgFunds.some(f => f.token.address?.toLowerCase() === AERO_DOLA_USDC_POOL.toLowerCase()
      || (/aero|velodrome|slipstream/i.test(f.key || '') && (aeroIds.includes(f.nftId) || /dola/i.test(f.key))));
    if (aeroIds.length > 0 && !isAeroDolaUsdcInZerion) {
      const dolaAmount = aeroDolaUsdcPositions.reduce((prev, curr) => prev + curr.dolaAmount, 0);
      const usdcAmount = aeroDolaUsdcPositions.reduce((prev, curr) => prev + curr.usdcAmount, 0);
      const name = `Aero DOLA/USDC #${aeroIds.join(', #')}`;
      twgFunds.push({
        "balance": dolaAmount * (prices['dola-usd'] || 1) + usdcAmount * (prices['usd-coin'] || 1),
        "price": 1,
        "onlyUsdValue": true,
        "allowance": 0,
        "token": {
          "decimals": 18,
          "name": name,
          "symbol": name,
          "image": TOKEN_IMAGES.DOLA,
          "protocolImage": PROTOCOL_IMAGES.AERO,
          "isStable": true,
          "isLP": true,
          "address": AERO_DOLA_USDC_POOL,
        },
        "chainCodeName": "ethereum",
        "key": `Aero-${name}`,
      });
    }

    const resultData = {
      timestamp: Date.now(),
      bonds: {
        balances: []//bondManagerBalances.map((bn, i) => formatBn(bn, TOKENS[bondTokens[i]])),
      },
      anchorReserves: anchorReserves.map((bn, i) => formatBn(bn, UNDERLYING[ANCHOR_TOKENS[i]])).filter(d => d.balance > 0),
      treasury: treasuryBalances.filter(d => d.balance > 0),
      multisigs: multisigData,
    }

    await redisSetWithTimestamp(cacheKey, resultData);

    if (isTakeSnapshot) {
      await takeSnapshot(resultData, treasuryAssetsSnapshotsCacheKey, provider, paidProvider);
    }

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
