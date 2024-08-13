import { Box, HStack, VStack, Text } from "@chakra-ui/react"

export const Step = ({
    num, text
}: {
    num: number,
    text: any,
}) => {
    return <HStack spacing="4" justify="flex-start" position="relative">
        <VStack borderRadius="50px" w='35px' h='35px' bgColor='infoAlpha' alignItems="center" justify="center">
            <Text>{num}</Text>
        </VStack>
        <Box>{text}</Box>
        {
            num !== 1 && <Box top="-20px" left="16px" bgColor="infoAlpha" h="15px" w="2px" position="absolute">

            </Box>
        }
    </HStack>
}

export const Steps = ({
    steps,
    ...props
}: {
    steps: { num: number, text: any }[]
}) => {    
    return <VStack alignItems="flex-start" spacing="6" py="2" {...props}>
        {
            steps.map((step, i) => {
                return <Step key={i} num={step.num||(i+1)} text={step.text} />
            })
        }
    </VStack>
}