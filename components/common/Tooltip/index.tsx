import { ReactNode } from 'react';
import { Tooltip, IconProps, TooltipProps, Flex, Text } from '@chakra-ui/react'
import { InfoOutlineIcon } from '@chakra-ui/icons'
import { InfoAnimatedIcon } from '../Animation/InfoAnim';

type InfoTooltipProps = { message: ReactNode, iconProps?: IconProps, tooltipProps?: Partial<TooltipProps> };

export const InfoTooltip = ({ message, iconProps, tooltipProps }: InfoTooltipProps) => {
  return (
    <Tooltip
      label={message}
      fontWeight="medium"
      fontSize="15px"
      p={3}
      borderRadius={8}
      bgColor="purple.800"
      borderColor="purple.850"
      textAlign="center"
      borderWidth={1}
      {...tooltipProps}
    >
      <InfoOutlineIcon {...iconProps} />
    </Tooltip>
  )
}

export const AnimatedInfoTooltip = ({ message, size = 'normal' }: { message: ReactNode, size?: 'normal' | 'small' }) => {
  const content = <Flex alignItems="center">
    <InfoAnimatedIcon />
    <Text ml="1">{message}</Text>
  </Flex>

  const iconSizeProps = size === 'normal' ? { boxSize: '14px', mr: '1' } : { boxSize: '12px', p: '2px', mr: '1px' }

  return <InfoTooltip message={content}
    tooltipProps={{ bgColor: 'blue.400' }}
    iconProps={{ ...iconSizeProps }} />
}
