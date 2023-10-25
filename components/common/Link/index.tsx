import { Text, Link as ChakraLink } from '@chakra-ui/react'
import { useRouter } from 'next/dist/client/router'
import NextLink from 'next/link'

export const Link = (props: any) => {
  const router = useRouter()
  const query = router?.query
  const { href, isExternal, ...otherProps } = props

  const urlParamsToKeepWhenChangingPage = ((q) => {
    if (!q) { return {} }
    const { viewAddress } = q;
    const params: any = {}
    if (viewAddress) { params['viewAddress'] = viewAddress }
    return params
  })(query);
  return null
  return (
    <NextLink
      href={typeof href === 'string' && (href.includes('#') || href.includes('?') || isExternal) ? href : {
        pathname: href?.pathname || href,
        query: href?.query || urlParamsToKeepWhenChangingPage,
      }}
      passHref
      legacyBehavior={true}>
      {isExternal ? (
        <ChakraLink
          color="secondaryTextColor"
          cursor="pointer"
          _hover={{ color: 'mainTextColor' }}
          _focus={{}}
          isExternal
          {...otherProps}
        />
      ) : (
        <Text color="lightAccentTextColor" cursor="pointer" _hover={{ color: 'mainTextColor', filter: 'brightness(1.4)' }} _focus={{}} {...otherProps} />
      )}
    </NextLink>
  );
}

export default Link
