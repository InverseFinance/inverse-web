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

export const ConnectButton = ({ onClick, children }: { onClick: any; children: React.ReactNode }) => (
  <Flex
    justify="center"
    bgColor="purple.700"
    cursor="pointer"
    fontSize="15px"
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

export default LinkButton
