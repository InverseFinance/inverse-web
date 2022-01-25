import { Image, ImageProps, Text } from '@chakra-ui/react'
import { OLD_XINV } from '@app/config/constants'

export const UnderlyingItem = ({
    label,
    image,
    address,
    imgSize = 5,
    imgProps,
    textProps,
}: {
    label: string,
    image: string,
    address?: string,
    imgSize?: ImageProps["w"],
    imgProps?: Partial<ImageProps>,
    textProps?: Partial<TextProps>,
}) => {
    return <>
        <Image src={image} w={imgSize} h={imgSize} {...imgProps} />
        <Text {...textProps}>{label}{address === OLD_XINV ? ' (OLD)' : ''}</Text>
    </>
}
