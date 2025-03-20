import { Flex, FlexProps, Image, ImageProps } from '@chakra-ui/react'

export const MarketImage = ({
    size = 15,
    image,
    protocolImage,
    isInPausedSection,
    imgProps,
    ...rest
}: {
    size: number
    image: string
    protocolImage?: string
    isInPausedSection?: boolean
    imgProps?: Partial<ImageProps>
} & Partial<FlexProps>) => {
    return <Flex
        filter={isInPausedSection ? 'grayscale(1)' : undefined}
        opacity={isInPausedSection ? 0.5 : undefined}
        position="relative"
        alignItems="center"
        {...rest}
    >
        <Image width={`${size}px`} height={`${size}px`} src={image} ignoreFallback={true} {...imgProps} />
        {
            !!protocolImage && <Image
                borderRadius="20px"
                width={`${size/1.75}px`}
                height={`${size/1.75}px`}
                position="absolute"
                bottom="0"
                right={`-${size/4}px`}
                src={protocolImage}
                ignoreFallback={true}
            />
        }
    </Flex>
}