import { StackProps, VStack } from "@chakra-ui/react"

export const SimpleCard = (props: StackProps) => {
    return <VStack bgColor="white" p="8" alingItems="flex-start" boxShadow="0 4px 5px 5px #33333322" {...props} />
}