import { Image, Text } from '@chakra-ui/react'
import { OLD_XINV } from '@inverse/config/constants'

export const UnderlyingItem = ({
    label,
    image,
    address,
    imgSize = 5,
}: {
    label: string,
    image: string,
    address?: string,
    imgSize?: number,
}) => {
    return <>
        <Image src={image} w={imgSize} h={imgSize} />
        <Text>{label}{address === OLD_XINV ? ' (OLD)' : ''}</Text>
    </>
}
