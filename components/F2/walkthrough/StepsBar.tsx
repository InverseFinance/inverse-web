import { HStack, Text } from "@chakra-ui/react"

const STEPS = ['1 Deposit', '2 Duration', '3 Borrow', '4 Recap'];

export const StepsBar = ({
    step,
    onStepChange,
}: {
    step: number,
    onStepChange: (v: number) => void,
}) => {
    const _step = step - 1;
    return <HStack w='full'>
        {STEPS.map((name, i) => {
            const isActive = _step === i;
            const isEnabled = i < _step;
            return <HStack>
                <Text
                    fontSize="18px"
                    onClick={ isEnabled && !isActive ? () => onStepChange(step-1) : undefined }
                    cursor={ isEnabled && !isActive ? 'pointer' : 'default' }
                    fontWeight={isActive ? '1000' : '600'}
                    color={isActive ? 'accentTextColor' : 'mainTextColor'}
                    opacity={i < step ? 1 : 0.5}                    
                >
                    {name}
                </Text>
                {
                    i >= 0 && i < (STEPS.length - 1) &&
                    <Text opacity={i < (step - 1) ? 1 : 0.5} px="1">></Text>
                }
            </HStack>
        })}
    </HStack>
}