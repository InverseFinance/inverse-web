import { preciseCommify } from "@app/util/misc"
import { shortenNumber } from "@app/util/markets"
import { AppContainerProps } from "../common/Container"
import { SimpleTwoColTable } from "../common/SimpleTwoColTable"
import { getPoolsAggregatedStats } from "@app/util/pools"

export const AggregatedLiquidityData = ({
    items,
    containerProps,
}: {
    items: any[],
    containerProps?: AppContainerProps,
}) => {
    const {
        tvl,
        balance,
        pairingDepth,
        avgDolaWeight,
        pol,
        rewardDay,
        avgApy,
    } = getPoolsAggregatedStats(items);

    return <SimpleTwoColTable
        containerProps={containerProps}
        valueProps={{ fontWeight: 'bold' }}
        items={[
            { label: 'Total TVL', value: preciseCommify(tvl, 0, true) },
            { label: 'Avg. DOLA weight', value: `${shortenNumber(avgDolaWeight, 2)}%` },
            { label: 'Pairing Depth', value: preciseCommify(pairingDepth, 0, true) },
            { label: 'DOLA Balance', value: preciseCommify(balance, 0, true) },
            { label: 'Protocol Owned', value: preciseCommify(pol, 0, true) },
            { label: '$/day', value: preciseCommify(rewardDay, 0, true) },
            { label: 'Avg. APY', value: `${shortenNumber(avgApy, 2)}%` },
        ]}
    />
}