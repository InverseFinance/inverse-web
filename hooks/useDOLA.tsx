import { SWR } from '@app/types'
import { fetcher } from '@app/util/web3'
import { useWeb3React } from '@web3-react/core';
import { Web3Provider } from '@ethersproject/providers';
import { useCustomSWR } from './useCustomSWR';
import { usePositions } from './usePositions';
import { getNetworkConfigConstants } from '@app/util/networks';
import useEtherSWR from './useEtherSWR';
import { getBnToNumber } from '@app/util/markets';
import { BigNumber } from 'ethers';
import { timestampToUTC, utcDateStringToTimestamp } from '@app/util/misc';
import { useDOLAPrice } from './usePrices';
import { useState } from 'react';

type DolaSupply = {
  totalSupply: number,
  firmSupply: number,
}

const { ANCHOR_DOLA, DOLA } = getNetworkConfigConstants();

export const useDOLA = (): SWR & DolaSupply => {
  const { data, error } = useCustomSWR(`/api/dola`, fetcher)

  return {
    totalSupply: data?.totalSupply || 0,
    firmSupply: data?.firmSupply || 0,
    isLoading: !error && !data,
    isError: error,
  }
}

const nonFrontierDolaShortfall = 520000;

export const useDOLAShortfall = (): SWR & DolaSupply & {
  frontierDolaShortfall: number
  totalDolaShortfall: number
  shortfallPerc: number
} => {
  const { chainId } = useWeb3React<Web3Provider>()

  const { data, error } = useCustomSWR(`/api/dola?chainId=${chainId || process.env.NEXT_PUBLIC_CHAIN_ID!}`, fetcher)

  const { positions, markets } = usePositions({ accounts: '' });

  const frontierDolaShortfall = positions?.reduce((prev, curr) => {
    const dola = curr.borrowed.find(item => markets[item.marketIndex] === ANCHOR_DOLA);
    return prev + (dola ? Math.min(dola.usdWorth, curr.usdShortfall) : 0);
  }, 0) || 0;

  const totalSupply = data?.totalSupply || 0;
  const totalDolaShortfall = frontierDolaShortfall + nonFrontierDolaShortfall;

  return {
    totalSupply,
    totalDolaShortfall,
    frontierDolaShortfall: frontierDolaShortfall,
    shortfallPerc: totalDolaShortfall / totalSupply * 100,
    isLoading: !error && !data,
    isError: error,
  }
}

export const useDOLABalance = (account: string, ad = DOLA) => {
  const { data, error } = useEtherSWR([ad, 'balanceOf', account]);
  return {
    bnBalance: data || BigNumber.from('0'),
    balance: data ? getBnToNumber(data) : 0,
    isLoading: !data && !error,
    hasError: !data && !!error,
  };
}

export const useDOLAMarketData = (): SWR & { hasError: boolean, data: { market_data: { total_volume: { usd: number } } } } => {
  const url = `https://api.coingecko.com/api/v3/coins/dola-usd?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=false`;
  // const  url = `/api/dola/market`;
  const { data, error } = useCustomSWR(url, fetcher);
  return {
    data,
    isLoading: !data && !error,
    hasError: !data && !!error,
  };
}

export const useDolaCirculatingSupplyEvolution = () => {
  const { data, error } = useCustomSWR(`/api/dola/circulating-supply-evolution?c=1`);
  const { data: currentCirculatingSupply } = useCustomSWR(`/api/dola/circulating-supply`);

  const array = (data?.evolution || []);
  if (array.length > 0 && !!currentCirculatingSupply) {
    array.push({ circSupply: currentCirculatingSupply, utcDate: new Date().toISOString().substring(0, 10) });
  }

  const evolution = array.map((v, i) => {
    const ts = utcDateStringToTimestamp(v.utcDate);
    return ({
      ...v,
      timestamp: ts,
      x: ts,
      y: v.circSupply,
    });
  });
  evolution.sort((a, b) => a.x - b.x);

  return {
    currentCirculatingSupply,
    evolution,
    isLoading: !error && !data,
    isError: !!error,
  }
}

export const useDolaVolumes = () => {
  const { data, error } = useCustomSWR(`/api/dola/prices-volumes`);

  const volumes = (data?.volumes || []);

  return {
    evolution: volumes.map((d) => {
      const [ts, vol] = d;
      return {
        utcDate: timestampToUTC(ts),
        x: ts,
        y: vol,
      }
    }),
    isLoading: !error && !data,
    isError: !!error,
  }
}

export const useDolaPrices = () => {
  const { data, error } = useCustomSWR(`/api/dola/prices-volumes`);
  const { price } = useDOLAPrice();
  const [now, setNow] = useState(Date.now());

  const prices = (data?.prices || []);
  if (prices.length > 0 && !!price) {
    prices.push([now, price]);
  }

  return {
    evolution: prices.map((d) => {
      const [ts, price] = d;
      return {
        utcDate: timestampToUTC(ts),
        x: ts,
        y: price,
      }
    }),
    isLoading: !error && !data,
    isError: !!error,
  }
}