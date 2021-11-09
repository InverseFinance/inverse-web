import { CheckCircleIcon, WarningTwoIcon, InfoIcon, WarningIcon } from '@chakra-ui/icons';
import { Box, BoxProps, Flex, Text, UseToastOptions } from '@chakra-ui/react';
import { ReactNode } from 'react';

const themes: {
    [key: string]: { bg: BoxProps["bgColor"], icon: any }
} = {
    'warning': {
        bg: 'orange.400',
        icon: WarningTwoIcon
    },
    'info': {
        bg: 'blue.400',
        icon: InfoIcon
    },
    'error': {
        bg: 'red.400',
        icon: WarningIcon,
    },
    'success': {
        bg: 'green.400',
        icon: CheckCircleIcon,
    },
}

export const Notification = ({
    title,
    description,
    status = 'info',
    boxProps,
}: {
    title?: ReactNode,
    description?: ReactNode,
    status?: UseToastOptions["status"] | 'pending',
    boxProps?: BoxProps,
}) => {
    const Icon = themes[status].icon;

    return (
        <Box borderRadius="lg" color="white" p={3} bg={themes[status].bg} {...boxProps}>
            {
                title ?
                    <Text fontWeight="bold">
                        <Flex alignItems="center">
                            <Icon mr="2" />
                            {title}
                        </Flex>
                    </Text>
                    : null
            }
            {
                description ? <Text>{description}</Text> : null
            }
        </Box>
    )
}