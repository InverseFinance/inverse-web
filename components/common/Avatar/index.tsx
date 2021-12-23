import { Box, BoxProps } from '@chakra-ui/react'
import Davatar, { DavatarProps } from '@davatar/react';

export const Avatar = ({
  address,
  defaultAvatar = 'blockies',
  boxSize = '20px',
  avatarSize = 20,
  ...boxProps
}: {
  address: string,
  boxSize?: number | string,
  avatarSize?: DavatarProps["size"],
  defaultAvatar?: 'blockies' | 'jazzicon',
} & Partial<BoxProps>) => (
  <Box boxSize={boxSize} {...boxProps}>
    <Davatar size={avatarSize} address={address} generatedAvatarType={defaultAvatar} />
  </Box>
)
