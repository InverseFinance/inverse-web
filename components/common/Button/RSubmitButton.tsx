
import { Link, ButtonProps } from '@chakra-ui/react'
import NextLink from 'next/link'
import { SubmitButton } from "."
import { lightTheme } from '@app/variables/theme'

type Props = ButtonProps & { href?: string, target?: string }

export const RSubmitButton = (props: Props) => {
    const _props = { borderLeftRadius: '50px', borderRightRadius: '50px' ,...props }
    if(_props?.href) {
        const { target, w, width, ...btnProps } = _props;
        return <NextLink href={_props.href} passHref>
            <Link w={w} width={width} target={target} textDecoration="none" _hover={{ textDecoration: 'none' }}>
                <SubmitButton {...btnProps} />
            </Link>
        </NextLink>
    }
    return <SubmitButton {..._props} />
}

export const LandingSubmitButton = (props: Props) => {
    return <RSubmitButton boxShadow="none" textTransform="inherit" px="40px" {...props} />
}

export const LandingOutlineButton = (props: Props) => {
    return <LandingSubmitButton color={lightTheme.colors.mainTextColor} border={`1px solid ${lightTheme.colors.mainTextColor}`} bgColor="white" {...props} />
}