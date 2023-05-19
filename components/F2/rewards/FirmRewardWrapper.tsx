import { F2Market } from "@app/types"
import { useContext, useEffect } from "react";
import { useEscrowRewards, useINVEscrowRewards } from "@app/hooks/useFirm";
import { F2MarketContext } from "../F2Contex";
import { BURN_ADDRESS } from "@app/config/constants";
import { zapperRefresh } from "@app/util/f2";
import { RewardsContainer } from "./RewardsContainer";

export const FirmRewardWrapper = ({
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
    const { escrow: escrowFromContext } = useContext(F2MarketContext);
    const _escrow = escrow?.replace(BURN_ADDRESS, '') || escrowFromContext?.replace(BURN_ADDRESS, '');
    if (!_escrow) return <></>;

    if (market.isInv) {
        return <FirmINVRewardWrapperContent
            market={market}
            label={label}
            showMarketBtn={showMarketBtn}
            escrow={_escrow}
        />
    }

    return <FirmRewardWrapperContent
        market={market}
        label={label}
        showMarketBtn={showMarketBtn}
        escrow={_escrow}
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
    const { needRefreshRewards, setNeedRefreshRewards, account } = useContext(F2MarketContext);
    const { appGroupPositions, isLoading } = useEscrowRewards(escrow);
    const rewardsInfos = appGroupPositions.find(a => a.appGroup === market.zapperAppGroup);

    useEffect(() => {
        if (!account || !needRefreshRewards) { return }
        zapperRefresh(account);
        setNeedRefreshRewards(false);
    }, [needRefreshRewards, account]);

    return <FirmRewards
        market={market}
        rewardsInfos={rewardsInfos}
        label={label}
        showMarketBtn={showMarketBtn}
        isLoading={isLoading}
    />
}

export const FirmINVRewardWrapperContent = ({
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
    const { rewardsInfos, isLoading } = useINVEscrowRewards(escrow);

    return <FirmRewards
        market={market}
        rewardsInfos={rewardsInfos}
        label={label}
        showMarketBtn={showMarketBtn}
        isLoading={isLoading}
        escrow={escrow}
    />
}

export const FirmRewards = ({
    market,
    rewardsInfos,
    label,
    showMarketBtn = false,
    isLoading,
    escrow,
    extra,
}: {
    market: F2Market
    rewardsInfos: any[]
    label?: string
    escrow?: string
    showMarketBtn?: boolean
    isLoading?: boolean
    extra?: any
}) => {
    const { escrow: escrowFromContext } = useContext(F2MarketContext);
    const _escrow = escrow?.replace(BURN_ADDRESS, '') || escrowFromContext?.replace(BURN_ADDRESS, '');

    const claimables = rewardsInfos?.tokens.filter(t => t.metaType === 'claimable');
    claimables?.sort((a, b) => b.balanceUSD - a.balanceUSD)
    const totalRewardsUSD = claimables?.reduce((prev, curr) => prev + curr.balanceUSD, 0);

    if (isLoading) {
        return <></>
    }
    return <RewardsContainer
        timestamp={rewardsInfos?.timestamp}
        label={label || `${market?.name} Market Rewards`}
        escrow={_escrow}
        claimables={claimables}
        totalRewardsUSD={totalRewardsUSD}
        market={market}
        showMarketBtn={showMarketBtn}
        defaultCollapse={false}
        extra={extra}
    />
}