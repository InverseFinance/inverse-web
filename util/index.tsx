import { getNetworkConfigConstants } from '@inverse/config/networks'
import localforage from 'localforage';
import { getProvider } from '@inverse/util/providers';
import { NetworkIds } from '@inverse/types';

export const getEnsName = async (address: string): Promise<string> => {
  try {
    const rememberedName: string = await localforage.getItem(`ensName-${address}`) || '';
    if(rememberedName) { return rememberedName }
    const provider = getProvider(NetworkIds.mainnet);
    const ensName = await provider.lookupAddress(address);
    if(ensName) {
      localforage.setItem(`ensName-${address}`, ensName);
    }
    return ensName;
  } catch (e) {
    console.log(e);
  }
  return '';
}

export const namedAddress = (address: string, chainId?: string | number, ensName?: string) => {
  const { NAMED_ADDRESSES } = getNetworkConfigConstants(chainId);
  if (NAMED_ADDRESSES[address]) {
    return NAMED_ADDRESSES[address]
  }

  return ensName || shortenAddress(address)
}

export const shortenAddress = (address: string) => {
  return `${address.substr(0, 6)}...${address.substr(address.length - 4)}`
}
