import { HStack, Text, VStack } from '@chakra-ui/react'
import { GasIcon } from '@app/components/common/Icons'
import { AnimatedInfoTooltip } from '@app/components/common/Tooltip'

const cheap = parseFloat(process.env.NEXT_PUBLIC_GAS_CHEAP || '50');
const expensive = parseFloat(process.env.NEXT_PUBLIC_GAS_EXPENSIVE || '150');

export const GasInfo = ({ value }: { value: number }) => {
    const color =  value <= cheap ? 'success' : value >= expensive ? 'error' : 'warning'
    return (
        <AnimatedInfoTooltip message={
            <VStack spacing="0">
                <Text>{value} Gwei</Text>
            </VStack>
        }>
            <HStack spacing="1">
            <GasIcon h="10px" w="10px" color={color}  />
            <Text color={color}>
                {value}
            </Text>
        </HStack>
        </AnimatedInfoTooltip>
    )
}