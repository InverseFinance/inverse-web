import { InfoTooltip } from '@inverse/components/common/Tooltip';
import { Text, TextProps } from '@chakra-ui/react';
import { dollarify } from '@inverse/util/markets';

export const AnchorPoolInfo = ({
    apy,
    monthlyValue,
    symbol,
    type,
    priceUsd,
    invPriceUsd,
    isReward = false,
    textProps,
}: {
    type: 'supply' | 'borrow',
    symbol?: string,
    apy?: number,
    monthlyValue?: number,
    priceUsd?: number,
    invPriceUsd?: number,
    isReward?: boolean,
    textProps?: TextProps,
}) => {
    const needTooltip = monthlyValue && monthlyValue > 0;
    const isSupplied = type === 'supply' && needTooltip;
    const emoji = isSupplied ? ' ✨' : '';
    const monthlyType = isSupplied ? 'rewards' : 'interests';
    // invPriceUsd (ref is coingecko) when INV is the asset supplied or it's a reward in INV
    const interestPriceUsd = invPriceUsd && (isReward || symbol === 'INV') ? invPriceUsd : priceUsd;

    return (
        <Text {...textProps} opacity={apy && apy > 0 ? 1 : 0.5}>
            {apy ? `${apy.toFixed(2)}%` : '0.00%'}
            {
                needTooltip ?
                    <InfoTooltip
                        iconProps={{ ml: '1', fontSize: '10px' }}
                        tooltipProps={{
                            bgColor: isSupplied ? 'successAlpha' : 'warningAlpha',
                            backdropFilter: 'blur(1.5rem)',
                            borderColor: isSupplied ? 'success' : 'warning',
                        }}
                        message={
                            symbol && monthlyValue && monthlyValue > 0 ?
                                <>
                                    <Text>Monthly {monthlyType}{emoji}</Text>
                                    ~ <b>{monthlyValue?.toFixed(5)} {symbol}</b> ({dollarify(monthlyValue * interestPriceUsd!)})
                                    {
                                        !isSupplied ? 
                                        <Text>This increases the debt to repay</Text> : null
                                    }
                                </>
                                : ''
                        } />
                    : null
            }
        </Text>
    )
}