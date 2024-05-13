import { StackProps, TextProps, VStack, Text } from "@chakra-ui/react"
import { lightTheme } from '@app/variables/theme'

export const SplashedText = ({
    containerProps,
    splash = 'horizontal-lr',
    splashProps,
    splashColor,
    ...props
}: {
    containerProps?: StackProps
    splash?: string
    splashColor?: string
    splashProps?: StackProps
} & TextProps) => {

    const splashSrc = `/assets/v2/splashs/${splash}.svg`;

    return <VStack position="relative" {...containerProps}>
        <Text position="relative" zIndex="1" {...props} />
        <VStack
            w="200px"
            h="40px"
            top="20px"
            left="-25px"
            bgColor={splashColor||lightTheme.colors.success}
            mask={`url(${splashSrc}) no-repeat center / cover`}
            sx={{
                '-webkit-mask': `url(${splashSrc}) no-repeat 0 0/100% 100%`
            }}            
            position="absolute"
            zIndex="0"
            {...splashProps}
            >            
        </VStack>
    </VStack>
}