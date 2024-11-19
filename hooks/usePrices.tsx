import { getNetworkConfigConstants } from '@app/util/networks'
import { Prices, StringNumMap, SWR, Token } from '@app/types'
import { fetcher, fetcherWithFallback } from '@app/util/web3'
import { BigNumber, Contract } from 'ethers'
import useEtherSWR from './useEtherSWR'
import { useWeb3React } from '@web3-react/core';
import { Web3Provider } from '@ethersproject/providers';
import { useCacheFirstSWR, useCustomSWR } from './useCustomSWR'
import { HAS_REWARD_TOKEN, TOKENS_VIEWER } from '@app/config/constants'
import { formatUnits } from '@ethersproject/units'
import { TOKENS, UNDERLYING } from '@app/variables/tokens'
import { getLPPrice } from '@app/util/contracts'
import { getBnToNumber } from '@app/util/markets';
import useSWR from 'swr'

const { ORACLE } = getNetworkConfigConstants();

export const usePrice = (coingeckoId: string): SWR & Prices => {
  const { data, error } = useCustomSWR(`${process.env.COINGECKO_PRICE_API}?vs_currencies=usd&ids=${coingeckoId}`, fetcher)

  return {
    prices: data || {},
    isLoading: !error && !data,
    isError: error,
  }
}

export const usePricesDefillama = (list: {chain: string, token: string}[]): SWR & { prices: { [key: string]: { price: number } }, simplifiedPrices: { [key: string]: number } } => {
  const { data, error } = useSWR(
    `https://coins.llama.fi/prices/current/ids=${list.map(d => `${d.chain}:${d.token}`).join(',')}`,
    {
      refreshInterval: 60000,
      dedupingInterval: 2000,
      refreshWhenHidden: false,
      revalidateOnFocus: true,
      errorRetryInterval: 60000,
      focusThrottleInterval: 60000,
    }
  );

  return {
    simplifiedPrices: data ? list.reduce((prev, curr) => ({...prev, [curr.token]: data.coins[`${curr.chain}:${curr.token}`]?.price}), {}) : {},
    prices: data ? data.coins : {},
    isLoading: !error && !data,
    isError: error,
  }
}

export const usePrices = (extras?: string[]): SWR & Prices => {
  const { chainId } = useWeb3React<Web3Provider>()
  const { TOKENS } = getNetworkConfigConstants(chainId)

  const coingeckoIds = Object.values(TOKENS)
    .filter(t => !!t.coingeckoId)
    .map(({ coingeckoId }) => coingeckoId)
    .concat(extras || []);

  const { data, error } = useCustomSWR(
    `${process.env.COINGECKO_PRICE_API}?vs_currencies=usd&ids=${coingeckoIds.join(',')}`,
    (url) => fetcherWithFallback(url, `/api/prices-cg-proxy?isDefault=${!extras?.length}&ids=${coingeckoIds.join(',')}`, async (res: Response) => {      
      if (!res.ok || res.status >= 400) {        
        return true;
      };      
      try {
        const json = await res.json();
        if (!json?.['inverse-finance']?.usd) {
          return true;
        }
      } catch (e) {        
        return true;
      }
      return false;
    }),
  );
  const { data: cachedProxyData, error: cachedProxyError } = useSWR(`/api/prices-cg-proxy?cacheFirst=true&isDefault=${!extras?.length}&ids=${coingeckoIds.join(',')}`)
  const cgOk = !!data?.['inverse-finance']?.usd;

  return {
    prices: cgOk ? data : cachedProxyData || {},
    isLoading: (!cgOk && !error && !cachedProxyData && !cachedProxyError),
    isError: !!error && !!cachedProxyError,
  }
}

// asUsdObject to get the same formatting as coingecko
export const usePricesV2 = (asUsdObject = true): SWR & Prices => {
  const { data, error } = useCustomSWR(
    `/api/prices?v2`,
    fetcher
  )

  const d = (data || {});
  const usdObjects = {};
  Object.entries(d).forEach(([key, val]) => usdObjects[key] = { usd: val });

  return {
    prices: asUsdObject ? usdObjects : d,
    isLoading: !error && !data,
    isError: error,
  }
}

export const useDOLAPrice = (): SWR & { price: number } => {
  const { data, error } = useCacheFirstSWR(`/api/dola-price`)

  return {
    price: data ? data['dola-usd'] : 1,
    isLoading: !error && !data,
    isError: error,
  }
}

export const useINVPrice = (): SWR & { price: number } => {
  const { data, error } = useCacheFirstSWR(`/api/inv-price`)

  return {
    price: data ? data['inverse-finance'] : 0,
    isLoading: !error && !data,
    isError: error,
  }
}

export const useDOLAPriceLive = (): { price: number | undefined } => {
  const { data: dolaPrice } = useEtherSWR({
    args: [
      [TOKENS_VIEWER, 'getDolaPrice'],
    ],
    abi: [
      'function getDolaPrice() public view returns(uint)',
    ],
  });

  return {
    price: dolaPrice ? getBnToNumber(dolaPrice) : undefined,
  }
}

export const useAnchorPrices = (): any => {
  const { chainId } = useWeb3React<Web3Provider>()
  const { ANCHOR_TOKENS, XINV, XINV_V1, ORACLE } = getNetworkConfigConstants(chainId)

  const tokens = ANCHOR_TOKENS.concat(HAS_REWARD_TOKEN && XINV ? [XINV] : []).concat(HAS_REWARD_TOKEN && XINV_V1 ? [XINV_V1] : [])
  const { data, error } = useEtherSWR(tokens.map((address: string) => [ORACLE, 'getUnderlyingPrice', address]))

  return {
    prices: data?.reduce((prices: { [key: string]: BigNumber }, price: BigNumber, i: number) => {
      prices[tokens[i]] = price
      return prices
    }, {}),
    isLoading: !error && !data,
    isError: error,
  }
}

export const useAnchorPricesUsd = () => {
  const { prices, isLoading, isError } = useAnchorPrices()

  let usdPrices: StringNumMap = {}
  for (var key in prices) {
    if (prices.hasOwnProperty(key)) {
      usdPrices[key] = parseFloat(formatUnits(prices[key], BigNumber.from(36).sub(UNDERLYING[key].decimals)))
    }
  }

  return {
    prices: usdPrices,
    isError,
    isLoading,
  }
}

export const useOraclePrice = (anToken: string) => {
  const { data, error } = useEtherSWR([
    ORACLE, 'getUnderlyingPrice', anToken
  ]);

  return {
    price: data ? parseFloat(formatUnits(data, BigNumber.from(36).sub(UNDERLYING[anToken].decimals))) : null,
    isLoading: !error && !data,
    isError: error,
  }
}

export const useGasPrice = () => {
  const { data } = useEtherSWR(['getGasPrice']);
  const gasPrice = Math.floor(!data ? 0 : parseFloat(formatUnits(data, 'gwei')));
  return gasPrice;
}

export const useTransactionCost = (contract: Contract, method: string, args: any[]) => {
  const { prices } = usePrices();
  const { data } = useEtherSWR(['getGasPrice']);
  const { data: txGas } = useCustomSWR(`estimate-gas-${contract.address}-${method}`, async () => {
    const gas = await contract.estimateGas[method](...args);
    return gas;
  });

  const gasPrice = Math.floor(!data ? 0 : parseFloat(formatUnits(data, 'gwei')));
  const costEth = gasPrice * (txGas ? parseFloat(formatUnits(txGas, 'gwei')) : 0);
  const costUsd = costEth * (prices && prices[TOKENS.CHAIN_COIN.coingeckoId] ? prices[TOKENS.CHAIN_COIN.coingeckoId].usd : 0);

  return {
    gasPrice,
    txGas,
    costEth,
    costUsd,
  }
}

export const useLpPrice = (LPToken: Token, chainId: string) => {
  const { account, provider } = useWeb3React<Web3Provider>();
  const data = useCustomSWR(`lp-price-${LPToken.symbol}-${chainId}-${account}`, async () => {
    return await getLPPrice(LPToken, chainId, provider?.getSigner());
  })

  return data || 0;
}

export const useLpPrices = (LPTokens: Token[], chainIds: string[]) => {
  const { account, provider } = useWeb3React<Web3Provider>();
  const data = useCustomSWR(`lp-prices-${LPTokens.map(t => t.symbol).join('-')}-${chainIds.join('-')}-${account}`, async () => {
    return await Promise.all(LPTokens.map((lp, i) => getLPPrice(lp, chainIds[i], provider?.getSigner())));
  })

  return data || LPTokens.map(lp => 0);
}

export const useStabilizerFees = (): SWR & { buyFee: number, sellFee: number } => {
  const { STABILIZER } = getNetworkConfigConstants();

  const { data: apiData, error } = useCustomSWR(
    `/api/stabilizer?v=1`,
    fetcher
  );

  const { data: realTimeData } = useEtherSWR([
    [STABILIZER, 'buyFee'],
    [STABILIZER, 'sellFee'],
  ]);

  return {
    buyFee: (realTimeData && getBnToNumber(realTimeData[0], 4)) ?? (apiData && apiData.buyFee) ?? 0.004,
    sellFee: (realTimeData && getBnToNumber(realTimeData[1], 4)) ?? (apiData && apiData.sellFee) ?? 0.001,
    isError: error,
  }
}

export const useHistoInvPrices = (): SWR & { prices: number[][] } => {
  const { data, error } = useCacheFirstSWR(`/api/inv/histo-prices`);

  return {
    prices: data?.prices || [],
    isLoading: !error && !data,
    isError: error,
  }
}