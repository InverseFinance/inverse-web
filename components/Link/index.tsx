import { Text } from '@chakra-ui/react'
import NextLink from 'next/link'

export const Link = (props: any) => {
  const { href, ...otherProps } = props
  return (
    <NextLink href={href} passHref>
      <Text color="#fff" cursor="pointer" _hover={{ color: 'purple.200' }} _focus={{}} {...otherProps} />
    </NextLink>
  )
}

export default Link
