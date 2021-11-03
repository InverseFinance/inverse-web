import { getNetworkConfigConstants } from '@inverse/config/networks'

export const namedAddress = (address: string, chainId?: string | number, ensName?: string) => {
  const { NAMED_ADDRESSES } = getNetworkConfigConstants(chainId);
  if (NAMED_ADDRESSES[address]) {
    return NAMED_ADDRESSES[address]
  }

  return ensName || `${address.substr(0, 6)}...${address.substr(address.length - 4)}`
}
