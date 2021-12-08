import { Text, Flex } from '@chakra-ui/react';
import { AnimatedInfoTooltip } from '@inverse/components/common/Tooltip';
import { SlippageRadioGroup } from '@inverse/components/common/Input/SlippageRadioGroup';
import { Token } from '@inverse/types';

export const SwapSlippage = ({
    maxSlippage,
    toToken,
    toAmount,
    onChange,
}: {
    maxSlippage: number,
    toToken: Token,
    toAmount: string,
    onChange: (v: string) => void,
}) => {
    const minReceived = toAmount === '' ? '0' : (parseFloat(toAmount) - (parseFloat(toAmount) * maxSlippage / 100)).toFixed(4)
    const color = 'whiteAlpha.800'

    return (
        <Flex alignItems="center" direction={{ base: 'column', sm: 'row' }} color={color} w='full'>
            <Text color={color} display="flex" alignItems="center" justifyContent={{ base: 'center', sm: 'right' }} w="full" fontSize="12px" mr="2">
                <AnimatedInfoTooltip size="intermediary" message="The maximum slippage accepted for the swap, if the slippage exceeds the maximum chosen the transaction will fail." />
                Max. slippage :
            </Text>
            <SlippageRadioGroup defaultValue={maxSlippage.toString()} onChange={onChange} />
            <Text color={color} display="flex" alignItems="center" justifyContent={{ base: 'center', sm: 'left' }} w="full" fontSize="12px" ml="2">
                <AnimatedInfoTooltip size="intermediary" message={`The minimum amount of ${toToken.symbol} that will receive`} />
                Min. received&nbsp;:&nbsp;<b>{minReceived}</b>
            </Text>
        </Flex>
    )
}