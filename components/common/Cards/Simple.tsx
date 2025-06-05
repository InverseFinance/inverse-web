import { StackProps, Stack } from "@chakra-ui/react"

export const SimpleCard = (props: StackProps) => {
    return <Stack direction="column" bgColor="white" p="8" alignItems="flex-start" boxShadow="0 4px 5px 5px #33333322" {...props} />
}