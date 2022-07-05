import theme from '@app/variables/theme'
import { StackProps, VStack } from '@chakra-ui/react'

export const AnchorBigButton = (props: StackProps) => {
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
        bg="gradient1"
        textTransform="none"
        p="6"
        px="8"
        spacing="0"
        w="50%"
        h="150px"
        fontSize="30px"
        {...props}
    />
}