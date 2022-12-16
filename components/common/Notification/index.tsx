import { CloseIcon } from '@chakra-ui/icons';
import { Box, BoxProps, ComponentWithAs, Flex, IconProps, Text } from '@chakra-ui/react';
import { ReactNode } from 'react';

import successLottie from '@app/public/assets/lotties/success.json';
import loadingLottie from '@app/public/assets/lotties/loading.json';
import warningLottie from '@app/public/assets/lotties/warning.json';
import errorLottie from '@app/public/assets/lotties/error.json';
import infoLottie from '@app/public/assets/lotties/info.json';
import { CustomToastOptions } from '@app/types';
import { Animation } from '@app/components/common/Animation';
import { useAppTheme } from '@app/hooks/useAppTheme';

type AnimOptions = { animData: Object, loop: boolean }

interface NotifMode {
    bg: BoxProps["bgColor"],
    borderColor: BoxProps["borderColor"],
    icon?: ComponentWithAs<"svg", IconProps>,
    animOptions?: AnimOptions,
}

const modes: {
    [key: string]: NotifMode
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
    const { themeStyles } = useAppTheme();
    const mode = modes[status];
    const Icon = icon || mode?.icon;
    const animationOptions = animOptions || mode?.animOptions
    const anim = animationOptions ? <Animation height={40} width={40} {...animationOptions} /> : null;

    return (
        <Box
            borderRadius="lg"
            color={themeStyles.colors.mainTextColor}
            p={3}
            border="1px solid"
            borderColor={mode.borderColor}
            className={`blurred-container ${status}-bg`}
            {...boxProps}
            position="relative"
            maxWidth={{ base: '300px', sm: '400px', md: '600px' }}
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