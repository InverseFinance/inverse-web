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
    const tvl = items.reduce((prev, curr) => prev + curr.tvl, 0);
    const pol = items.reduce((prev, curr) => prev + curr.pol, 0);
    const balance = items.reduce((prev, curr) => prev + curr.dolaBalance, 0);
    const pairingDepth = items.reduce((prev, curr) => prev + curr.pairingDepth, 0);
    const avgDolaWeight = items.reduce((prev, curr) => prev + (curr.dolaWeight / 100 * curr.tvl), 0) / tvl * 100;

    return <SimpleTwoColTable
        containerProps={containerProps}
        items={[
            { label: 'Total TVL', value: preciseCommify(tvl, 0, true) },
            { label: 'Avg. DOLA weight', value: `${shortenNumber(avgDolaWeight, 2)}%` },
            { label: 'Pairing Depth', value: preciseCommify(pairingDepth, 0, true) },
            { label: 'DOLA Balance', value: preciseCommify(balance, 0, true) },
            { label: 'PoL', value: preciseCommify(pol, 0, true) },
        ]}
    />
}