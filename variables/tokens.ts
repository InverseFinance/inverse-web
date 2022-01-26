import { TokenList } from '@app/types';
import { getRewardToken, getToken } from '@app/util/markets';

const chainTokenAddresses = {
  "1": {
    INV: '0x41D5D79431A913C4aE7d69a668ecdfE5fF9DFB68',
    DOLA: '0x865377367054516e17014CcdED1e7d814EDC9ce4',
    DAI: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
    USDC: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    USDT: '0xdac17f958d2ee523a2206206994597c13d831ec7',
    WETH: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
    YFI: '0x0bc529c00C6401aEF6D220BE8C6Ea1667F6Ad93e',
    XSUSHI: '0x8798249c2E607446EfB7Ad49eC89dD1865Ff4272',
    WBTC: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
    STETH: '0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84',
    INVDOLASLP: '0x5BA61c0a8c4DccCc200cd0ccC40a5725a426d002',
    DOLA3POOLCRV: '0xAA5A67c256e27A5d80712c51971408db3370927D',
    THREECRV: '0x6c3f90f043a72fa612cbac8115ee7e52bde6e490',
    FLOKI: '0x43f11c02439e2736800433b4594994Bd43Cd066D',
  }
}

const chainTokens = {
  "1": {
    // Chain's coin
    CHAIN_COIN: {
      address: '',
      name: 'Ether',
      symbol: 'ETH',
      coingeckoId: 'ethereum',
      image: 'https://assets.coingecko.com/coins/images/279/small/ethereum.png',
      decimals: 18,
    },
    // Tokens
    [chainTokenAddresses["1"].DAI]: {
      address: chainTokenAddresses["1"].DAI,
      name: 'Dai',
      symbol: 'DAI',
      coingeckoId: 'dai',
      image: 'https://assets.coingecko.com/coins/images/9956/small/dai-multi-collateral-mcd.png',
      decimals: 18,
    },
    [chainTokenAddresses["1"].USDT]: {
      address: chainTokenAddresses["1"].USDT,
      name: 'Tether',
      symbol: 'USDT',
      coingeckoId: 'tether',
      image: 'https://assets.coingecko.com/coins/images/325/small/Tether-logo.png',
      decimals: 6,
    },
    [chainTokenAddresses["1"].USDC]: {
      address: chainTokenAddresses["1"].USDC,
      name: 'USD Coin',
      symbol: 'USDC',
      coingeckoId: 'usd-coin',
      image: 'https://assets.coingecko.com/coins/images/6319/small/USD_Coin_icon.png',
      decimals: 6,
    },
    [chainTokenAddresses["1"].WETH]: {
      address: chainTokenAddresses["1"].WETH,
      name: 'Wrapped Ethereum',
      symbol: 'WETH',
      coingeckoId: 'weth',
      image: 'https://assets.coingecko.com/coins/images/2518/small/weth.png',
      decimals: 18,
      isWrappedChainCoin: true,
    },
    [chainTokenAddresses["1"].YFI]: {
      address: chainTokenAddresses["1"].YFI,
      name: 'Yearn',
      symbol: 'YFI',
      coingeckoId: 'yearn-finance',
      image: 'https://assets.coingecko.com/coins/images/11849/small/yfi-192x192.png',
      decimals: 18,
    },
    [chainTokenAddresses["1"].XSUSHI]: {
      address: chainTokenAddresses["1"].XSUSHI,
      name: 'xSUSHI',
      symbol: 'xSUSHI',
      coingeckoId: 'xsushi',
      image: 'https://assets.coingecko.com/coins/images/13725/small/xsushi.png',
      decimals: 18,
    },
    [chainTokenAddresses["1"].WBTC]: {
      address: chainTokenAddresses["1"].WBTC,
      name: 'Wrapped Bitcoin',
      symbol: 'WBTC',
      coingeckoId: 'wrapped-bitcoin',
      image: 'https://assets.coingecko.com/coins/images/7598/small/wrapped_bitcoin_wbtc.png',
      decimals: 8,
    },
    [chainTokenAddresses["1"].STETH]: {
      address: chainTokenAddresses["1"].STETH,
      name: 'Lido Staked Ether',
      symbol: 'stETH',
      coingeckoId: 'staked-ether',
      image: 'https://assets.coingecko.com/coins/images/13442/small/steth_logo.png',
      decimals: 18,
    },
    [chainTokenAddresses["1"].INVDOLASLP]: {
      address: chainTokenAddresses["1"].INVDOLASLP,
      name: 'INV-DOLA SLP',
      symbol: 'INV-DOLA-SLP',
      //coingeckoId: 'staked-ether',
      image: 'https://assets.coingecko.com/coins/images/12271/small/512x512_Logo_no_chop.png',
      decimals: 18,
    },
    [chainTokenAddresses["1"].DOLA3POOLCRV]: {
      address: chainTokenAddresses["1"].DOLA3POOLCRV,
      name: 'Dola-3pool CRV LP',
      symbol: 'DOLA-3POOL',
      coingeckoId: 'lp-3pool-curve',
      image: 'https://assets.coingecko.com/coins/images/12972/small/3pool_128.png?1603948039',
      decimals: 18,
    },
    [chainTokenAddresses["1"].THREECRV]: {
      address: chainTokenAddresses["1"].THREECRV,
      name: 'lp-3pool-curve',
      symbol: '3CRV',
      coingeckoId: 'lp-3pool-curve',
      image: 'https://assets.coingecko.com/coins/images/12972/small/3pool_128.png?1603948039',
      decimals: 18,
    },
    [chainTokenAddresses["1"].FLOKI]: {
      address: chainTokenAddresses["1"].FLOKI,
      name: 'Floki',
      symbol: 'FLOKI',
      coingeckoId: 'floki-inu',
      image: 'https://assets.coingecko.com/coins/images/16746/small/FLOKI.png?1625835665',
      decimals: 9,
    },
  }
}

export const TOKENS: TokenList = {
  ...chainTokens[process.env.NEXT_PUBLIC_CHAIN_ID!],
  [process.env.NEXT_PUBLIC_REWARD_TOKEN!]: {
    address: process.env.NEXT_PUBLIC_REWARD_TOKEN,
    name: 'Inverse',
    symbol: 'INV',
    coingeckoId: 'inverse-finance',
    image: '/assets/favicon.png',
    decimals: 18,
  },
  [process.env.NEXT_PUBLIC_DOLA!]: {
    address: process.env.NEXT_PUBLIC_DOLA,
    name: 'Dola',
    symbol: 'DOLA',
    coingeckoId: 'dola-usd',
    image: 'https://assets.coingecko.com/coins/images/14287/small/anchor-logo-1-200x200.png',
    decimals: 18,
  },
};

/* 
 * Anchor Markets Underlyings
 * Markets listed here will appear in UI
 * Key: Anchor Market Address, value: Underlying Token
 */
const chainUnderlying = {
  "1": {
    '0x697b4acAa24430F254224eB794d2a85ba1Fa1FB8': TOKENS.CHAIN_COIN,
    '0x7Fcb7DAC61eE35b3D4a51117A7c58D53f0a8a670': getToken(TOKENS, chainTokenAddresses["1"].DOLA),
    '0x17786f3813E6bA35343211bd8Fe18EC4de14F28b': getToken(TOKENS, chainTokenAddresses["1"].WBTC),
    '0xD60B06B457bFf7fc38AC5E7eCE2b5ad16B288326': getToken(TOKENS, chainTokenAddresses["1"].XSUSHI),
    '0xde2af899040536884e062D3a334F2dD36F34b4a4': getToken(TOKENS, chainTokenAddresses["1"].YFI),
    '0xA978D807614c3BFB0f90bC282019B2898c617880': getToken(TOKENS, chainTokenAddresses["1"].STETH),
    '0xc528b0571D0BE4153AEb8DdB8cCeEE63C3Dd7760': getToken(TOKENS, chainTokenAddresses["1"].DOLA3POOLCRV),
    '0x4B228D99B9E5BeD831b8D7D2BCc88882279A16BB': getToken(TOKENS, chainTokenAddresses["1"].INVDOLASLP),
    '0x0BC08f2433965eA88D977d7bFdED0917f3a0F60B': getToken(TOKENS, chainTokenAddresses["1"].FLOKI),
  }
}

const underlying: TokenList = {
  [process.env.NEXT_PUBLIC_REWARD_STAKED_TOKEN!]: getToken(TOKENS, process.env.NEXT_PUBLIC_REWARD_TOKEN),
  ...chainUnderlying[process.env.NEXT_PUBLIC_CHAIN_ID!],
}

if (process.env.NEXT_PUBLIC_REWARD_STAKED_TOKEN_OLD) {
  underlying[process.env.NEXT_PUBLIC_REWARD_STAKED_TOKEN_OLD] = getToken(TOKENS, process.env.NEXT_PUBLIC_REWARD_TOKEN);
}

export const UNDERLYING = underlying;

export const REWARD_TOKEN = getRewardToken()
export const RTOKEN_CG_ID = REWARD_TOKEN?.coingeckoId!;