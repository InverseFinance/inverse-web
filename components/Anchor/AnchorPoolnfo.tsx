import { InfoTooltip } from '@inverse/components/common/Tooltip';
import { Text, TextProps } from '@chakra-ui/react';
import { dollarify, shortenNumber } from '@inverse/util/markets';
import { capitalize } from '@inverse/util/misc';
import { usePrices } from '@inverse/hooks/usePrices';

const BalanceTooltipContent = ({ value, priceUsd }: { value: number, priceUsd: number }) => {
    return <>
        <Text>~ <b>{dollarify(value * priceUsd)}</b></Text>
    </>
}

const ApyTooltipContent = ({
    monthlyType,
    monthlyValue,
    priceUsd,
    isSupplied,
    symbol,
    emoji,
}: {
    monthlyType: string,
    monthlyValue: number,
    priceUsd: number,
    isSupplied: boolean,
    symbol: string,
    emoji: string,
}) => {
    return <>
        <Text>Monthly {capitalize(monthlyType)}{emoji}</Text>
        ~ <b>{monthlyValue?.toFixed(5)} {symbol}</b> ({dollarify(monthlyValue * priceUsd!)})
        {
            !isSupplied ?
                <Text>This increases the debt to repay</Text> : null
        }
    </>
}

export const AnchorPoolInfo = ({
    value,
    monthlyValue,
    symbol,
    type,
    priceUsd,
    isReward = false,
    isBalance = false,
    underlyingSymbol = '',
    textProps,
}: {
    type: 'supply' | 'borrow',
    symbol: string,
    value?: number,
    monthlyValue?: number,
    priceUsd?: number,
    isReward?: boolean,
    isBalance?: boolean,
    underlyingSymbol?: string,
    textProps?: TextProps,
}) => {
    const { prices } = usePrices()
    const invPriceUsd = prices['inverse-finance']?.usd || 0;
    const needTooltip = (!!monthlyValue && monthlyValue > 0) || (isBalance && !!value && value > 0);
    const isSupplied = type === 'supply' && needTooltip;
    const emoji = isSupplied ? ' ✨' : '';
    const monthlyType = isSupplied ? 'rewards' : 'interests';
    // invPriceUsd (ref is coingecko) when INV is the asset supplied or it's a reward in INV
    const bestPriceRef = invPriceUsd && (isReward || symbol === 'INV' || underlyingSymbol === 'INV') ? invPriceUsd : priceUsd;

    const suffix = isBalance ? '' : '%'
    const label = (value ? `${isBalance ? shortenNumber(value, 2) : value.toFixed(2)}` : '0.00')+suffix

    return (
        <Text {...textProps} opacity={value && value > 0 ? 1 : 0.5}>
            {label}
            {
                needTooltip && bestPriceRef ?
                    <InfoTooltip
                        iconProps={{ ml: '1', fontSize: '10px' }}
                        tooltipProps={{
                            className: `blurred-container ${isSupplied ? 'success-bg' : 'warning-bg'}`,
                            borderColor: isSupplied ? 'success' : 'warning',
                        }}
                        message={
                            isBalance ?
                                <BalanceTooltipContent
                                    priceUsd={bestPriceRef}
                                    value={value!}
                                />
                                :
                                <ApyTooltipContent
                                    isSupplied={isSupplied}
                                    monthlyType={monthlyType}
                                    symbol={symbol}
                                    monthlyValue={monthlyValue!}
                                    priceUsd={bestPriceRef}
                                    emoji={emoji} />
                        } />
                    : null
            }
        </Text>
    )
}