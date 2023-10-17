import { shortenNumber } from "@app/util/markets"
import { HStack, StackProps, Text, TextProps } from "@chakra-ui/react"

export const AmountInfos = ({
    label,
    value,
    delta,
    price,
    dbrCover,
    textProps,
    format = true,
    precision = 2,
    ...props
}: {
    label: string
    value: number
    delta?: number
    price?: number
    dbrCover?: number
    format?: boolean
    precision?: number
    textProps?: Partial<TextProps>
} & Partial<StackProps>) => {
    const _textProps = { fontSize: { base: '11px', sm: '13px', md: '14px' }, color: 'secondaryTextColor', ...textProps }
    if(textProps?.onClick){
        // _textProps.textDecoration = 'underline'
        _textProps.cursor = 'pointer';
        _textProps.textDecoration = 'underline';
        _textProps._hover = { filter: 'brightness(1.5)' };
    }
    const formatFun = format ? shortenNumber : (v) => v;
    const deltaSign = (delta || 0) > 0 ? '+' : '-';
    const newValue = value + (delta || 0);

    const dbrText = dbrCover ? ` + DBR Cost = ${formatFun(dbrCover + newValue, precision)}` : ''
    const newValueUSD = price ? `(${formatFun(newValue * price, precision, true)})` : '';
    const deltaUSD = price && delta ? ` (${formatFun(delta * price, precision, true)})` : ''
    const formattedDelta = delta ? formatFun(Math.abs(delta), precision, false) : '';

    return <HStack fontSize="10px" spacing="1" justify="space-between" {...props}>
        <Text {..._textProps}>
            {label}: {!!value ?
                formatFun(value, precision, false) : ''} {price && !!value ? `(${formatFun(value * price, precision, true)})`
                    : delta || !!value ? '' : '0'
            }
        </Text>
        {
            (!!delta) &&
            <Text {..._textProps}>
                {
                    !!delta && !!value ?
                        `${deltaSign}${!!value ? ' ' : ''}${formattedDelta}${deltaUSD} => `
                        :
                        ''
                }
                {formatFun(newValue, precision, false)} {newValueUSD}{dbrText}</Text>
        }
    </HStack>
}