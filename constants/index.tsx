import { Token } from '@inverse/types'

export const START_BLOCK = 11915867
export const ETH_MANTISSA = 1e18
export const BLOCKS_PER_DAY = 6500
export const DAYS_PER_YEAR = 365

// Vaults
export const VAULT_USDC_ETH = '0x89eC5dF87a5186A0F0fa8Cb84EdD815de6047357'
export const VAULT_DAI_WBTC = '0xc8f2E91dC9d198edEd1b2778F6f2a7fd5bBeac34'
export const VAULT_DAI_YFI = '0x41D079ce7282d49bf4888C71B5D9E4A02c371F9B'
export const VAULT_DAI_ETH = '0x2dCdCA085af2E258654e47204e483127E0D8b277'
export const VAULT_TOKENS = [VAULT_USDC_ETH, VAULT_DAI_WBTC, VAULT_DAI_YFI, VAULT_DAI_ETH]

// Anchor
export const COMPTROLLER = '0x4dcf7407ae5c07f8681e1659f626e114a7667339'
export const ANCHOR_STABILIZER = '0x7eC0D931AFFBa01b77711C2cD07c76B970795CDd'
export const ANCHOR_TREASURY = '0x926df14a23be491164dcf93f4c468a50ef659d5b'

export const ANCHOR_ETH = '0x697b4acAa24430F254224eB794d2a85ba1Fa1FB8'
export const ANCHOR_DOLA = '0x7Fcb7DAC61eE35b3D4a51117A7c58D53f0a8a670'
export const ANCHOR_XSUSHI = '0xD60B06B457bFf7fc38AC5E7eCE2b5ad16B288326'
export const ANCHOR_WBTC = '0x17786f3813E6bA35343211bd8Fe18EC4de14F28b'
export const ANCHOR_YFI = '0xde2af899040536884e062D3a334F2dD36F34b4a4'
export const ANCHOR_TOKENS = [ANCHOR_ETH, ANCHOR_DOLA, ANCHOR_XSUSHI, ANCHOR_WBTC, ANCHOR_YFI]

// Governance
export const GOVERNANCE = '0x35d9f4953748b318f18c30634bA299b237eeDfff'

// Tokens
export const INV = '0x41D5D79431A913C4aE7d69a668ecdfE5fF9DFB68'
export const DOLA = '0x865377367054516e17014CcdED1e7d814EDC9ce4'
export const DAI = '0x6B175474E89094C44Da98b954EedeAC495271d0F'
export const USDC = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'
export const WETH = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'
export const YFI = '0x0bc529c00C6401aEF6D220BE8C6Ea1667F6Ad93e'
export const XSUSHI = '0x8798249c2E607446EfB7Ad49eC89dD1865Ff4272'
export const WBTC = '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599'
export const XINV = '0x65b35d6Eb7006e0e607BC54EB2dFD459923476fE'

export const TOKENS: { [key: string]: Token } = {
  ETH: {
    address: '',
    symbol: 'ETH',
    coingeckoId: 'ethereum',
    image: 'https://assets.coingecko.com/coins/images/279/small/ethereum.png',
    decimals: 18,
  },
  [INV]: {
    address: INV,
    symbol: 'INV',
    coingeckoId: 'inverse-finance',
    image: '/assets/favicon.png',
    decimals: 18,
  },
  [DOLA]: {
    address: DOLA,
    symbol: 'DOLA',
    coingeckoId: 'dola-usd',
    image: 'https://assets.coingecko.com/coins/images/14287/small/anchor-logo-1-200x200.png',
    decimals: 18,
  },
  [DAI]: {
    address: DAI,
    symbol: 'DAI',
    coingeckoId: 'dai',
    image: 'https://assets.coingecko.com/coins/images/9956/small/dai-multi-collateral-mcd.png',
    decimals: 18,
  },
  [USDC]: {
    address: USDC,
    symbol: 'USDC',
    coingeckoId: 'usd-coin',
    image: 'https://assets.coingecko.com/coins/images/6319/small/USD_Coin_icon.png',
    decimals: 6,
  },
  [WETH]: {
    address: WETH,
    symbol: 'WETH',
    coingeckoId: 'weth',
    image: 'https://assets.coingecko.com/coins/images/2518/small/weth.png',
    decimals: 18,
  },
  [YFI]: {
    address: YFI,
    symbol: 'YFI',
    coingeckoId: 'yearn-finance',
    image: 'https://assets.coingecko.com/coins/images/11849/small/yfi-192x192.png',
    decimals: 18,
  },
  [XSUSHI]: {
    address: XSUSHI,
    symbol: 'XSUSHI',
    coingeckoId: 'xsushi',
    image: 'https://assets.coingecko.com/coins/images/13725/small/xsushi.png',
    decimals: 18,
  },
  [WBTC]: {
    address: WBTC,
    symbol: 'WBTC',
    coingeckoId: 'wrapped-bitcoin',
    image: 'https://assets.coingecko.com/coins/images/7598/small/wrapped_bitcoin_wbtc.png',
    decimals: 8,
  },
}

export const UNDERLYING: { [key: string]: Token } = {
  [ANCHOR_ETH]: TOKENS.ETH,
  [ANCHOR_DOLA]: TOKENS[DOLA],
  [ANCHOR_XSUSHI]: TOKENS[XSUSHI],
  [ANCHOR_WBTC]: TOKENS[WBTC],
  [ANCHOR_YFI]: TOKENS[YFI],
  [XINV]: TOKENS[INV],
  [VAULT_USDC_ETH]: TOKENS[USDC],
  [VAULT_DAI_ETH]: TOKENS[DAI],
  [VAULT_DAI_WBTC]: TOKENS[DAI],
  [VAULT_DAI_YFI]: TOKENS[DAI],
}
