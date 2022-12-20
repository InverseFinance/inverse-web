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

type DOLA = {
  totalSupply: number,
  firmSupply: number,
}

const { ANCHOR_DOLA, DOLA } = getNetworkConfigConstants();

export const useDOLA = (): SWR & DOLA => {
  const { data, error } = useCustomSWR(`/api/dola`, fetcher)

  return {
    totalSupply: data?.totalSupply || 0,
    firmSupply: data?.firmSupply || 0,
    isLoading: !error && !data,
    isError: error,
  }
}

const nonFrontierDolaShortfall = 520000;

export const useDOLAShortfall = (): SWR & DOLA & {
  frontierDolaShortfall: number
  totalDolaShortfall: number
  shortfallPerc: number
 } => {
  const { chainId } = useWeb3React<Web3Provider>()

  const { data, error } = useCustomSWR(`/api/dola?chainId=${chainId||process.env.NEXT_PUBLIC_CHAIN_ID!}`, fetcher)

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

export const useDOLABalance = (account: string) => {
  const { data, error } = useEtherSWR([DOLA, 'balanceOf', account]);
  return {
    bnBalance: data || BigNumber.from('0'),
    balance: data ? getBnToNumber(data) : 0,
    isLoading: !data && !error,
    hasError: !data && !!error,
  };
}
