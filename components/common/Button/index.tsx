import { Flex, Link, ButtonProps, FlexProps, LinkProps } from '@chakra-ui/react'
import NextLink from 'next/link'
import { getNetwork } from '@app/util/networks';
import { NetworkItem } from '@app/components/common/NetworkItem';
import { SmartButton } from './SmartButton';
import { SmartButtonProps } from '@app/types';
import { gaEvent } from '@app/util/analytics';
import { useAppThemeParams } from '@app/hooks/useAppTheme';

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
} & LinkProps) => {
  const { OUTLINE_BUTTON_BG, OUTLINE_BUTTON_BORDER_COLOR, BUTTON_BG, BUTTON_BORDER_COLOR, OUTLINE_BUTTON_TEXT_COLOR, BUTTON_TEXT_COLOR } = useAppThemeParams();
  const extraFlexProps = isOutline ?
    { bg: OUTLINE_BUTTON_BG, borderColor: OUTLINE_BUTTON_BORDER_COLOR }
    :
    { bg: BUTTON_BG, borderColor: BUTTON_BORDER_COLOR }

  const finalFlexProps = { ...extraFlexProps, ...flexProps };

  const handleGa = (e) => {
    const btnAction = e?.target?.getAttribute('data-ga-event') || e?.target?.innerText || '';
    if (btnAction) {
      gaEvent({ action: btnAction })
    }
  }

  return (
    <NextLink href={href} passHref legacyBehavior>
      <Link onClick={handleGa} w="full" color={isOutline ? OUTLINE_BUTTON_TEXT_COLOR : BUTTON_TEXT_COLOR} fontSize="md" fontWeight="semibold" _hover={{}} target={target} _focus={{}} {...props} >
        <Flex
          justify="center"
          cursor="pointer"
          borderRadius={4}
          borderWidth={1}
          alignItems="center"
          p={2}
          _hover={{ filter: 'brightness(1.25)', transition: 'all 250ms' }}
          {...finalFlexProps}
        >
          {children}
        </Flex>
      </Link>
    </NextLink>
  );
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
} & LinkProps) => (
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

export const SubmitButton = (props: SmartButtonProps) => {
  const { BUTTON_BG_COLOR, BUTTON_TEXT_COLOR, BUTTON_BG, BUTTON_BOX_SHADOW, BUTTON_BORDER_COLOR } = useAppThemeParams();
  return (
    <SmartButton
      w="full"
      bg={BUTTON_BG}
      bgColor={!props?.colorScheme ? BUTTON_BG_COLOR : undefined}
      borderColor={BUTTON_BORDER_COLOR}
      fontSize="13px"
      fontWeight="semibold"
      textTransform="uppercase"
      color={BUTTON_TEXT_COLOR}
      boxShadow={BUTTON_BOX_SHADOW}
      _active={{ filter: 'brightness(1.3)' } }
      _focus={{}}
      _hover={!props?.colorScheme ? { filter: 'brightness(1.4)' } : undefined}
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
  textProps?: FlexProps
} & Partial<FlexProps>

export const NavButtons = ({ options, textProps, active, onClick, isStaking, bgColor = 'primary.800', bgColorActive = 'primary.650', ...props }: NavButtonProps) => (
  <Flex w="full" bgColor={bgColor} p={1} borderRadius={4} cursor="pointer" borderWidth="1px"  borderColor="primary.650" {...props}>
    {options.map((option: string) => (
      <Flex
        key={option}
        w="full"
        justify="center"
        p={2}
        borderRadius={4}
        fontWeight="semibold"
        fontSize="15px"
        alignItems="center"
        color={option === active ? 'mainTextColor' : 'secondaryTextColor'}
        onClick={() => onClick(option)}
        bgColor={option === active ? bgColorActive : bgColor}
        {...textProps}
      >
        {isStaking ? option.replace(/supply|deposit/i, 'Stake').replace(/withdraw/i, 'Unstake') : option}
      </Flex>
    ))}
  </Flex>
)

export default LinkButton
