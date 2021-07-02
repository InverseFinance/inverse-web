import { Text, Link as ChakraLink } from '@chakra-ui/react'
import NextLink from 'next/link'

export const Link = (props: any) => {
  const { href, isExternal, ...otherProps } = props
  return (
    <NextLink href={href} passHref>
      {isExternal ? (
        <ChakraLink
          color="#fff"
          cursor="pointer"
          _hover={{ color: 'purple.200' }}
          _focus={{}}
          isExternal
          {...otherProps}
        />
      ) : (
        <Text color="#fff" cursor="pointer" _hover={{ color: 'purple.200' }} _focus={{}} {...otherProps} />
      )}
    </NextLink>
  )
}

export default Link
