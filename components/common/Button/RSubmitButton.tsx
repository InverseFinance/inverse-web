
import { Link, ButtonProps } from '@chakra-ui/react'
import NextLink from 'next/link'
import { SubmitButton } from "."
import { lightTheme } from '@app/variables/theme'

type Props = ButtonProps & { href?: string, target?: string }

export const RSubmitButton = (props: Props) => {
    const _props = { borderLeftRadius: '50vmax', borderRightRadius: '50vmax', ...props }
    if (_props?.href) {
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
    const px = !props?.px ? { base: '2', sm: '40px', '2xl': '3vw' } : props.px;
    const py = !props?.py ? { base: '2', sm: '30px', '2xl': '2.5vh' } : props.py;
    return <RSubmitButton
        boxShadow="none"
        textTransform="inherit"
        w={{ base: 'full', sm: 'auto' }}
        px={px}
        py={py}
        h='50px'
        fontSize={{ base: '18px', '2xl': '0.9vw' }}
        {...props} />
}

export const LandingOutlineButton = (props: Props) => {
    return <LandingSubmitButton color={lightTheme.colors.mainTextColor} border={`1px solid ${lightTheme.colors.mainTextColor}`} bgColor="white" {...props} />
}