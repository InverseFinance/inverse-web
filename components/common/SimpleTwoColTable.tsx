import { Text, HStack, VStack, TextProps, StackProps } from "@chakra-ui/react"
import Container, { AppContainerProps } from "./Container"

export const SimpleTwoColTable = ({
    items,
    containerProps,
    vstackProps,
    labelProps,
    valueProps,
}: {
    items: { label: string, value: string, labelProps?: TextProps, valueProps?: TextProps }[],
    containerProps?: AppContainerProps,
    vstackProps?: StackProps,
    labelProps?: TextProps, 
    valueProps?: TextProps
}) => {
    return <Container noPadding p="0" {...containerProps}>
        <VStack alignItems="flex-start" minW='300px' w='full' {...vstackProps}>
            {
                items.map(item => {
                    const lprops = { ...labelProps, ...item.labelProps };
                    const vprops = { ...valueProps, ...item.valueProps };
                    return <HStack key={item.label} justify="space-between" w='full'>
                        <Text {...lprops}>{item.label}:</Text>
                        <Text {...vprops}>{item.value}</Text>
                    </HStack>
                })
            }            
        </VStack>
    </Container>
}