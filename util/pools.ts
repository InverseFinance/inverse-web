export const getPoolsAggregatedStats = (items: any[]): {
    tvl: number,
    balance: number,        
    pairingDepth: number,
    avgDolaWeight: number,
    pol: number,
    rewardDay: number,
    avgApy: number,
} => {
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