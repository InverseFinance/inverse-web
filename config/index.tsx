import { Token } from '@inverse/types'
import { mainnetConfig } from './mainnet'

const config = mainnetConfig

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
export const COMPTROLLER = config.anchor.comptroller
export const ANCHOR_STABILIZER = config.anchor.stabilizer
export const ANCHOR_TREASURY = config.anchor.treasury

export const ANCHOR_ETH = config.anchor.markets.eth
export const ANCHOR_DOLA = config.anchor.markets.dola
export const ANCHOR_XSUSHI = config.anchor.markets.xsushi
export const ANCHOR_WBTC = config.anchor.markets.wbtc
export const ANCHOR_YFI = config.anchor.markets.yfi
export const ANCHOR_TOKENS = [ANCHOR_ETH, ANCHOR_DOLA, ANCHOR_XSUSHI, ANCHOR_WBTC, ANCHOR_YFI]

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

export const TOKENS: any = config.tokens

export const UNDERLYING: any = {
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
