import { VStack, Text, HStack, Divider } from '@chakra-ui/react'
import { shortenNumber } from '@app/util/markets'
import { useDBRPrice } from '@app/hooks/useDBR'
import { useState } from 'react'
import { F2DurationSliderInput } from './F2DurationSlider'
import { preciseCommify } from '@app/util/misc'
import { InfoMessage } from '@app/components/common/Messages'

export const F2RechargeDBRForm = ({
    dailyDebtAccrual
}: {
    dailyDebtAccrual: number
}) => {
    const [duration, setDuration] = useState(365);
    const { price: dbrPrice } = useDBRPrice();

    const neededBuy = duration * dailyDebtAccrual;

    return <VStack spacing="4" w='full' alignItems="flex-start" p="4">
        <Text pb="8">For how long would like to extend the loan?</Text>
        <F2DurationSliderInput duration={duration} onChange={(v) => setDuration(v)} showText={false} />
        <Divider />
        <InfoMessage
            alertProps={{ w: 'full' }}
            description={
                <VStack w='full' alignItems="flex-start">
                    <HStack w='full' justify="space-between">
                        <Text>- Current Interests for your loans:</Text>
                        <Text fontWeight="bold">-{shortenNumber(dailyDebtAccrual, 2)} DBR / day</Text>
                    </HStack>
                    <HStack w='full' justify="space-between">
                        <Text>- Extension wanted:</Text>
                        <Text><b>{duration} days</b></Text>
                    </HStack>
                    <HStack w='full' justify="space-between">
                        <Text>- DBRs to buy to accomplish extension:</Text>
                        <Text><b>{preciseCommify(neededBuy, 2)} ({shortenNumber(neededBuy*dbrPrice, 2, true)})</b></Text>
                    </HStack>
                </VStack>
            }
        />
        {/* <DbrHealth account={account} debtDelta={debtDelta} /> */}
        {/* <InfoMessage
        description="This will buy enough DBR at market price so that your loan can last longer wihout entering the Exhausted state."
    /> */}
        {/* <SubmitButton colorScheme="blue">
        Top-up
    </SubmitButton> */}
    </VStack>
}