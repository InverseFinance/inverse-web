import { ReactNode } from 'react';
import { Tooltip, IconProps, TooltipProps, Flex, Box, FlexProps, Popover, PopoverTrigger, PopoverBody, PopoverContent, PopoverCloseButton } from '@chakra-ui/react'
import { InfoOutlineIcon } from '@chakra-ui/icons'
import { InfoAnimIcon } from '@app/components/common/Animation';

type InfoTooltipProps = { message: ReactNode, iconProps?: IconProps, tooltipProps?: Partial<TooltipProps>, children?: ReactNode };

export const InfoTooltip = ({ message, iconProps, tooltipProps, children }: InfoTooltipProps) => {
  return (
    <Tooltip
      label={message}
      fontWeight="medium"
      fontSize="15px"
      p={3}
      borderRadius={8}
      bgColor="primary.800"
      borderColor="primary.850"
      textAlign="center"
      borderWidth={1}
      {...tooltipProps}
    >
      {children ? children : <InfoOutlineIcon {...iconProps} />}
    </Tooltip>
  )
}

export const InfoPopover = ({ message, iconProps, tooltipProps, children }: InfoTooltipProps) => {
  return (
    <Popover
      isLazy
      trigger="hover"
      strategy="fixed"
    >
      <PopoverTrigger>
        {children ? children : <InfoOutlineIcon {...iconProps} />}
      </PopoverTrigger>
      <PopoverContent
        fontWeight="medium"
        fontSize="15px"
        p={1}
        borderRadius={8}
        bgColor="primary.800"
        borderColor="primary.850"
        textAlign="center"
        borderWidth={1}
        textTransform="none"
        w='fit-content'
        maxW='300px'
        color="mainTextColor"
        {...tooltipProps}>
        <PopoverCloseButton display={{ lg: 'none' }} />
        <PopoverBody>
          {message}
        </PopoverBody>
      </PopoverContent>
    </Popover>
  )
}

const iconSizes = {
  normal: { boxSize: '14px', mr: '1' },
  intermediary: { boxSize: '3', mr: '1' },
  small: { boxSize: '12px', p: '2px', mr: '1px' },
}

export const AnimatedInfoTooltip = ({
  message,
  size = 'normal',
  iconProps,
  children,
  type = 'popover',
  ...props
}: {
  message: ReactNode,
  size?: 'normal' | 'small' | 'intermediary',
  iconProps?: IconProps,
  type?: 'popover' | 'tooltip'
} & Partial<FlexProps>) => {
  const content = <Flex alignItems="center" {...props}>
    <InfoAnimIcon />
    <Box ml="2">{message}</Box>
  </Flex>

  const tooltipIconProps = iconProps || iconSizes[size];
  const Comp = type === 'popover' ? InfoPopover : InfoTooltip;

  return <Comp message={content}
    tooltipProps={{
      className: `blurred-container info-bg`,
      borderColor: 'info',
      color: 'mainTextColor'
    }}
    iconProps={{ ...tooltipIconProps }}
    children={children}
  />
}
