import { Box, Image, ImageProps, Text, TextProps } from '@chakra-ui/react'
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
    textProps?: Partial<TextProps>,
    badge?: Token["badge"],
    Container?: React.ComponentType<any>,
    containerProps?: any,
    protocolImage?: string,
    protocolImageSize?: ImageProps["w"],
}) => {
    return <Container {...containerProps}>
        <Box position="relative">
            <Image ignoreFallback={true} src={image} w={imgSize} h={imgSize} {...imgProps} />
            {
                !!protocolImage && <Image ignoreFallback={true} src={protocolImage} w={protocolImageSize} h={protocolImageSize} position="absolute" bottom="0" right="-5px" />
            }
        </Box>
        <Text {...textProps}>{label}{address === OLD_XINV ? ' (OLD)' : ''}</Text>
        {
            !!badge &&
            <NotifBadge position="absolute" right="0" fontSize="12px" w="fit-content" top="auto" bgColor={badge.color}>
                {badge.text}
            </NotifBadge>
        }
    </Container>
}
