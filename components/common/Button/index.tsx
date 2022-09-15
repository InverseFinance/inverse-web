import { Flex, Link, ButtonProps, FlexProps } from '@chakra-ui/react'
import NextLink from 'next/link'
import { getNetwork } from '@app/util/networks';
import { NetworkItem } from '@app/components/common/NetworkItem';
import { SmartButton } from './SmartButton';
import { SmartButtonProps } from '@app/types';
import { gaEvent } from '@app/util/analytics';
import { BUTTON_BG, BUTTON_BG_COLOR, BUTTON_TEXT_COLOR } from '@app/variables/theme';

export const LinkButton = ({
  children,
  href,
  target = '_self',
  isOutline = false,
  flexProps,
  ...props
}: {
  href: string
  children: React.ReactNode
  target?: string
  isOutline?: boolean
  flexProps?: FlexProps
}) => {
  const extraFlexProps = isOutline ? { bgColor: 'primary.850', borderColor: 'primary.600' } : { bgColor: 'primary.500', borderColor: 'primary.500' }
  const finalFlexProps = { ...extraFlexProps, ...flexProps };

  const handleGa = (e) => {
    const btnAction = e?.target?.getAttribute('data-ga-event') || e?.target?.innerText || '';
    if (btnAction) {
      gaEvent({ action: btnAction })
    }
  }

  return (
    <NextLink href={href} passHref>
      <Link onClick={handleGa} w="full" color="mainTextColor" fontSize="md" fontWeight="semibold" _hover={{}} target={target} _focus={{}} {...props} >
        <Flex
          justify="center"
          cursor="pointer"
          borderRadius={4}
          borderWidth={1}
          alignItems="center"
          p={2}
          _hover={{ bgColor: 'primary.600', borderColor: 'primary.600', transition: 'all 250ms' }}
          {...finalFlexProps}
        >
          {children}
        </Flex>
      </Link>
    </NextLink>
  )
}

export const LinkOutlineButton = ({
  children,
  href,
  target = '_self',
  ...props
}: {
  href: string
  children: React.ReactNode
  target: string
}) => (
  <LinkButton children={children} href={href} target={target} isOutline={true} {...props} />
)

export const StyledButton = (props: SmartButtonProps) => (
  <SmartButton
    bgColor="primary.500"
    cursor={props.onClick ? 'pointer' : ''}
    fontSize="sm"
    borderRadius={8}
    fontWeight="semibold"
    color="mainTextColor"
    height={8}
    pl={3}
    pr={3}
    _hover={{ bgColor: 'primary.600' }}
    {...props}
  />
)

export const NetworkButton = ({
  chainId,
  onClick,
  ...btnProps
}: {
  chainId: string | number | undefined,
  onClick?: () => void,
  btnProps?: ButtonProps,
}) => {
  if (!chainId) { return <></> }
  const network = getNetwork(chainId);

  return (
    <StyledButton
      bgColor={network.bgColor || 'primary.500'}
      onClick={onClick} {...btnProps}
    >
      <NetworkItem chainId={chainId} />
    </StyledButton>
  )
}

export const OutlineButton = (props: any) => (
  <Flex
    justify="center"
    cursor={props.onClick ? 'pointer' : ''}
    fontSize="sm"
    align="center"
    bgColor="primary.800"
    borderRadius={4}
    borderWidth={1}
    borderColor="primary.700"
    fontWeight="semibold"
    color="mainTextColor"
    p={2}
    pl={4}
    pr={4}
    _hover={{ bgColor: 'primary.850' }}
    {...props}
  />
)

export const SubmitButton = (props: SmartButtonProps) => {
  return (
    <SmartButton
      w="full"
      bg={BUTTON_BG}
      bgColor={!props?.colorScheme ? BUTTON_BG_COLOR : undefined}
      fontSize="13px"
      fontWeight="semibold"
      textTransform="uppercase"
      color={BUTTON_TEXT_COLOR}
      _focus={{}}
      _hover={!props?.colorScheme ? { filter: 'brightness(1.25)' } : undefined}
      {...props}
    />
  )
}

type NavButtonProps = {
  onClick: (s: any) => void
  active: string
  options: string[]
  isStaking?: boolean
  bgColor?: string
  bgColorActive?: string
}

export const NavButtons = ({ options, active, onClick, isStaking, bgColor = 'primary.850', bgColorActive = 'primary.650' }: NavButtonProps) => (
  <Flex w="full" bgColor={bgColor} p={1} borderRadius={4} cursor="pointer">
    {options.map((option: string) => (
      <Flex
        key={option}
        w="full"
        justify="center"
        p={2}
        borderRadius={4}
        fontWeight="semibold"
        fontSize="15px"
        color={option === active ? 'mainTextColor' : 'secondaryTextColor'}
        onClick={() => onClick(option)}
        bgColor={option === active ? bgColorActive : bgColor}
      >
        {isStaking ? option.replace('Supply', 'Stake').replace('Withdraw', 'Unstake') : option}
      </Flex>
    ))}
  </Flex>
)

export default LinkButton
