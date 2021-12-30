import { Box, Text, Switch } from '@chakra-ui/react'

export const ProposalFloatingPreviewBtn = ({ onChange, isEnabled }: { onChange: () => void, isEnabled: boolean }) => {
    return (
        <Box
            onClick={onChange}
            boxShadow="1px 2px 2px 2px #4299e199"
            position="fixed"
            left="15px"
            top="180px"
            p="4"
            zIndex="1"
            borderRadius="60px"
            width="70px"
            height="70px"
            bgColor="info"
            cursor="pointer"
            transitionDuration="400ms"
            transitionTimingFunction="ease"
            transitionProperty="background-color"
            _hover={{ bgColor: 'blue.700' }}
            >
            <Text fontSize="10px">
                Preview
            </Text>
            <Switch value="true" isChecked={isEnabled} size="sm" color="info" />
        </Box>
    )
}