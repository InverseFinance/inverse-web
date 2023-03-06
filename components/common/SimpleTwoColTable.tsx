import { Text, HStack, VStack, TextProps, StackProps } from "@chakra-ui/react"
import Container, { AppContainerProps } from "./Container"

export const SimpleTwoColTable = ({
    items,
    containerProps,
    vstackProps,
}: {
    items: { label: string, value: string, labelProps?: TextProps, valueProps?: TextProps }[],
    containerProps?: AppContainerProps,
    vstackProps?: StackProps,
}) => {
    return <Container noPadding p="0" {...containerProps}>
        <VStack alignItems="flex-start" w='300px' {...vstackProps}>
            {
                items.map(item => {
                    return <HStack justify="space-between" w='full'>
                        <Text {...item.labelProps}>{item.label}:</Text>
                        <Text {...item.valueProps}>{item.value}</Text>
                    </HStack>
                })
            }            
        </VStack>
    </Container>
}