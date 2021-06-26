import { Button, Flex, Link } from '@chakra-ui/react'
import NextLink from 'next/link'

export const LinkButton = ({ children, href }: { href: string; children: React.ReactNode }) => (
  <Flex
    w="full"
    justify="center"
    bgColor="purple.600"
    cursor="pointer"
    borderRadius={32}
    p={2}
    _hover={{ bgColor: 'purple.500' }}
  >
    <NextLink href={href} passHref>
      <Link color="#fff" fontSize="md" fontWeight="semibold" _hover={{}} _focus={{}}>
        {children}
      </Link>
    </NextLink>
  </Flex>
)

export const ConnectButton = (props: any) => (
  <Flex
    justify="center"
    bgColor="purple.600"
    cursor={props.onClick ? 'pointer' : ''}
    fontSize="sm"
    align="center"
    borderRadius={8}
    fontWeight="semibold"
    color="#fff"
    p={2}
    pl={4}
    pr={4}
    _hover={{ bgColor: 'purple.700' }}
    {...props}
  />
)

export const ClaimButton = (props: any) => (
  <Button
    justify="center"
    bgColor="purple.600"
    cursor={props.onClick ? 'pointer' : ''}
    fontSize="sm"
    align="center"
    borderRadius={8}
    fontWeight="semibold"
    color="#fff"
    height={8}
    pl={3}
    pr={3}
    _hover={{ bgColor: 'purple.700' }}
    {...props}
  />
)

export const OutlineButton = (props: any) => (
  <Flex
    justify="center"
    cursor={props.onClick ? 'pointer' : ''}
    fontSize="sm"
    align="center"
    borderRadius={8}
    borderWidth={1}
    borderColor="purple.700"
    fontWeight="semibold"
    color="#fff"
    p={2}
    pl={4}
    pr={4}
    _hover={{ bgColor: 'purple.900' }}
    {...props}
  />
)

export const SubmitButton = (props: any) => (
  <Button
    w="full"
    bgColor="purple.600"
    fontSize="13px"
    fontWeight="semibold"
    textTransform="uppercase"
    _focus={{}}
    _hover={{ bgColor: 'purple.700' }}
    {...props}
  />
)

type NavButtonProps = {
  onClick: (s: any) => void
  active: string
  options: string[]
}

export const NavButtons = ({ options, active, onClick }: NavButtonProps) => (
  <Flex w="full" bgColor="purple.900" p={1} borderRadius={8} cursor="pointer">
    {options.map((option: string) => (
      <Flex
        key={option}
        w="full"
        justify="center"
        p={2}
        borderRadius={8}
        fontWeight="semibold"
        fontSize="15px"
        color={option === active ? '#fff' : 'purple.100'}
        onClick={() => onClick(option)}
        bgColor={option === active ? 'purple.700' : 'purple.900'}
      >
        {option}
      </Flex>
    ))}
  </Flex>
)

export default LinkButton
