import { F2Market } from "@app/types"
import { CvxCrvRewards } from "./CvxCrvRewards";
import { useContext } from "react";
import { useEscrowRewards } from "@app/hooks/useFirm";
import { F2MarketContext } from "../F2Contex";

const exampleAddress = '0x5a78917b84d3946f7e093ad4d9944fffffb451a9';

export const FirmRewardWrapper = ({
    market,
    label,
    showMarketBtn = false,
}: {
    market: F2Market
    label?: string
    showMarketBtn?: boolean
}) => {
    const { escrow, signer, deposits } = useContext(F2MarketContext);
    const { appGroupPositions, isLoading } = useEscrowRewards(exampleAddress);
    const rewardsInfos = appGroupPositions.find(a => a.appGroup === market.zapperAppGroup);

    const claimables = rewardsInfos?.tokens.filter(t => t.metaType === 'claimable');
    claimables?.sort((a, b) => b.balanceUSD - a.balanceUSD)
    const totalRewardsUSD = claimables?.reduce((prev, curr) => prev + curr.balanceUSD, 0);

    if (isLoading) {
        return <></>
    } else if (market.name === 'cvxCRV') {
        return <CvxCrvRewards
            label={label || `${market?.name} Rewards`}
            escrow={escrow}
            claimables={claimables}
            totalRewardsUSD={totalRewardsUSD}
            signer={signer}
            market={market}
            showMarketBtn={showMarketBtn}
        />
    }
    return <></>
}