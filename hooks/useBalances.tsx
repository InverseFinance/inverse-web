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
import { useAnchorPricesUsd } from '@app/hooks/usePrices';
import { useAccountMarkets, useMarkets } from './useMarkets'
import { getBnToNumber, getMonthlyRate, getParsedBalance } from '@app/util/markets'
import { useExchangeRates } from './useExchangeRates'
import { formatUnits } from '@ethersproject/units'
import { CTOKEN_ABI, ERC20_ABI } from '@app/config/abis'

const { INV } = getNetworkConfigConstants(1);

type Balances = {
  balances: BigNumberList
}

export const useBalances = (addresses: string[], method = 'balanceOf', address?: string, abi?: any[]): SWR & Balances => {
  const { account } = useWeb3React<Web3Provider>()
  const { query } = useRouter()
  const userAddress = address || (query?.viewAddress as string) || account;

  const { data, error } = useEtherSWR({
    abi: abi || ERC20_ABI,
    args: addresses.map((address) => (address ? [address, method, userAddress] : ['getBalance', userAddress, 'latest'])),
  })

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
  return useBalances(tokens, 'balanceOf', address, CTOKEN_ABI)
}

export const useBorrowBalances = (address?: string): SWR & Balances => {
  const { chainId } = useWeb3React<Web3Provider>()
  const { ANCHOR_TOKENS } = getNetworkConfigConstants(chainId)
  const tokens = ANCHOR_TOKENS
  return useBalances(tokens, 'borrowBalanceStored', address, CTOKEN_ABI)
}

export const useStabilizerBalance = () => {
  const { data, error } = useSWR("/api/tvl", fetcher)

  return {
    balance: data?.stabilizer.tvl,
    isLoading: !error && !data,
    isError: error,
  }
}

export const useBorrowedAssets = (account?: string) => {
  const { prices: freshOraclePrices } = useAnchorPricesUsd()
  const { markets, isLoading: marketsLoading } = useMarkets()
  const { balances, isLoading: balancesLoading } = useBorrowBalances(account)

  const marketsWithBalance = markets?.map((market) => {
    const { token, underlying, borrowApy, oraclePrice } = market;
    const price = freshOraclePrices && freshOraclePrices[token] ? freshOraclePrices[token] : oraclePrice;
    const balance = getParsedBalance(balances, token, underlying.decimals);
    const monthlyBorrowFee = getMonthlyRate(balance, borrowApy);
    const usdWorth = balance * price;
    return { ...market, balance, monthlyBorrowFee, usdWorth, usdPrice: price, ctoken: token }
  }).filter(m => m.balance > 0)

  return marketsWithBalance;
}

export const useSuppliedBalances = (address?: string) => {
  const { markets, isLoading: marketsLoading } = useMarkets()
  const { balances, isLoading: balancesLoading } = useSupplyBalances(address)
  const { markets: accountMarkets } = useAccountMarkets(address)
  const { exchangeRates } = useExchangeRates()
  const { prices: freshOraclePrices } = useAnchorPricesUsd()

  const marketsWithBalance = markets?.map((market) => {
    const { token, underlying, oraclePrice, collateralFactor } = market;
    const price = freshOraclePrices && freshOraclePrices[token] ? freshOraclePrices[token] : oraclePrice;

    const anTokenToTokenExRate = exchangeRates ? parseFloat(formatUnits(exchangeRates[token])) : 0;
    // balance of the "anchor" version of the token supplied
    const anTokenBalance = getParsedBalance(balances, token, underlying.decimals);
    // balance in undelying token
    const tokenBalance = anTokenBalance * anTokenToTokenExRate;

    const isCollateral = !!accountMarkets?.find((market: Market) => market?.token === token)
    const usdWorth = tokenBalance * price;

    return { ...market, balance: tokenBalance, isCollateral, usdWorth, ctoken: market.token, usdPrice: price, collateralFactor }
  })

  return marketsWithBalance;
}

export const useSuppliedCollaterals = (address?: string) => {
  const marketsWithBalance = useSuppliedBalances(address);

  return marketsWithBalance.filter(m => m.isCollateral && m.usdWorth > 0.1);
}

export const useMarketCash = (market: Market): SWR & { cash: number } => {
  const { data, error } = useEtherSWR(
    [market.token, 'getCash'],
  )

  return {
    cash: data ? getBnToNumber(data, market.underlying.decimals) : 0,
    isLoading: !error && !data,
    isError: error,
  }
}

export const useINVBalance = (account: string, ad = INV) => {
  const { data, error } = useEtherSWR([ad, 'balanceOf', account]);
  return {
    bnBalance: data || BigNumber.from('0'),
    balance: data ? getBnToNumber(data) : 0,
    isLoading: !data && !error,
    hasError: !data && !!error,
  };
}