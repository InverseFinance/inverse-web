import { InfoTooltip } from '@inverse/components/common/Tooltip';
import { Text, TextProps } from '@chakra-ui/react';

export const AnchorPoolInfo = ({
    apy,
    monthlyValue,
    symbol,
    type,
    textProps,
}: {
    type: 'supply' | 'borrow' | 'supplied' | 'borrowed',
    symbol?: string,
    apy?: number,
    monthlyValue?: number,
    textProps?: TextProps,
}) => {
    const emoji = type === 'supplied' ? ' ✨' : '';
    const needTooltip = ['supplied', 'borrowed'].includes(type);

    return (
        <Text {...textProps} opacity={apy && apy > 0 ? 1 : 0.5}>
            {apy ? `${apy.toFixed(2)}%` : '0.00%'}
            {
                needTooltip ?
                    <InfoTooltip
                        iconProps={{ ml: '1', fontSize: '10px' }}
                        message={
                            symbol && monthlyValue && monthlyValue > 0 ?
                                `~ ${monthlyValue?.toFixed(4)} ${symbol} ${type} per month${emoji}`
                                : ''
                        } />
                    : null
            }
        </Text>
    )
}