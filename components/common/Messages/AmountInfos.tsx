import { shortenNumber } from "@app/util/markets"
import { HStack, Text } from "@chakra-ui/react"

export const AmountInfos = ({
    label,
    value,
    newValue,
    price,
    dbrCover
}: {
    label: string
    value: number
    newValue?: number
    price?: number
    dbrCover?: number
}) => {
    const textProps = { fontSize: '12px', color: 'secondaryTextColor' }
    return <HStack spacing="1" justify="space-between">
        <Text {...textProps}>
            {label}: {!!value || !value && !newValue ? shortenNumber(value, 2, false, true) : ''} {price && value ? `(${shortenNumber(value * price, 2, true)})` : ''}
        </Text>
        {
            !!newValue && value !== newValue &&
            <Text {...textProps}> {!!value && !!newValue ? '=>' : ''}{shortenNumber(newValue, 2, false, true)} {price ? `(${shortenNumber(newValue * price, 2, true)})` : ''}{dbrCover ? ` + DBR Cover = ${shortenNumber(dbrCover + newValue, 2)}` : ''}</Text>
        }
    </HStack>
}