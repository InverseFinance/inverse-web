import { Text, Link as ChakraLink } from '@chakra-ui/react'
import NextLink from 'next/link'

export const Link = (props: any) => {
  const { href, isExternal, ...otherProps } = props
  return (
    <NextLink href={href} passHref>
      {isExternal ? (
        <ChakraLink
          color="purple.200"
          cursor="pointer"
          _hover={{ color: '#fff' }}
          _focus={{}}
          isExternal
          {...otherProps}
        />
      ) : (
        <Text color="purple.200" cursor="pointer" _hover={{ color: '#fff' }} _focus={{}} {...otherProps} />
      )}
    </NextLink>
  )
}

export default Link
