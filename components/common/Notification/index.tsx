import { CloseIcon } from '@chakra-ui/icons';
import { Box, BoxProps, ComponentWithAs, Flex, IconProps, Text } from '@chakra-ui/react';
import { ReactNode } from 'react';

import successLottie from '@inverse/public/assets/lotties/success.json';
import loadingLottie from '@inverse/public/assets/lotties/loading.json';
import warningLottie from '@inverse/public/assets/lotties/warning.json';
import errorLottie from '@inverse/public/assets/lotties/error.json';
import infoLottie from '@inverse/public/assets/lotties/info.json';
import { CustomToastOptions } from '@inverse/types';
import { Animation } from '@inverse/components/common/Animation';

type AnimOptions = { animData: Object, loop: boolean }

interface NotifTheme {
    bg: BoxProps["bgColor"],
    borderColor: BoxProps["borderColor"],
    icon?: ComponentWithAs<"svg", IconProps>,
    animOptions?: AnimOptions,
}

const themes: {
    [key: string]: NotifTheme
} = {
    'warning': {
        bg: 'warningAlpha',
        borderColor: 'warning',
        animOptions: {
            animData: warningLottie,
            loop: false,
        },
    },
    'info': {
        bg: 'infoAlpha',
        borderColor: 'info',
        animOptions: {
            animData: infoLottie,
            loop: false,
        },
    },
    'error': {
        bg: 'errorAlpha',
        borderColor: 'error',
        animOptions: {
            animData: errorLottie,
            loop: false,
        },
    },
    'success': {
        bg: 'successAlpha',
        borderColor: 'success',
        animOptions: {
            animData: successLottie,
            loop: false,
        },
    },
    'loading': {
        bg: 'infoAlpha',
        borderColor: 'info',
        animOptions: {
            animData: loadingLottie,
            loop: true,
        },
    },
}

export const Notification = ({
    handleClose,
    title,
    description,
    status = 'info',
    isClosable = true,
    boxProps,
    icon,
    animOptions,
}: {
    handleClose?: () => void,
    title?: ReactNode,
    description?: ReactNode,
    status?: CustomToastOptions["status"],
    isClosable?: boolean,
    boxProps?: BoxProps,
    icon?: ComponentWithAs<"svg", IconProps>,
    animOptions?: AnimOptions,
}) => {
    const theme = themes[status];
    const Icon = icon || theme?.icon;
    const animationOptions = animOptions || theme?.animOptions
    const anim = animationOptions ? <Animation height={40} width={40} {...animationOptions} /> : null;

    return (
        <Box
            borderRadius="lg"
            color="white"
            p={3}
            border="1px solid"
            borderColor={theme.borderColor}
            className={`blurred-container ${status}-bg`}
            {...boxProps}
            position="relative"
        >
            {
                isClosable && handleClose ?
                    <CloseIcon onClick={handleClose} cursor="pointer" boxSize={3} style={{ position: 'absolute', top: '10px', right: '10px' }} />
                    : null
            }
            <Flex alignItems="center">
                {
                    Icon || anim ?
                        <Box alignItems="center" w="40px" h="40px" mr="2">
                            {Icon ? <Icon /> : anim}
                        </Box>
                        : null
                }
                <Box>
                    {
                        title ? <Text fontWeight="bold">{title}</Text> : null
                    }
                    {
                        description ? <Text>{description}</Text> : null
                    }
                </Box>
            </Flex>
        </Box>
    )
}