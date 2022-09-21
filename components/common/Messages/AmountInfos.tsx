import { shortenNumber } from "@app/util/markets"
import { HStack, StackProps, Text, TextProps } from "@chakra-ui/react"

export const AmountInfos = ({
    label,
    value,
    newValue,
    price,
    dbrCover,
    textProps,
    ...props
}: {
    label: string
    value: number
    newValue?: number
    price?: number
    dbrCover?: number
    textProps?: Partial<TextProps>
} & Partial<StackProps>) => {
    const _textProps = { fontSize: '12px', color: 'secondaryTextColor', ...textProps }
    return <HStack spacing="1" justify="space-between" {...props}>
        <Text {..._textProps}>
            {label}: {!!value || !value && !newValue ? shortenNumber(value, 2, false, true) : ''} {price && value ? `(${shortenNumber(value * price, 2, true)})` : ''}
        </Text>
        {
            !!newValue && value !== newValue &&
            <Text {..._textProps}> {!!value && !!newValue ? '=>' : ''}{shortenNumber(newValue, 2, false, true)} {price ? `(${shortenNumber(newValue * price, 2, true)})` : ''}{dbrCover ? ` + DBR Cover = ${shortenNumber(dbrCover + newValue, 2)}` : ''}</Text>
        }
    </HStack>
}