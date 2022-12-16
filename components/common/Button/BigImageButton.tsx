import { useAppTheme } from '@app/hooks/useAppTheme'
import { Box, StackProps, Text, VStack } from '@chakra-ui/react'
import { chakra } from '@chakra-ui/system'

export const BigImageButton = ({
    title,
    subtitle,
    bg,
    onClick,
    isActive = true,
    fadingGradient = '',
    ...props
}: {
    title?: string
    subtitle?: string
    bg: StackProps["bg"]
    onClick?: () => void
    fadingGradient?: string
    isActive?: boolean
}) => {
    const { themeStyles } = useAppTheme();
    return <VStack
        fontWeight="bold"
        cursor={!onClick ? undefined : isActive ? 'pointer' : 'not-allowed'}
        transitionProperty="transform"
        transitionDuration="500ms"
        filter={isActive ? undefined : 'grayscale(1)'}
        _hover={!onClick ? undefined : { transform: isActive ? 'scale(1.05)' : undefined }}
        borderRadius="5px"
        alignItems="flex-start"
        justify="center"
        color="mainTextColor"
        textShadow={`2px 2px ${themeStyles.colors.darkPrimary}`}
        textTransform="none"
        spacing="0"
        h="100px"
        w='200px'
        fontSize="20px"
        position="relative"
        p="0"
        px="0"
        bg={bg}
        backgroundPosition="center"
        backgroundSize="cover"
        onClick={onClick}
        {...props}
    >
        {
            !!fadingGradient && <Box zIndex="1" position="absolute" top="-1px" bottom="-1px" left="-1px" right="-1px" margin="auto"
                background={fadingGradient} />
        }
        <Box zIndex="2" position="relative" w="full" py="2" px="2">
            <chakra.span color="white" zIndex="2" fontWeight="extrabold">
                {title}
            </chakra.span>
            <Text zIndex="2" fontSize="14px" color="accentTextColor" textShadow="1px 1px #333" >
                {subtitle}
            </Text>
        </Box>
    </VStack>
}