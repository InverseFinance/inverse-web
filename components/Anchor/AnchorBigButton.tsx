import theme from '@app/variables/theme'
import { Box, StackProps, Text, VStack } from '@chakra-ui/react'
import { chakra } from '@chakra-ui/system'

export const AnchorBigButton = ({
    title,
    subtitle,
    bg,
    onClick
}: {
    title: string
    subtitle: string
    bg: StackProps["bg"]
    onClick: () => void
}) => {
    return <VStack
        fontWeight="bold"
        cursor="pointer"
        transitionProperty="transform"
        transitionDuration="500ms"
        _hover={{ transform: 'scale(1.05)' }}
        borderRadius="5px"
        alignItems="flex-start"
        justify="center"
        color="mainTextColor"
        textShadow={`2px 2px ${theme.colors.darkPrimary}`}    
        textTransform="none"
        spacing="0"
        h="150px"
        fontSize="30px"
        w={{ base: 'full', lg: '50%' }}
        position="relative"
        p="0"
        px="0"
        bg={bg}
        backgroundPosition="center"
        backgroundSize="cover"
        onClick={onClick}       
    >
        <Box zIndex="2" position="relative" w="full" py="2" px="6">
            <chakra.span zIndex="2" fontWeight="extrabold">
                {title}
            </chakra.span>
            <Text zIndex="2" fontSize="18px" color="secondary" textShadow="1px 1px #333" >
                {subtitle}
            </Text>
        </Box>
        <Box zIndex="1" position="absolute" top="-1px" bottom="-1px" left="-1px" right="-1px" maring="auto" background="verticalGradient" />
    </VStack>
}