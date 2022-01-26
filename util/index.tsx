import { getNetworkConfigConstants } from '@app/util/networks'
import localforage from 'localforage';
import { getProvider } from '@app/util/providers';
import { NetworkIds } from '@app/types';

export const getEnsName = async (address: string, isBackendSide = false, specificProvider?: any): Promise<string> => {
  try {
    const rememberedName: string = isBackendSide ? '' : await localforage.getItem(`ensName-${address}`) || '';
    if (rememberedName) { return rememberedName }
    const provider = specificProvider || getProvider(NetworkIds.mainnet, process.env.NEXT_PUBLIC_ENS_ALCHEMY_API, true);
    const ensName = await provider.lookupAddress(address);
    if (ensName && !isBackendSide) {
      await localforage.setItem(`ensName-${address}`, ensName);
    }
    return ensName;
  } catch (e: any) {
    console.log(e);
    if (e.message === 'STRINGPREP_CONTAINS_UNASSIGNED') {
      await localforage.setItem(`ensName-${address}`, '');
    }
  }
  return '';
}

export const namedAddress = (address: string, chainId?: string | number, ensName?: string) => {
  const { NAMED_ADDRESSES } = getNetworkConfigConstants(chainId);
  const name = Object.entries(NAMED_ADDRESSES)
    .find(([key, value]) => key.toLowerCase() === (address||'').toLowerCase());

  if (!!name) {
    return name[1];
  }

  return ensName || shortenAddress(address)
}

export const shortenAddress = (address: string) => {
  return `${address.substr(0, 6)}...${address.substr(address.length - 4)}`
}

export const checkEnv = () => {
  if (
    !process.env.NEXT_PUBLIC_CHAIN_ID
    || !process.env.NEXT_PUBLIC_REWARD_TOKEN
    || !process.env.NEXT_PUBLIC_REWARD_TOKEN_SYMBOL
    || !process.env.NEXT_PUBLIC_DOLA
    || !process.env.NEXT_PUBLIC_REWARD_STAKED_TOKEN
    || !process.env.NEXT_PUBLIC_ANCHOR_LENS
    || !process.env.NEXT_PUBLIC_ANCHOR_COMPTROLLER
    || !process.env.NEXT_PUBLIC_ANCHOR_ORACLE
    || !process.env.NEXT_PUBLIC_ANCHOR_TREASURY
    || !process.env.NEXT_PUBLIC_ANCHOR_COIN_REPAY_ALL
    || !process.env.NEXT_PUBLIC_ANCHOR_ESCROW
  ) {
    throw new Error("Missing Config")
  }
}
