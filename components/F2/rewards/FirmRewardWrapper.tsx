import { F2Market } from "@app/types"
import { CvxCrvRewards } from "./CvxCrvRewards";
import { useContext } from "react";
import { useEscrowRewards } from "@app/hooks/useFirm";
import { F2MarketContext } from "../F2Contex";
import { BURN_ADDRESS } from "@app/config/constants";

export const FirmRewardWrapper = ({
    market,
    label,
    showMarketBtn = false,
}: {
    market: F2Market
    label?: string
    showMarketBtn?: boolean
}) => {
    const { escrow } = useContext(F2MarketContext);
    if (!escrow || escrow === BURN_ADDRESS) return <></>;

    return <FirmRewardWrapperContent
        market={market}
        label={label}
        showMarketBtn={showMarketBtn}
        escrow={escrow}
    />
}

export const FirmRewardWrapperContent = ({
    market,
    label,
    showMarketBtn = false,
    escrow,
}: {
    market: F2Market
    label?: string
    escrow?: string
    showMarketBtn?: boolean
}) => {
    const { appGroupPositions, isLoading } = useEscrowRewards(escrow);
    const rewardsInfos = appGroupPositions.find(a => a.appGroup === market.zapperAppGroup);

    return <FirmRewards
        market={market}
        rewardsInfos={rewardsInfos}
        label={label}
        showMarketBtn={showMarketBtn}
        isLoading={isLoading}
    />
}

export const FirmRewards = ({
    market,
    rewardsInfos,
    label,
    showMarketBtn = false,
    isLoading,
}: {
    market: F2Market
    rewardsInfos: any[]
    label?: string
    showMarketBtn?: boolean
    isLoading?: boolean
}) => {
    const { escrow, signer } = useContext(F2MarketContext);

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
            defaultCollapse={false}
        />
    }
    return <></>
}