import { Box, BoxProps } from '@chakra-ui/react'
import Davatar, { DavatarProps } from '@davatar/react';
import { getProvider } from '@inverse/util/providers';
import { NetworkIds } from '@inverse/types';

export const Avatar = ({
  address,
  defaultAvatar = 'blockies',
  sizePx = 20,
  provider,
  ...boxProps
}: {
  address: string,
  sizePx?: number,
  provider?: DavatarProps["provider"],
  defaultAvatar?: 'blockies' | 'jazzicon',
} & Partial<BoxProps>) => {
  // specific key for this usage only
  const defaultProvider = getProvider(NetworkIds.mainnet, 'Im06YX8gmXb3PDPLG7nv3ExIYGppGDvf', true);
  
  return (
    <Box boxSize={`${sizePx}px`} {...boxProps}>
      <Davatar provider={provider || defaultProvider} size={sizePx} address={address} generatedAvatarType={defaultAvatar} />
    </Box>
  )
}
