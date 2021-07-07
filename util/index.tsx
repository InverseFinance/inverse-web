import { NAMED_ADDRESSES } from '@inverse/config'

export const namedAddress = (address: string, ensName?: string) => {
  if (NAMED_ADDRESSES[address]) {
    return NAMED_ADDRESSES[address]
  }

  return ensName || `${address.substr(0, 6)}...${address.substr(address.length - 4)}`
}
