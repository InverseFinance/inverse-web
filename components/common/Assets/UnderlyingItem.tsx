import { Box, BoxProps, Image, ImageProps, Text, TextProps } from '@chakra-ui/react'
import { OLD_XINV } from '@app/config/constants'
import { NotifBadge } from '@app/components/common/NotifBadge'
import React from 'react'
import { Token } from '@app/types';

const DEFAULT_CONTAINER = React.Fragment;

export const UnderlyingItem = ({
    label,
    image,
    address,
    imgSize = 5,
    imgProps,
    imgContainerProps,
    textProps,
    badge,
    Container = DEFAULT_CONTAINER,
    containerProps,
    protocolImage,
    protocolImageSize = 3,
}: {
    label: string,
    image: string,
    address?: string,
    imgSize?: ImageProps["w"],
    imgProps?: Partial<ImageProps>,
    imgContainerProps?: Partial<BoxProps>,
    textProps?: Partial<TextProps>,
    badge?: Token["badge"],
    Container?: React.ComponentType<any>,
    containerProps?: any,
    protocolImage?: string,
    protocolImageSize?: ImageProps["w"],
}) => {
    return <Container {...containerProps}>
        <Box position="relative" {...imgContainerProps}>
            <Image ignoreFallback={true} src={image} w={imgSize} h={imgSize} {...imgProps} />
            {
                !!protocolImage && <Image borderRadius="20px" ignoreFallback={true} src={protocolImage} w={protocolImageSize} h={protocolImageSize} position="absolute" bottom="0" right="-5px" />
            }
        </Box>
        <Text {...textProps}>{label}{address === OLD_XINV ? ' (OLD)' : ''}</Text>
        {
            !!badge &&
            <NotifBadge position="absolute" right="-20px" fontSize="12px" w="fit-content" top="auto" bgColor={badge.color}>
                {badge.text}
            </NotifBadge>
        }
    </Container>
}
