import { Box, BoxProps } from '@chakra-ui/react'

import { isAddress } from 'ethers/lib/utils';
import { useEnsProfile } from '@app/hooks/useEnsProfile';

export const Avatar = ({
  address,
  defaultAvatar = 'jazzicon',
  sizePx = 20,
  ...boxProps
}: {
  address: string,
  sizePx?: number,
  defaultAvatar?: 'blockies' | 'jazzicon',
} & Partial<BoxProps>) => {
  const avatarAddress = !address || !isAddress(address) ? '0x0000000000000000000000000000000000000000' : address
  const { ensProfile } = useEnsProfile(avatarAddress, true);

  return (
    <Box
      boxSize={`${sizePx}px`}
      backgroundImage={ensProfile?.avatar ? `url('${ensProfile?.avatar}')` : undefined}
      backgroundSize="cover"
      backgroundPosition="center"
      backgroundRepeat="no-repeat"
      borderRadius="50px"
      {...boxProps}>
        
    </Box>
  )
}
