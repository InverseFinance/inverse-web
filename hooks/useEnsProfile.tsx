import { EnsProfile, NetworkIds, SWR } from '@app/types'
import useSWR from 'swr'
import { AlchemyProvider } from '@ethersproject/providers';
import { getEnsName } from '@app/util';
import { isAddress } from 'ethers/lib/utils';

type Output = {
  ensName?: string
  ensProfile?: EnsProfile
  hasEnsProfile?: boolean
}

export const useEnsProfile = (address: string, avatarOnly?: boolean): SWR & Output => {
  const ensProvider = new AlchemyProvider(Number(NetworkIds.mainnet), process?.env?.NEXT_PUBLIC_ENS_ALCHEMY_API)
  const { data, error } = useSWR(`ens-${address}`, async () => {
    if (!address || !isAddress(address)) {
      return ({
        ensName: '',
        ensProfile: {},
      })
    }
    const ensName = (await getEnsName(address, true, ensProvider)) || '';
    const ensProfile = {}

    if (ensName) {
      const ensResolver = await ensProvider.getResolver(ensName);
      const settled = await Promise.allSettled([
        ensResolver.getText('avatar'),
        avatarOnly ? new Promise((r) => r('')) : ensResolver.getText('description'),
        avatarOnly ? new Promise((r) => r('')) : ensResolver.getText('com.twitter'),
        avatarOnly ? new Promise((r) => r('')) : ensResolver.getText('com.github'),
        avatarOnly ? new Promise((r) => r('')) : ensResolver.getText('org.telegram'),
      ]);
      const [avatar, description, twitter, github, telegram] =  settled
      const profileData = { avatar, description, twitter, github, telegram };
      Object.entries(profileData).forEach(([key, res]) => {
        if(!!res && res.status === 'fulfilled' && !!res.value && res.value.length) {
          ensProfile[key] = res.value
        }
      })
    }

    return {
      ensName,
      ensProfile,
      hasEnsProfile: !!Object.keys(ensProfile).length
    }
  })

  return {
    ensName: data?.ensName || '',
    ensProfile: data?.ensProfile || {},
    hasEnsProfile: data?.hasEnsProfile || false,
    isLoading: !error && !data,
    isError: error,
  }
}
