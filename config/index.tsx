import { mainnetConfig } from '@inverse/config/mainnet'
import { Token } from '@inverse/types'

// TODO: Clean-up config
const config = mainnetConfig

export const START_BLOCK = 11498340
export const ETH_MANTISSA = 1e18
export const BLOCKS_PER_DAY = 6500
export const DAYS_PER_YEAR = 365

// Vaults
export const VAULT_USDC_ETH = config.vaults.vaultUsdcEth
export const VAULT_DAI_WBTC = config.vaults.vaultDaiWbtc
export const VAULT_DAI_YFI = config.vaults.vaultDaiYfi
export const VAULT_DAI_ETH = config.vaults.vaultDaiEth
export const VAULT_TOKENS = [VAULT_USDC_ETH, VAULT_DAI_WBTC, VAULT_DAI_YFI, VAULT_DAI_ETH]

// Anchor
export const LENS = config.anchor.lens
export const COMPTROLLER = config.anchor.comptroller
export const ORACLE = config.anchor.oracle
export const STABILIZER = config.anchor.stabilizer
export const TREASURY = config.anchor.treasury

export const ANCHOR_ETH = config.anchor.markets.eth
export const ANCHOR_DOLA = config.anchor.markets.dola
export const ANCHOR_XSUSHI = config.anchor.markets.xsushi
export const ANCHOR_WBTC = config.anchor.markets.wbtc
export const ANCHOR_YFI = config.anchor.markets.yfi
export const ANCHOR_STETH = config.anchor.markets.steth
export const ANCHOR_TOKENS = [ANCHOR_ETH, ANCHOR_DOLA, ANCHOR_XSUSHI, ANCHOR_WBTC, ANCHOR_YFI, ANCHOR_STETH]

// Governance
export const GOVERNANCE = config.governance

// Tokens
export const INV = config.INV
export const DOLA = config.DOLA
export const DAI = config.DAI
export const USDC = config.USDC
export const WETH = config.WETH
export const YFI = config.YFI
export const XSUSHI = config.XSUSHI
export const WBTC = config.WBTC
export const XINV = config.XINV
export const STETH = config.STETH
export const THREECRV = config.THREECRV

// Rewards
export const DOLA3CRV = config.staking.dola3crv

export const TOKENS: { [key: string]: Token } = config.tokens

export const UNDERLYING: { [key: string]: Token } = {
  [ANCHOR_ETH]: TOKENS.ETH,
  [ANCHOR_DOLA]: TOKENS[DOLA],
  [ANCHOR_XSUSHI]: TOKENS[XSUSHI],
  [ANCHOR_WBTC]: TOKENS[WBTC],
  [ANCHOR_YFI]: TOKENS[YFI],
  [ANCHOR_STETH]: TOKENS[STETH],
  [XINV]: TOKENS[INV],
  [VAULT_USDC_ETH]: TOKENS[USDC],
  [VAULT_DAI_ETH]: TOKENS[DAI],
  [VAULT_DAI_WBTC]: TOKENS[DAI],
  [VAULT_DAI_YFI]: TOKENS[DAI],
}

export const CONTRACTS: { [key: string]: string } = {
  [ANCHOR_ETH]: 'anETH',
  [ANCHOR_DOLA]: 'anDOLA',
  [ANCHOR_XSUSHI]: 'anXSUSHI',
  [ANCHOR_WBTC]: 'anWBTC',
  [ANCHOR_YFI]: 'anYFI',
  [ANCHOR_STETH]: 'anStETH',
  [COMPTROLLER]: 'Comptroller',
  [DAI]: 'Dai',
  [DOLA]: 'DOLA',
  [INV]: 'INV',
  [ORACLE]: 'Oracle',
  [STABILIZER]: 'Stabilizer',
  [VAULT_USDC_ETH]: 'vaultUsdcEth',
  [VAULT_DAI_ETH]: 'vaultDaiEth',
  [VAULT_DAI_WBTC]: 'vaultDaiWbtc',
  [VAULT_DAI_YFI]: 'vaultDaiYfi',
  [XINV]: 'xINV',
  '0xFBAB1B85A145Cd648374aCebf84cDD0247268587': 'Vester',
  '0x926dF14a23BE491164dCF93f4c468A50ef659D5B': 'Timelock',
}

export const VAULTS: { [key: string]: { [key: string]: string } } = {
  [DAI]: {
    ETH: VAULT_DAI_ETH,
    [WBTC]: VAULT_DAI_WBTC,
    [YFI]: VAULT_DAI_YFI,
  },
  [USDC]: {
    ETH: VAULT_USDC_ETH,
  },
}
