import { HStack, Text } from "@chakra-ui/react"

export const StepsBar = ({
    step,
    steps,    
    onStepChange,
}: {
    step: number,
    steps: string[],    
    onStepChange: (v: number) => void,
}) => {
    const _step = step - 1;    
    return <HStack w='full'>
        {steps.map((name, i) => {
            const isActive = _step === i;
            const isEnabled = i < _step;
            return <HStack key={name}>
                <Text
                    fontSize={{ base: '14px', md: '20px' }}
                    onClick={ isEnabled && !isActive ? () => onStepChange(i+1) : undefined }
                    cursor={ isEnabled && !isActive ? 'pointer' : 'default' }
                    fontWeight={isActive ? '1000' : '600'}
                    color={isActive ? 'accentTextColor' : 'mainTextColor'}
                    opacity={i < step ? 1 : 0.5}                    
                >
                    {name}
                </Text>
                {
                    i >= 0 && i < (steps.length - 1) &&
                    <Text opacity={i < (step - 1) ? 1 : 0.5} px="1">></Text>
                }
            </HStack>
        })}
    </HStack>
}