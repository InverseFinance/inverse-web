import { preciseCommify } from "@app/util/misc"
import { shortenNumber } from "@app/util/markets"
import { AppContainerProps } from "../common/Container"
import { SimpleTwoColTable } from "../common/SimpleTwoColTable"

export const AggregatedLiquidityData = ({
    items,
    containerProps,
}: {
    items: any[],
    containerProps?: AppContainerProps,
}) => {
    const toExcludeFromAggregate = items.filter(lp => !!lp.deduce).map(lp => lp.deduce).flat();
    const itemsWithoutChildren = items.filter(lp => !toExcludeFromAggregate.includes(lp.address));
    // avoid double count for tvl, pair balances
    const tvl = itemsWithoutChildren.reduce((prev, curr) => prev + curr.tvl, 0);
    const balance = itemsWithoutChildren.reduce((prev, curr) => prev + curr.dolaBalance, 0);
    const pairingDepth = itemsWithoutChildren.reduce((prev, curr) => prev + curr.pairingDepth, 0);
    const avgDolaWeight = itemsWithoutChildren.reduce((prev, curr) => prev + (curr.dolaWeight / 100 * curr.tvl), 0) / tvl * 100;
    // pol, apy, should include derived pools such as Aura
    const pol = items.reduce((prev, curr) => prev + curr.pol, 0);
    const rewardDay = items.reduce((prev, curr) => prev + curr.rewardDay, 0);    
    const avgApy = items.reduce((prev, curr) => prev + ((curr.apy||0) / 100 * curr.tvl), 0) / tvl * 100;

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