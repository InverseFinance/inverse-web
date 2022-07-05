import theme from '@app/variables/theme'
import { StackProps, VStack } from '@chakra-ui/react'

export const AnchorBigButton = (props: StackProps) => {
    return <VStack
        fontWeight="bold"
        cursor="pointer"
        _hover={{ bg: "gradient2" }}
        borderRadius="5px"
        alignItems="flex-start"
        color="mainTextColor"
        bg="gradient1"
        textTransform="none"
        p="6"
        px="8"
        spacing="0"
        w="50%"
        h="100px"
        boxShadow={`0px 0px 5px 1px ${theme.colors.primaryPlus}`}
        fontSize="20px"
        {...props}
    />
}