import { Flex, Link } from '@chakra-ui/react'
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

export const ConnectButton = ({ onClick, children }: { onClick?: any; children: React.ReactNode }) => (
  <Flex
    justify="center"
    bgColor="purple.700"
    cursor={onClick ? 'pointer' : ''}
    fontSize="sm"
    align="center"
    borderRadius={8}
    fontWeight="semibold"
    p={2}
    pl={4}
    pr={4}
    onClick={onClick}
    _hover={{ bgColor: 'purple.600' }}
  >
    {children}
  </Flex>
)

export const OutlineButton = ({ onClick, children }: { onClick?: any; children: React.ReactNode }) => (
  <Flex
    justify="center"
    cursor={onClick ? 'pointer' : ''}
    fontSize="sm"
    align="center"
    borderRadius={8}
    borderWidth={1}
    borderColor="purple.700"
    fontWeight="semibold"
    p={2}
    pl={4}
    pr={4}
    onClick={onClick}
    _hover={{ bgColor: 'purple.900' }}
  >
    {children}
  </Flex>
)

export default LinkButton
