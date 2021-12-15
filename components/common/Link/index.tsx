import { Text, Link as ChakraLink } from '@chakra-ui/react'
import { useRouter } from 'next/dist/client/router'
import NextLink from 'next/link'

export const Link = (props: any) => {
  const router = useRouter()
  const query = router?.query
  const { href, isExternal, ...otherProps } = props

  const urlParamsToKeepWhenChangingPage = (({ demo, simAddress }) => {
    const params: any = {}
    if(demo) { params['demo'] = demo }
    if(simAddress) { params['simAddress'] = simAddress }
    return params
  })(query);

  return (
    <NextLink href={{
      pathname: href?.pathname || href,
      query: href?.query || urlParamsToKeepWhenChangingPage,
    }} passHref>
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
        <Text color="purple.100" cursor="pointer" _hover={{ color: '#fff' }} _focus={{}} {...otherProps} />
      )}
    </NextLink>
  )
}

export default Link
