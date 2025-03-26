import { F2Market } from "@app/types"
import { useContext, useEffect } from "react";
import { useConvexLpRewards, useCvxCrvRewards, useCvxFxsRewards, useCvxRewards, useEscrowBalance, useEscrowRewards, useINVEscrowRewards, useStakedInFirm } from "@app/hooks/useFirm";
import { F2MarketContext } from "../F2Contex";
import { BURN_ADDRESS } from "@app/config/constants";
import { zapperRefresh } from "@app/util/f2";
import { RewardsContainer } from "./RewardsContainer";
import { useAccount } from "@app/hooks/misc";
import { VStack, Text, HStack } from "@chakra-ui/react";
import { getMonthlyRate, shortenNumber } from "@app/util/markets";
import { InfoMessage } from "@app/components/common/Messages";
import { usePrices } from "@app/hooks/usePrices";
import { useDBRPrice } from "@app/hooks/useDBR";

export const FirmRewardWrapper = ({
    market,
    label,
    showMarketBtn = false,
    extraAtBottom = false,
    escrow,
    onLoad,
    hideIfNoRewards = false
}: {
    market: F2Market
    label?: string
    escrow?: string
    showMarketBtn?: boolean
    extraAtBottom?: boolean
    onLoad?: (v: number) => void
    hideIfNoRewards?: boolean
}) => {
    const { escrow: escrowFromContext } = useContext(F2MarketContext);
    const _escrow = escrow?.replace(BURN_ADDRESS, '') || escrowFromContext?.replace(BURN_ADDRESS, '');
    if (!_escrow) return <></>;
    const commonProps = {
        market,
        label,
        showMarketBtn,
        extraAtBottom,
        escrow: _escrow,
        hideIfNoRewards,
        onLoad,
    }
    if (market.isInv) {
        return <FirmINVRewardWrapperContent
            {...commonProps}
        />
    } else if (market.name === 'cvxFXS') {
        return <FirmCvxFxsRewardWrapperContent
            {...commonProps}
        />
    } else if (market.name === 'cvxCRV') {
        return <FirmCvxCrvRewardWrapperContent
            {...commonProps}
        />
    } else if (market.name === 'CVX') {
        return <FirmCvxRewardWrapperContent
            {...commonProps}
        />
    }
    else if (!!market.convexRewardsAddress) {
        return <FirmConvexLpRewardWrapperContent
            {...commonProps}
            rewardContract={market.convexRewardsAddress}
        />
    }

    return <FirmRewardWrapperContent
        {...commonProps}
    />
}

export const FirmCvxCrvRewardWrapperContent = ({
    market,
    label,
    showMarketBtn = false,
    extraAtBottom = false,
    escrow,
    onLoad,
    hideIfNoRewards,
}: {
    market: F2Market
    label?: string
    escrow?: string
    showMarketBtn?: boolean
    extraAtBottom?: boolean
    onLoad?: (v: number) => void
    hideIfNoRewards?: boolean
}) => {
    const { rewardsInfos, isLoading } = useCvxCrvRewards(escrow);

    useEffect(() => {
        if (!onLoad || !rewardsInfos?.tokens?.length || isLoading) { return }
        const totalUsd = rewardsInfos.tokens.filter(t => t.metaType === 'claimable')
            .reduce((prev, curr) => prev + curr.balanceUSD, 0);
        onLoad(totalUsd);
    }, [rewardsInfos, onLoad])

    return <FirmRewards
        hideIfNoRewards={hideIfNoRewards}
        market={market}
        escrow={escrow}
        rewardsInfos={rewardsInfos}
        label={label}
        showMarketBtn={showMarketBtn}
        extraAtBottom={extraAtBottom}
        isLoading={isLoading}
    />
}

export const FirmCvxRewardWrapperContent = ({
    market,
    label,
    showMarketBtn = false,
    extraAtBottom = false,
    escrow,
    onLoad,
    hideIfNoRewards,
}: {
    market: F2Market
    label?: string
    escrow?: string
    showMarketBtn?: boolean
    extraAtBottom?: boolean
    onLoad?: (v: number) => void
    hideIfNoRewards?: boolean
}) => {
    const { rewardsInfos, extraRewards, isLoading } = useCvxRewards(escrow);
    const { balance } = useEscrowBalance(escrow, market.underlying.decimals);
    const { prices } = usePrices();

    const monthlyRewards = getMonthlyRate(balance || 0, market?.supplyApy);
    const price = prices ? prices['convex-finance']?.usd : 0;
    const cvxCrvPrice = prices ? prices['convex-crv']?.usd : 0;
    const cvxCrvEquivalentMonthlyRewards = (monthlyRewards * price) / cvxCrvPrice;

    useEffect(() => {
        if (!onLoad || !rewardsInfos?.tokens?.length || isLoading) { return }
        const totalUsd = rewardsInfos.tokens.filter(t => t.metaType === 'claimable')
            .reduce((prev, curr) => prev + curr.balanceUSD, 0);
        onLoad(totalUsd);
    }, [rewardsInfos, onLoad])

    return <FirmRewards
        hideIfNoRewards={hideIfNoRewards}
        market={market}
        escrow={escrow}
        rewardsInfos={rewardsInfos}
        extraRewards={extraRewards}
        label={label}
        showMarketBtn={showMarketBtn}
        extraAtBottom={extraAtBottom}
        isLoading={isLoading}
        showMonthlyRewards={false}
        extra={
            cvxCrvPrice > 0 && <VStack alignItems="flex-start" justify="center" w={{ base: 'auto', md: '700px' }}>
                <InfoMessage
                    alertProps={{ fontSize: '18px' }}
                    description={
                        <VStack alignItems="flex-end">
                            <Text>Monthly cvxCRV rewards:</Text>
                            <Text textAlign="right" fontWeight="bold">~{shortenNumber(cvxCrvEquivalentMonthlyRewards, 2)} ({shortenNumber(cvxCrvEquivalentMonthlyRewards * cvxCrvPrice, 2, true)})</Text>
                        </VStack>
                    }
                />
            </VStack>
        }
    />
}

export const FirmConvexLpRewardWrapperContent = ({
    market,
    label,
    showMarketBtn = false,
    extraAtBottom = false,
    escrow,
    rewardContract,
    onLoad,
    hideIfNoRewards,
}: {
    market: F2Market
    label?: string
    escrow?: string
    rewardContract?: string
    showMarketBtn?: boolean
    extraAtBottom?: boolean
    onLoad?: (v: number) => void
    hideIfNoRewards?: boolean
}) => {
    const { rewardsInfos, isLoading } = useConvexLpRewards(escrow, rewardContract);
    useEffect(() => {
        if (!onLoad || !rewardsInfos?.tokens?.length || isLoading) { return }
        const totalUsd = rewardsInfos.tokens.filter(t => t.metaType === 'claimable')
            .reduce((prev, curr) => prev + curr.balanceUSD, 0);
        onLoad(totalUsd);
    }, [rewardsInfos, onLoad])

    return <FirmRewards
        hideIfNoRewards={hideIfNoRewards}
        market={market}
        escrow={escrow}
        rewardsInfos={rewardsInfos}
        label={label}
        showMarketBtn={showMarketBtn}
        extraAtBottom={extraAtBottom}
        isLoading={isLoading}
        showMonthlyRewards={false}
    />
}

export const FirmCvxFxsRewardWrapperContent = ({
    market,
    label,
    showMarketBtn = false,
    extraAtBottom = false,
    escrow,
    onLoad,
    hideIfNoRewards,
}: {
    market: F2Market
    label?: string
    escrow?: string
    showMarketBtn?: boolean
    extraAtBottom?: boolean
    onLoad?: (v: number) => void
    hideIfNoRewards?: boolean
}) => {
    const { rewardsInfos, isLoading } = useCvxFxsRewards(escrow);

    useEffect(() => {
        if (!onLoad || !rewardsInfos?.tokens?.length || isLoading) { return }
        const totalUsd = rewardsInfos.tokens.filter(t => t.metaType === 'claimable')
            .reduce((prev, curr) => prev + curr.balanceUSD, 0);
        onLoad(totalUsd);
    }, [rewardsInfos, onLoad])

    return <FirmRewards
        hideIfNoRewards={hideIfNoRewards}
        market={market}
        escrow={escrow}
        rewardsInfos={rewardsInfos}
        label={label}
        showMarketBtn={showMarketBtn}
        extraAtBottom={extraAtBottom}
        isLoading={isLoading}
    />
}

export const FirmRewardWrapperContent = ({
    market,
    label,
    showMarketBtn = false,
    extraAtBottom = false,
    escrow,
    hideIfNoRewards,
}: {
    market: F2Market
    label?: string
    escrow?: string
    showMarketBtn?: boolean
    extraAtBottom?: boolean
    hideIfNoRewards?: boolean
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
        hideIfNoRewards={hideIfNoRewards}
        market={market}
        escrow={escrow}
        rewardsInfos={rewardsInfos}
        label={label}
        showMarketBtn={showMarketBtn}
        extraAtBottom={extraAtBottom}
        isLoading={isLoading}
    />
}

export const FirmINVRewardWrapperContent = ({
    market,
    label,
    showMarketBtn = false,
    extraAtBottom = false,
    escrow,
    onLoad,
    hideIfNoRewards,
}: {
    market: F2Market
    label?: string
    escrow?: string
    showMarketBtn?: boolean
    extraAtBottom?: boolean
    onLoad?: (v: number) => void
    hideIfNoRewards?: boolean
}) => {
    const account = useAccount();
    const { prices } = usePrices();
    const { rewardsInfos, isLoading } = useINVEscrowRewards(escrow);
    const { stakedInFirm } = useStakedInFirm(account);

    useEffect(() => {
        if (!onLoad || !rewardsInfos?.tokens?.length || isLoading) { return }
        const totalUsd = rewardsInfos.tokens.filter(t => t.metaType === 'claimable')
            .reduce((prev, curr) => prev + curr.balanceUSD, 0);
        onLoad(totalUsd);
    }, [rewardsInfos, onLoad])

    const share = market.invStakedViaDistributor ? stakedInFirm / market.invStakedViaDistributor : 0;
    const invMonthlyRewards = getMonthlyRate(stakedInFirm, market?.supplyApy);
    const dbrMonthlyRewards = share * market?.dbrYearlyRewardRate / 12;
    const invPriceCg = prices ? prices['inverse-finance']?.usd : 0;
    const { priceUsd: dbrPriceUsd } = useDBRPrice();

    return <FirmRewards
        hideIfNoRewards={hideIfNoRewards}
        market={market}
        rewardsInfos={rewardsInfos}
        label={label}
        showMarketBtn={showMarketBtn}
        extraAtBottom={extraAtBottom}
        isLoading={isLoading}
        escrow={escrow}
        extra={<VStack alignItems="flex-end" justify="center" w={{ base: 'auto', md: '700px' }}>
            {
                market?.invStakedViaDistributor &&
                <InfoMessage
                    alertProps={{ fontSize: '16px' }}
                    description={
                        <VStack alignItems="flex-start">
                            <HStack w='full' justify="space-between" spacing="2">
                                <Text>Monthly INV rewards:</Text>
                                <Text textAlign="right" fontWeight="bold">~{shortenNumber(invMonthlyRewards, 2)} ({shortenNumber(invMonthlyRewards * invPriceCg, 2, true)})</Text>
                            </HStack>
                            <HStack w='full' justify="space-between" spacing="2">
                                <Text>Monthly DBR rewards:</Text>
                                <Text textAlign="right" fontWeight="bold">~{shortenNumber(dbrMonthlyRewards, 2)} ({shortenNumber(dbrMonthlyRewards * dbrPriceUsd, 2, true)})</Text>
                            </HStack>
                        </VStack>
                    }
                />
            }
        </VStack>}
    />
}

export const FirmRewards = ({
    market,
    rewardsInfos,
    extraRewards,
    label,
    showMarketBtn = false,
    extraAtBottom = false,
    isLoading,
    escrow,
    extra,
    hideIfNoRewards,
}: {
    market: F2Market
    rewardsInfos: any[]
    extraRewards?: string[]
    label?: string
    escrow?: string
    showMarketBtn?: boolean
    extraAtBottom?: boolean
    isLoading?: boolean
    extra?: any
    hideIfNoRewards?: boolean
}) => {
    const { escrow: escrowFromContext } = useContext(F2MarketContext);
    const _escrow = escrow?.replace(BURN_ADDRESS, '') || escrowFromContext?.replace(BURN_ADDRESS, '');

    const claimables = rewardsInfos?.tokens.filter(t => t.metaType === 'claimable' && (t.balanceUSD > 0.01 || (!t.price && t.balance > 0)));
    claimables?.sort((a, b) => b.balanceUSD - a.balanceUSD)
    const totalRewardsUSD = claimables?.reduce((prev, curr) => prev + curr.balanceUSD, 0);

    if (isLoading || (hideIfNoRewards && !totalRewardsUSD)) {
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
        extraAtBottom={extraAtBottom}
        defaultCollapse={false}
        extra={extra}
        extraRewards={extraRewards}
    />
}