import { Web3Provider } from '@ethersproject/providers'
import { getNetworkConfigConstants } from '@app/util/networks'
import useEtherSWR from '@app/hooks/useEtherSWR'
import { BigNumberList, Market, SWR } from '@app/types'
import { fetcher } from '@app/util/web3'
import { useWeb3React } from '@web3-react/core'
import { BigNumber } from 'ethers'
import { useRouter } from 'next/dist/client/router'
import useSWR from 'swr'
import { HAS_REWARD_TOKEN } from '@app/config/constants'
import { usePrices } from '@app/hooks/usePrices';
import { useAccountMarkets, useMarkets } from './useMarkets'
import { getMonthlyRate, getParsedBalance } from '@app/util/markets'
import { useExchangeRates } from './useExchangeRates'
import { formatUnits } from '@ethersproject/units'

type Balances = {
  balances: BigNumberList
}

export const useBalances = (addresses: string[], method = 'balanceOf', address?: string): SWR & Balances => {
  const { account } = useWeb3React<Web3Provider>()
  const { query } = useRouter()
  const userAddress = address || (query?.viewAddress as string) || account;

  const { data, error } = useEtherSWR(
    addresses.map((address) => (address ? [address, method, userAddress] : ['getBalance', userAddress, 'latest']))
  )

  return {
    balances: data?.reduce((balances: BigNumberList, balance: BigNumber, i: number) => {
      balances[addresses[i] || 'CHAIN_COIN'] = balance
      return balances
    }, {}),
    isLoading: !error && !data,
    isError: error,
  }
}

export const useAccountBalances = (address?: string): SWR & Balances => {
  const { chainId } = useWeb3React<Web3Provider>()
  const { UNDERLYING } = getNetworkConfigConstants(chainId)
  const tokens = Object.values(UNDERLYING)

  return useBalances(tokens.map(t => t.address), 'balanceOf', address)
}

export const useSupplyBalances = (address?: string): SWR & Balances => {
  const { chainId } = useWeb3React<Web3Provider>()
  const { ANCHOR_TOKENS, XINV, XINV_V1 } = getNetworkConfigConstants(chainId)
  const tokens = ANCHOR_TOKENS.concat(HAS_REWARD_TOKEN && XINV ? [XINV] : []).concat(HAS_REWARD_TOKEN && XINV_V1 ? [XINV_V1] : [])
  return useBalances(tokens, 'balanceOf', address)
}

export const useBorrowBalances = (address?: string): SWR & Balances => {
  const { chainId } = useWeb3React<Web3Provider>()
  const { ANCHOR_TOKENS } = getNetworkConfigConstants(chainId)
  const tokens = ANCHOR_TOKENS
  return useBalances(tokens, 'borrowBalanceStored', address)
}

export const useStabilizerBalance = () => {
  const { data, error } = useSWR("/api/tvl", fetcher)

  return {
    balance: data?.stabilizer.tvl,
    isLoading: !error && !data,
    isError: error,
  }
}

export const useVaultBalances = () => {
  const { account, chainId } = useWeb3React<Web3Provider>()
  const { VAULT_DAI_ETH, VAULT_DAI_WBTC, VAULT_DAI_YFI, VAULT_USDC_ETH } = getNetworkConfigConstants(chainId)
  
  const { data } = useEtherSWR([
    [VAULT_DAI_ETH, 'balanceOf', account],
    [VAULT_DAI_WBTC, 'balanceOf', account],
    [VAULT_DAI_YFI, 'balanceOf', account],
    [VAULT_USDC_ETH, 'balanceOf', account],
  ])

  return {
    balances: {
      [VAULT_DAI_ETH]: data ? data[0] : BigNumber.from(0),
      [VAULT_DAI_WBTC]: data ? data[1] : BigNumber.from(0),
      [VAULT_DAI_YFI]: data ? data[2] : BigNumber.from(0),
      [VAULT_USDC_ETH]: data ? data[3] : BigNumber.from(0),
    },
  }
}

export const useBorrowedAssets = (account?: string) => {
  const { prices } = usePrices()
  const { markets, isLoading: marketsLoading } = useMarkets()
  const { balances, isLoading: balancesLoading } = useBorrowBalances(account)

  const marketsWithBalance = markets?.map((market) => {
    const { token, underlying, borrowApy } = market;
    const balance = getParsedBalance(balances, token, underlying.decimals);
    const monthlyBorrowFee = getMonthlyRate(balance, borrowApy);
    const usdWorth = balance * (prices && prices[underlying.coingeckoId!]?.usd || 0);
    return { ...market, balance, monthlyBorrowFee, usdWorth }
  }).filter(m => m.balance > 0)

  return marketsWithBalance;
}

export const useSuppliedCollaterals = (address?: string) => {
  const { markets, isLoading: marketsLoading } = useMarkets()
  const { balances, isLoading: balancesLoading } = useSupplyBalances(address)
  const { markets: accountMarkets } = useAccountMarkets(address)
  const { exchangeRates } = useExchangeRates()

  const marketsWithBalance = markets?.map((market) => {
    const { token, underlying, oraclePrice } = market;

    const anTokenToTokenExRate = exchangeRates ? parseFloat(formatUnits(exchangeRates[token])) : 0;
    // balance of the "anchor" version of the token supplied
    const anTokenBalance = getParsedBalance(balances, token, underlying.decimals);
    // balance in undelying token
    const tokenBalance = anTokenBalance * anTokenToTokenExRate;

    const isCollateral = !!accountMarkets?.find((market: Market) => market?.token === token)
    const usdWorth = tokenBalance * oraclePrice;

    return { ...market, balance: tokenBalance, isCollateral, usdWorth }
  })

  return marketsWithBalance.filter(m => m.isCollateral && m.usdWorth > 0.1);
}