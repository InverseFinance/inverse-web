import { preciseCommify } from "@app/util/misc"
import { shortenNumber } from "@app/util/markets"
import { AppContainerProps } from "../common/Container"
import { SimpleTwoColTable } from "../common/SimpleTwoColTable"
import { getPoolsAggregatedStats } from "@app/util/pools"

const commonTextProps = {
    textDecoration: 'underline',
    cursor: 'pointer',
}

export const AggregatedLiquidityData = ({
    items,
    isStable,
    include,
    exclude,
    containerProps,
    handleClick = () => { },
}: {
    items: any[],
    isStable?: boolean,
    include?: string | string[],
    exclude?: string | string[],
    containerProps?: AppContainerProps,
    handleClick?: (
        isStable: boolean | undefined,
        exclude: string | string[] | undefined,
        attribute: string,
        attributeLabel: string,
        title: string | undefined,
        isPerc: boolean | undefined
    ) => void,
}) => {
    const {
        tvl,
        balance,
        pairingDepth,
        avgDolaWeight,
        pol,
        rewardDay,
        avgApy,
    } = getPoolsAggregatedStats(items, isStable, include, exclude);

    return <SimpleTwoColTable
        containerProps={containerProps}
        valueProps={{ fontWeight: 'bold' }}
        items={
            [{
                label: 'Total TVL',
                value: preciseCommify(tvl, 0, true),
                valueProps: {
                    ...commonTextProps,
                    onClick: () => handleClick(isStable, exclude, 'tvl', 'Total TVL', containerProps?.label)
                }
            },
            {
                label: 'Avg. DOLA weight',
                value: `${shortenNumber(avgDolaWeight, 2)}%`,
                valueProps: {
                    ...commonTextProps,
                    onClick: () => handleClick(isStable, exclude, 'avgDolaWeight', 'Avg. DOLA weight', containerProps?.label, true)
                }
            },
            {
                label: 'Pairing Depth',
                value: preciseCommify(pairingDepth, 0, true),
                valueProps: {
                    ...commonTextProps,
                    onClick: () => handleClick(isStable, exclude, 'pairingDepth', 'Pairing Depth', containerProps?.label)
                }
            },
            {
                label: 'DOLA Balance',
                value: preciseCommify(balance, 0, true),
                valueProps: {
                    ...commonTextProps,
                    onClick: () => handleClick(isStable, exclude, 'balance', 'DOLA Balance', containerProps?.label)
                }
            },
            {
                label: 'Protocol Owned',
                value: preciseCommify(pol, 0, true),
                valueProps: {
                    ...commonTextProps,
                    onClick: () => handleClick(isStable, exclude, 'pol', 'Protocol Owned', containerProps?.label)
                }
            },
            {
                label: '$/day',
                value: preciseCommify(rewardDay, 0, true),
                valueProps: {
                    ...commonTextProps,
                    onClick: () => handleClick(isStable, exclude, 'rewardDay', '$/day', containerProps?.label)
                }
            },
            {
                label: 'Avg. APY',
                value: `${shortenNumber(avgApy, 2)}%`,
                valueProps: {
                    ...commonTextProps,
                    onClick: () => handleClick(isStable, exclude, 'avgApy', 'Avg. APY', containerProps?.label, true)
                }
            },
            ]
        }
    />
}