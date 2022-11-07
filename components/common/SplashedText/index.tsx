import { Image, StackProps, TextProps, VStack, Text } from "@chakra-ui/react"

export const SplashedText = ({
    containerProps,
    splash = 'horizontal-lr',
    splashProps,
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
            bgColor={'success'}
            mask={`url(${splashSrc}) no-repeat center / contain`}
            sx={{
                '-webkit-mask': `url(${splashSrc}) no-repeat center / contain`
            }}            
            position="absolute"
            zIndex="0"
            {...splashProps}
            >            
        </VStack>
    </VStack>
}