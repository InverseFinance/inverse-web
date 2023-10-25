
import { Link, LinkProps } from '@chakra-ui/react'
import NextLink from 'next/link'
import { SubmitButton } from "."
import { lightTheme } from '@app/variables/theme'
import { smallerSize2 } from '@app/variables/responsive'
import { useAppTheme } from '@app/hooks/useAppTheme'
import { SmartButtonProps } from '@app/types'

type Props = SmartButtonProps & { href?: string, target?: string, linkProps?: LinkProps }

export const RSubmitButton = (props: Props) => {
    const _props = { borderLeftRadius: { base: '30px', '2xl': '50vmax' }, borderRightRadius: { base: '30px', '2xl': '50vmax' }, ...props }
    if (_props?.href) {
        const { target, linkProps, ...btnProps } = _props;
        return <NextLink href={_props.href} passHref legacyBehavior>
            <Link target={target} textDecoration="none" _hover={{ textDecoration: 'none' }} {...linkProps}>
                <SubmitButton textTransform="inherit" w='full' {...btnProps} />
            </Link>
        </NextLink>
    }
    return <SubmitButton textTransform="inherit" {..._props} />
}

export const ROutlineButton = (props: Props) => {
    const { themeStyles } = useAppTheme();
    return <RSubmitButton color="mainTextColor" outline={`1px solid ${themeStyles.colors.mainTextColor}`} bgColor={'transparent'} {...props} />
}

export const LandingSubmitButton = (props: Props) => {
    const px = !props?.px ? { base: '5', sm: '44px', '2xl': '50px', '3xl': '54px', '4xl': '58px' } : props.px;
    const py = !props?.py ? { base: '4', sm: '22px', '2xl': '28px', '3xl': '32px', '4xl': '36px' } : props.py;
    return <RSubmitButton
        boxShadow="none"
        textTransform="inherit"
        w={{ base: 'full', sm: 'auto' }}
        px={px}
        py={py}
        // h='50px'
        fontWeight="600"
        bgColor={lightTheme.colors.mainTextColor}
        fontSize={smallerSize2}
        {...props} />
}

export const LandingOutlineButton = (props: Props) => {
    return <LandingSubmitButton color={lightTheme.colors.mainTextColor} outline={`2px solid ${lightTheme.colors.mainTextColor}`} bgColor="white" {...props} />
}