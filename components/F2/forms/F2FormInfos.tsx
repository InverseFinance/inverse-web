import { Stack, VStack, Text } from '@chakra-ui/react'
import { shortenNumber } from '@app/util/markets'
import { preciseCommify } from '@app/util/misc'
import { TextInfo } from '@app/components/common/Messages/TextInfo'

export const F2FormInfos = ({
    newPerc,
    riskColor,
    isFormFilled,
    newLiquidationPrice,
    f2market,
    dbrCoverDebt,
    dbrCover,
    duration,
    onHealthOpen = () => {},
    onDbrOpen = () => {},
}) => {
    return <Stack w='full' direction={{ base: 'column', sm: 'row' }} justify="space-between">
        <VStack spacing="0" alignItems="flex-start">
            <TextInfo message="Percentage of the loan covered by the collateral worth">
                <Text color="mainTextColor" cursor="pointer" onClick={() => onHealthOpen()} >
                    Collateral Health:
                </Text>
            </TextInfo>
            <Text color={newPerc < 75 ? riskColor : undefined} fontWeight={isFormFilled && newPerc <= 25 ? 'bold' : undefined}>{isFormFilled ? `${shortenNumber(newPerc, 2)}%` : '-'}</Text>
        </VStack>
        <VStack spacing="0" alignItems="flex-start">
            <TextInfo message="Minimum Collateral Price before liquidations can happen">
                <Text color="mainTextColor" cursor="pointer" onClick={() => onHealthOpen()}>
                    Liq. Price:
                </Text>
            </TextInfo>
            <Text color={newPerc < 75 ? riskColor : undefined} fontWeight={isFormFilled && newPerc <= 25 ? 'bold' : undefined}>
                {isFormFilled ? newLiquidationPrice >= f2market.price ? 'Instant' : `${preciseCommify(newLiquidationPrice, 2, true)}` : '-'}
            </Text>
        </VStack>
        <VStack spacing="0" alignItems={{ base: 'flex-start', sm: 'flex-end' }}>
            <TextInfo message="DBR tokens you will receive, they will be automatically used to cover borrowing interests over time. Don't sell them unless you know what you're doing!">
                <Text cursor="pointer" onClick={() => onDbrOpen()} color="mainTextColor">
                    DBR cover:
                </Text>
            </TextInfo>
            <Text>{shortenNumber(dbrCover, 2)} ({shortenNumber(dbrCoverDebt, 2, true)})</Text>
        </VStack>
        <VStack spacing="0" alignItems={{ base: 'flex-start', sm: 'flex-end' }}>
            <TextInfo message="The Fixed Rate will be locked-in for a specific duration, you can change the duration by clicking the settings icon.">
                <Text cursor="pointer" onClick={() => onDbrOpen()} color="mainTextColor">
                    Rate Validity:
                </Text>
            </TextInfo>
            <Text>{duration} days</Text>
        </VStack>
    </Stack>
}