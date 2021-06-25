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

export const ToggleButton = ({ onClick, active, options }: any) => (
  <Flex w="full" cursor="pointer" justify="center" align="center" m={4}>
    {options.map((option: any) => (
      <Flex
        key={option}
        justify="center"
        cursor="pointer"
        align="center"
        borderWidth={1}
        borderColor="purple.700"
        fontWeight="semibold"
        color="#fff"
        bgColor={active === option ? 'purple.600' : 'purple.800'}
        p={2}
        pl={6}
        pr={6}
        onClick={() => onClick(option)}
      >
        {option}
      </Flex>
    ))}
  </Flex>
)

export const NavButtons = ({ width, options, active, onClick }: any) => (
  <Flex bgColor="purple.900" p={1} borderRadius={8} cursor="pointer">
    {options.map((option: string) => (
      <Flex
        key={option}
        w={width}
        justify="center"
        pt={1}
        pb={1}
        borderRadius={8}
        fontWeight="semibold"
        fontSize="sm"
        color="purple.100"
        onClick={() => onClick(option)}
        bgColor={option === active ? 'purple.700' : 'purple.900'}
      >
        {option}
      </Flex>
    ))}
  </Flex>
)

export default LinkButton
