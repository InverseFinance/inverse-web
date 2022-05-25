import { HAS_REWARD_TOKEN } from '@app/config/constants';
import { Token, TokenList } from '@app/types';
import { isAddress } from 'ethers/lib/utils';

// TODO: refacto in cleaner way with markets and tokens

export const getToken = (tokens: TokenList, symbolOrAddress: string) => {
  return Object.entries(tokens)
    .map(([address, token]) => token)
    .find(token => isAddress(symbolOrAddress) ? token.address.toLowerCase() === symbolOrAddress.toLowerCase() : token.symbol.toLowerCase() === symbolOrAddress.toLowerCase())
}

export const getRewardToken = () => {
  return getToken(TOKENS, process.env.NEXT_PUBLIC_REWARD_TOKEN!)
}

const deprecatedBadge = {
  text: "DEPRECATED",
  color: "gray",
}

const pausedBadge = {
  text: "PAUSED",
  color: "gray",
}

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
    INVETHSLP: '0x328dFd0139e26cB0FEF7B0742B49b0fe4325F821',
    DOLA3POOLCRV: '0xAA5A67c256e27A5d80712c51971408db3370927D',
    THREECRV: '0x6c3f90f043a72fa612cbac8115ee7e52bde6e490',
    FLOKI: '0xcf0c122c6b73ff809c693db761e7baebe62b6a2e',
    WFTM: '0x4E15361FD6b4BB609Fa63C81A2be19d873717870',
    MIM: '0x99d8a9c45b2eca8864373a26d1459e3dff1e17f3',
    // yearn vaults
    YVDOLA3POOLCRV: '0xd88dBBA3f9c4391Ee46f5FF548f289054db6E51C',
    YVUSDT: '0x7Da96a3891Add058AdA2E826306D812C638D87a7',
    YVUSDC: '0xa354f35829ae975e850e23e9615b11da1b3dc4de',
    YVDAI: '0xda816459f1ab5631232fe5e97a05bbbb94970c95',
    // bacth2
    YVYFI: '0xdb25ca703181e7484a155dd612b06f57e12be5f0',
    YVWETH: '0xa258c4606ca8206d8aa700ce2143d7db854d168c',
    YVCRVCVXETH: '0x1635b506a88fbf428465ad65d00e8d6b6e5846c3',
  },
  "250": {
    DOLA2POOLCRV: '0x28368d7090421ca544bc89799a2ea8489306e3e5',
    SPOOKYLP: '0x49ec56cc2adaf19c1688d3131304dbc3df5e1ccd',
    DOLA: '0x3129662808bEC728a27Ab6a6b9AFd3cBacA8A43c',
    INV: '0xb84527D59b6Ecb96F433029ECc890D4492C5dCe1',
    USDC: '0x04068DA6C83AFCFA0e13ba15A6696662335D5B75',
    WFTM: '0x21be370D5312f44cB42ce377BC9b8a0cEF1A4C83',
  },
}
chainTokenAddresses["31337"] = chainTokenAddresses["1"];

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
      isInPausedSection: true,
      badge: pausedBadge,
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
      image: 'https://assets.coingecko.com/coins/images/12271/small/512x512_Logo_no_chop.png',
      decimals: 18,
      isLP: true,
      pairs: [
        chainTokenAddresses["1"].INV, chainTokenAddresses["1"].DOLA
      ],
    },
    [chainTokenAddresses["1"].INVETHSLP]: {
      address: chainTokenAddresses["1"].INVETHSLP,
      name: 'INV-ETH SLP',
      symbol: 'INV-ETH-SLP',
      image: 'https://assets.coingecko.com/coins/images/12271/small/512x512_Logo_no_chop.png',
      decimals: 18,
      isLP: true,
      pairs: [
        chainTokenAddresses["1"].INV, chainTokenAddresses["1"].WETH
      ],
    },
    [chainTokenAddresses["1"].DOLA3POOLCRV]: {
      address: chainTokenAddresses["1"].DOLA3POOLCRV,
      name: 'Dola-3pool CRV LP',
      symbol: 'DOLA-3POOL',
      coingeckoId: 'dai',
      image: 'https://assets.coingecko.com/coins/images/12972/small/3pool_128.png?1603948039',
      decimals: 18,
      isLP: true,
      isCrvLP: true,
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
      isInPausedSection: true,
      badge: deprecatedBadge,
    },
    [chainTokenAddresses["1"].WFTM]: {
      address: chainTokenAddresses["1"].WFTM,
      name: 'Fantom',
      symbol: 'WFTM',
      coingeckoId: 'fantom',
      image: 'https://assets.coingecko.com/coins/images/4001/small/Fantom.png?1558015016',
      decimals: 18,
    },
    [chainTokenAddresses["1"].MIM]: {
      address: chainTokenAddresses["1"].MIM,
      name: 'MIM',
      symbol: 'MIM',
      coingeckoId: 'magic-internet-money',
      image: 'https://assets.coingecko.com/coins/images/16786/small/mimlogopng.png?1624979612',
      decimals: 18,
    },
    [chainTokenAddresses["1"].YVCRVCVXETH]: {
      address: chainTokenAddresses["1"].YVCRVCVXETH,
      name: 'YV-CrvCvxEth',
      symbol: 'yvCrvCvxEth',
      image: 'https://assets.coingecko.com/coins/images/12972/small/3pool_128.png?1603948039',
      decimals: 18,
      protocolImage: 'https://assets.coingecko.com/coins/images/11849/small/yfi-192x192.png',
    },
  },
  "250": {
    CHAIN_COIN: {
      address: '',
      name: 'Fantom',
      symbol: 'FTM',
      coingeckoId: 'fantom',
      image: 'https://assets.coingecko.com/coins/images/4001/small/Fantom.png?1558015016',
      decimals: 18,
    },
    [chainTokenAddresses["250"].DOLA2POOLCRV]: {
      address: chainTokenAddresses["250"].DOLA2POOLCRV,
      name: 'Dola-2Pool CRV LP',
      symbol: 'DOLA-2POOL',
      coingeckoId: 'dai',
      image: 'https://assets.coingecko.com/markets/images/538/small/Curve.png?1591605481',
      decimals: 18,
      isLP: true,
      isCrvLP: true,
    },
    [chainTokenAddresses["250"].SPOOKYLP]: {
      address: chainTokenAddresses["250"].SPOOKYLP,
      name: 'Spooky LP',
      symbol: 'SPOOKY-LP',
      coingeckoId: '',
      image: 'https://assets.coingecko.com/markets/images/662/small/spookyswap.png?1639279823',
      decimals: 18,
      isLP: true,
      pairs: [
        chainTokenAddresses["250"].DOLA, chainTokenAddresses["250"].WFTM
      ],
    },
  },
}
chainTokens["31337"] = chainTokens["1"];

const copyAsYearnVault = ['DOLA3POOLCRV', 'USDC', 'USDT', 'DAI', 'YFI', 'WETH'];
copyAsYearnVault.forEach(s => {
  const token = chainTokens["1"][chainTokenAddresses["1"][s]];
  chainTokens["1"][chainTokenAddresses["1"][`YV${s}`]] = {
    ...token,
    address: chainTokenAddresses["1"][`YV${s}`],
    symbol: `yv${token.symbol}`.replace('yvDOLA-3POOL', 'yvcrvDOLA'),
    protocolImage: chainTokens["1"][chainTokenAddresses["1"]['YFI']].image,
    name: `yv${token.symbol}`.replace('yvDOLA-3POOL', 'yvcrvDOLA'),
    coingeckoId: undefined,
    badge: { text: 'NEW', color: 'white' },
  }
})

export const TOKENS: TokenList = {
  ...chainTokens[process.env.NEXT_PUBLIC_CHAIN_ID!],
  [process.env.NEXT_PUBLIC_REWARD_TOKEN!]: {
    address: process.env.NEXT_PUBLIC_REWARD_TOKEN,
    name: process.env.NEXT_PUBLIC_REWARD_TOKEN_NAME,
    symbol: process.env.NEXT_PUBLIC_REWARD_TOKEN_SYMBOL,
    coingeckoId: process.env.NEXT_PUBLIC_REWARD_TOKEN_CG_ID,
    image: process.env.NEXT_PUBLIC_REWARD_TOKEN_LOGO,
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

const copyToFtm = ["DOLA", "INV", "USDC", "WFTM"];
copyToFtm.forEach(sym => {
  chainTokens["250"][chainTokenAddresses["250"][sym]] = {
    ...TOKENS[chainTokenAddresses["1"][sym]],
    address: chainTokenAddresses["250"][sym],
  }
});

export const CHAIN_TOKENS: { [key: string]: TokenList } = { ...chainTokens, [process.env.NEXT_PUBLIC_CHAIN_ID!]: TOKENS };

const toV1 = (token: Token) => {
  return {
    ...token,
    symbol: `${token.symbol}-v1`,
    name: `${token.name}-v1`,
    isInPausedSection: true,
    badge: pausedBadge,
  }
}

/* 
 * Anchor Markets Underlyings
 * Markets listed here will appear in UI
 * Key: Anchor Market Address, value: Underlying Token
 */
const chainUnderlying = {
  "1": {
    '0x697b4acAa24430F254224eB794d2a85ba1Fa1FB8': toV1(TOKENS.CHAIN_COIN),
    '0x17786f3813E6bA35343211bd8Fe18EC4de14F28b': toV1(getToken(TOKENS, chainTokenAddresses["1"].WBTC)!),
    '0xde2af899040536884e062D3a334F2dD36F34b4a4': toV1(getToken(TOKENS, chainTokenAddresses["1"].YFI)!),
    // v2 markets
    '0x8e103Eb7a0D01Ab2b2D29C91934A9aD17eB54b86': TOKENS.CHAIN_COIN,
    '0xE8A2eb30E9AB1b598b6a5fc4aa1B80dfB6F90753': getToken(TOKENS, chainTokenAddresses["1"].WBTC)!,
    // '0x55e9022e1E28831609B22F773fAdb41318F8a8Cc': getToken(TOKENS, chainTokenAddresses["1"].YFI)!,
    // others
    '0x7Fcb7DAC61eE35b3D4a51117A7c58D53f0a8a670': getToken(TOKENS, chainTokenAddresses["1"].DOLA),
    '0xD60B06B457bFf7fc38AC5E7eCE2b5ad16B288326': getToken(TOKENS, chainTokenAddresses["1"].XSUSHI),
    '0xA978D807614c3BFB0f90bC282019B2898c617880': getToken(TOKENS, chainTokenAddresses["1"].STETH),
    '0xc528b0571D0BE4153AEb8DdB8cCeEE63C3Dd7760': getToken(TOKENS, chainTokenAddresses["1"].DOLA3POOLCRV),
    '0x4B228D99B9E5BeD831b8D7D2BCc88882279A16BB': getToken(TOKENS, chainTokenAddresses["1"].INVDOLASLP),
    '0x0BC08f2433965eA88D977d7bFdED0917f3a0F60B': getToken(TOKENS, chainTokenAddresses["1"].FLOKI),
    // yearn vaults
    '0x3cFd8f5539550cAa56dC901f09C69AC9438E0722': getToken(TOKENS, chainTokenAddresses["1"].YVDOLA3POOLCRV),
    '0x4597a4cf0501b853b029cE5688f6995f753efc04': getToken(TOKENS, chainTokenAddresses["1"].YVUSDT),
    '0x7e18AB8d87F3430968f0755A623FB35017cB3EcA': getToken(TOKENS, chainTokenAddresses["1"].YVUSDC),
    '0xD79bCf0AD38E06BC0be56768939F57278C7c42f7': getToken(TOKENS, chainTokenAddresses["1"].YVDAI),
    // bacth 2
    '0xE809aD1577B7fF3D912B9f90Bf69F8BeCa5DCE32': getToken(TOKENS, chainTokenAddresses["1"].YVYFI),
    '0xD924Fc65B448c7110650685464c8855dd62c30c0': getToken(TOKENS, chainTokenAddresses["1"].YVWETH),
    '0xa6F1a358f0C2e771a744AF5988618bc2E198d0A0': getToken(TOKENS, chainTokenAddresses["1"].YVCRVCVXETH),

  }
}
chainUnderlying["31337"] = chainUnderlying["1"];

const underlying: TokenList = {
  ...chainUnderlying[process.env.NEXT_PUBLIC_CHAIN_ID!],
}

if (HAS_REWARD_TOKEN) {
  underlying[process.env.NEXT_PUBLIC_REWARD_STAKED_TOKEN!] = getToken(TOKENS, process.env.NEXT_PUBLIC_REWARD_TOKEN);
  if (process.env.NEXT_PUBLIC_REWARD_STAKED_TOKEN_OLD) {
    underlying[process.env.NEXT_PUBLIC_REWARD_STAKED_TOKEN_OLD] = getToken(TOKENS, process.env.NEXT_PUBLIC_REWARD_TOKEN);
  }
}

export const UNDERLYING = underlying;

export const REWARD_TOKEN = getRewardToken()
export const RTOKEN_CG_ID = REWARD_TOKEN?.coingeckoId!;
export const RTOKEN_SYMBOL = REWARD_TOKEN?.symbol!;

export const BONDS = [
  {
    input: chainTokenAddresses["1"].INVDOLASLP,
    abiType: 1,
    ctoken: '0x4B228D99B9E5BeD831b8D7D2BCc88882279A16BB',
    underlying: getToken(TOKENS, chainTokenAddresses["1"].INVDOLASLP)!,
    bondContract: '0x34eb308c932fe3bbda8716a1774ef01d302759d9',
    howToGetLink: 'https://app.sushi.com/add/0x41D5D79431A913C4aE7d69a668ecdfE5fF9DFB68/0x865377367054516e17014ccded1e7d814edc9ce4',
  },
  {
    input: chainTokenAddresses["1"].DOLA,
    abiType: 0,
    ctoken: '0x7Fcb7DAC61eE35b3D4a51117A7c58D53f0a8a670',
    underlying: getToken(TOKENS, chainTokenAddresses["1"].DOLA)!,
    bondContract: '0xdBfBb1140F8ba147ca4C8c27A2e576dfed0449BD',
    howToGetLink: 'https://www.inverse.finance/swap/DAI/DOLA',
    inputPrice: 1,
  },
  {
    input: chainTokenAddresses["1"].DOLA3POOLCRV,
    abiType: 0,
    ctoken: '0xc528b0571D0BE4153AEb8DdB8cCeEE63C3Dd7760',
    underlying: getToken(TOKENS, chainTokenAddresses["1"].DOLA3POOLCRV)!,
    bondContract: '0x8E57A30A3616f65e7d14c264943e77e084Fddd25',
    howToGetLink: 'https://curve.fi/factory/27/deposit',
  },
]

export const REPAY_ALL_CONTRACTS = {
  '0x697b4acAa24430F254224eB794d2a85ba1Fa1FB8': '0xbE0C9650cf8Ce5279b990e7A6634c63323adfEAE',
  '0x8e103Eb7a0D01Ab2b2D29C91934A9aD17eB54b86': '0xbE0C9650cf8Ce5279b990e7A6634c63323adfEAE',
}