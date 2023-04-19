export const getPoolsAggregatedStats = (
    items: any[],
    isStable?: boolean,
    include?: string | string[],
    exclude?: string | string[],
): {
    tvl: number,
    balance: number,
    pairingDepth: number,
    avgDolaWeight: number,
    pol: number,
    rewardDay: number,
    avgApy: number,
} => {
    const _include = Array.isArray(include) ? include : [include||''];
    const _exclude = Array.isArray(exclude) ? exclude : [exclude||''];

    const filteredItems = items.filter(lp => {
            return (isStable === undefined || (lp.isStable||false) === isStable)
                && _include.every(inc => lp.name.includes(inc))
                && (!!exclude ? _exclude.every(exc => !lp.name.includes(exc)) : true);
        });

    const toExcludeFromAggregate = filteredItems.filter(lp => !!lp.deduce).flatMap(lp => lp.deduce);
    const itemsWithoutChildren = filteredItems.filter(lp => !toExcludeFromAggregate.includes(lp.address));
    // avoid double count for tvl, pair balances
    const tvl = itemsWithoutChildren.reduce((prev, curr) => prev + curr.tvl, 0);
    const balance = itemsWithoutChildren.reduce((prev, curr) => prev + curr.dolaBalance, 0);
    const pairingDepth = itemsWithoutChildren.reduce((prev, curr) => prev + curr.pairingDepth, 0);
    const avgDolaWeight = itemsWithoutChildren.reduce((prev, curr) => prev + (curr.dolaWeight / 100 * curr.tvl), 0) / tvl * 100;
    // pol, apy, should include derived pools such as Aura
    const pol = filteredItems.reduce((prev, curr) => prev + curr.ownedAmount, 0);
    const rewardDay = filteredItems.reduce((prev, curr) => prev + curr.rewardDay, 0);
    const avgApy = filteredItems.reduce((prev, curr) => prev + ((curr.apy || 0) / 100 * curr.tvl), 0) / tvl * 100;

    return {
        tvl,
        balance,
        pairingDepth,
        avgDolaWeight,
        pol,
        rewardDay,
        avgApy,
    }
}