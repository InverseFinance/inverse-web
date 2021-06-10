import { Flex, Link } from '@chakra-ui/react'
import NextLink from 'next/link'

type ButtonProps = {
  href: string
  children: React.ReactNode
}

export const ButtonLink = ({ children, href }: ButtonProps) => (
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

export default ButtonLink
