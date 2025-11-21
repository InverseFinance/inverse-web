import Container from "@app/components/common/Container";
import { ZapperTokens } from "./ZapperTokens"
import { claim } from "@app/util/firm-extra";
import { InfoMessage, SuccessMessage } from "@app/components/common/Messages";
import { F2Market } from "@app/types";
import Link from "@app/components/common/Link";
import { useState } from "react";
import { zapperRefresh } from "@app/util/f2";
import { Stack, VStack } from "@chakra-ui/react";
import { useWeb3React } from "@app/util/wallet";
 ;
import useStorage from "@app/hooks/useStorage";
import { BURN_ADDRESS } from "@app/config/constants";
import { timeSince } from "@app/util/time";

export const RewardsContainer = ({
    escrow,
    claimables,
    totalRewardsUSD,
    label = 'Rewards',
    showMarketBtn = false,
    extraAtBottom = false,
    defaultCollapse = undefined,
    market,
    timestamp,
    extra,
    extraRewards,
}: {
    escrow: string,
    claimables: any,
    totalRewardsUSD: number,
    timestamp: number,
    label?: string
    showMarketBtn?: boolean
    extraAtBottom?: boolean
    defaultCollapse?: boolean
    market: F2Market
    extra?: any
    extraRewards?: string[]
}) => {
    const { account, provider } = useWeb3React();
    const [hasJustClaimed, setHasJustClaimed] = useState(false);
    const { value: lastClaim, setter: setLastClaim } = useStorage(`just-claimed-${account}-${market.name}`);
    const now = Date.now();
    const claimedNotLongAgo = !!lastClaim && ((now - lastClaim) < 300000);

    const handleClaim = async () => {
        if (!account) return;
        return claim(escrow, provider?.getSigner(), market.claimMethod, extraRewards);
    }

    const handleClaimSuccess = () => {
        setHasJustClaimed(true);
        setLastClaim(Date.now());
        if (!account) return;
        if (!!market.zapperAppGroup) {
            zapperRefresh(account);
        }
    }

    return <Container
        label={label}
        description={timestamp ? `Last update: ${timeSince(timestamp)}` : undefined}
        noPadding
        p='0'
        collapsable={true}
        defaultCollapse={defaultCollapse ?? !totalRewardsUSD}
        right={showMarketBtn ? <Link textDecoration='underline' href={`/firm/${market.name}`}>
            Go to market
        </Link> : undefined}
    >
        <Stack w='full' direction={{ base: 'column', md: 'row' }} spacing={{ base: '4', md: '2' }} justify="space-between">
            {
                hasJustClaimed || claimedNotLongAgo ?
                    <SuccessMessage alertProps={{ fontSize: '18px', fontWeight: 'bold', w: { base: 'full', sm: 'auto' } }} iconProps={{ height: 50, width: 50 }} description="Rewards claimed!" />
                    :
                    (totalRewardsUSD > 0.1 || !!claimables?.find(c => !c.price && c.balance > 0)) ?
                        <VStack alignItems="flex-start" w='full'>
                            <ZapperTokens
                                showMarketBtn={showMarketBtn}
                                market={market}
                                claimables={claimables}
                                totalRewardsUSD={totalRewardsUSD}
                                handleClaim={handleClaim}
                                onSuccess={handleClaimSuccess}
                            />
                            {extraAtBottom && extra}
                        </VStack>
                        :
                        <InfoMessage
                            description={
                                !escrow || escrow === BURN_ADDRESS ? `This market has rewards but you don't have a position in it.` : "This market has rewards but you don't have any at the moment, it will show if you have at least $0.1 worth of rewards."
                            }
                        />
            }
            {!extraAtBottom && extra}
        </Stack>
    </Container>
}