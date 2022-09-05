import { Text, VStack } from '@chakra-ui/react';
import { AnimatedInfoTooltip } from '@app/components/common/Tooltip';
import { SlippageRadioGroup } from '@app/components/common/Input/SlippageRadioGroup';
import { Token } from '@app/types';
import { commify } from 'ethers/lib/utils';

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
        <VStack direction="column" color={color} w='full' spacing="2">
            <Text color={color} textAlign={{ base: 'center', sm: 'right' }} display="block" alignItems="center" justifyContent={{ base: 'center', sm: 'right' }} w="full" fontSize="12px">
                <AnimatedInfoTooltip size="intermediary" message="The maximum slippage accepted for the swap, if the slippage exceeds the maximum chosen the transaction will fail." />
                Max. slippage :
            </Text>
            <SlippageRadioGroup defaultValue={maxSlippage.toString()} onChange={onChange} />
            <Text color={color} display="flex" alignItems="center" justifyContent={{ base: 'center', sm: 'right' }} w="full" fontSize="12px" ml="2">
                <AnimatedInfoTooltip size="intermediary" message={`The minimum amount of ${toToken?.symbol} that you will receive`} />
                Min. received&nbsp;:&nbsp;<b>{commify(minReceived)}</b>
            </Text>
        </VStack>
    )
}