import { Flex, Link, ButtonProps, FlexProps } from '@chakra-ui/react'
import NextLink from 'next/link'
import { getNetwork } from '@app/util/networks';
import { NetworkItem } from '@app/components/common/NetworkItem';
import { SmartButton } from './SmartButton';
import { SmartButtonProps } from '@app/types';

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
  const extraFlexProps = isOutline ? { bgColor: 'purple.850', borderColor: 'purple.600'  } : { bgColor: 'purple.500', borderColor: 'purple.500' }
  const finalFlexProps = { ...extraFlexProps, ...flexProps };
  return (
    <NextLink href={href} passHref>
      <Link w="full" color="#fff" fontSize="md" fontWeight="semibold" _hover={{}} target={target} _focus={{}} {...props} >
        <Flex
          justify="center"
          cursor="pointer"
          borderRadius={4}
          borderWidth={1}
          p={2}
          _hover={{ bgColor: 'purple.600', borderColor: 'purple.600', transition: 'all 250ms' }}
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
    bgColor="purple.500"
    cursor={props.onClick ? 'pointer' : ''}
    fontSize="sm"
    borderRadius={8}
    fontWeight="semibold"
    color="#fff"
    height={8}
    pl={3}
    pr={3}
    _hover={{ bgColor: 'purple.600' }}
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
      bgColor={network.bgColor || 'purple.500'}
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
    bgColor="purple.800"
    borderRadius={4}
    borderWidth={1}
    borderColor="purple.700"
    fontWeight="semibold"
    color="#fff"
    p={2}
    pl={4}
    pr={4}
    _hover={{ bgColor: 'purple.850' }}
    {...props}
  />
)

export const SubmitButton = (props: SmartButtonProps) => {
  return (
    <SmartButton
      w="full"
      bgColor={ !props?.colorScheme ? 'purple.600' : undefined }
      fontSize="13px"
      fontWeight="semibold"
      textTransform="uppercase"
      _focus={{}}
      _hover={ !props?.colorScheme ? { bgColor: 'purple.700' } : undefined }
      {...props}
    />
  )
}

type NavButtonProps = {
  onClick: (s: any) => void
  active: string
  options: string[]
}

export const NavButtons = ({ options, active, onClick }: NavButtonProps) => (
  <Flex w="full" bgColor="purple.850" p={1} borderRadius={4} cursor="pointer">
    {options.map((option: string) => (
      <Flex
        key={option}
        w="full"
        justify="center"
        p={2}
        borderRadius={4}
        fontWeight="semibold"
        fontSize="15px"
        color={option === active ? '#fff' : 'purple.200'}
        onClick={() => onClick(option)}
        bgColor={option === active ? 'purple.650' : 'purple.850'}
      >
        {option}
      </Flex>
    ))}
  </Flex>
)

export default LinkButton
