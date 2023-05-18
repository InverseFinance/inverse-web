import Container from "@app/components/common/Container";
import { ZapperTokens } from "./ZapperTokens"
import { claim } from "@app/util/firm-extra";
import { InfoMessage, SuccessMessage } from "@app/components/common/Messages";
import { F2Market } from "@app/types";
import Link from "@app/components/common/Link";
import { useState } from "react";
import { zapperRefresh } from "@app/util/f2";
import { Stack } from "@chakra-ui/react";
import { useWeb3React } from "@web3-react/core";

export const RewardsContainer = ({
    escrow,
    claimables,
    totalRewardsUSD,
    label = 'Rewards',
    showMarketBtn = false,
    defaultCollapse = undefined,
    market,
    extra,
}: {
    escrow: string,
    claimables: any,
    totalRewardsUSD: number,
    label?: string
    showMarketBtn?: boolean
    defaultCollapse?: boolean
    market: F2Market
    extra?: any
}) => {
    const { account, library } = useWeb3React();    
    const [hasJustClaimed, setHasJustClaimed] = useState(false);

    const handleClaim = async () => {
        if (!account) return;
        return claim(escrow, library?.getSigner(), market.claimMethod);
    }

    const handleClaimSuccess = () => {
        setHasJustClaimed(true);
        if (!account) return;
        if (!!market.zapperAppGroup) {
            zapperRefresh(account);
        }
    }

    return <Container
        label={label}
        noPadding
        p='0'
        collapsable={true}        
        defaultCollapse={defaultCollapse ?? !totalRewardsUSD}
        right={showMarketBtn ? <Link textDecoration='underline' href={`/firm/${market.name}`}>
            Go to market
        </Link> : undefined}
    >
        <Stack w='full' direction={{ base: 'column', md: 'row' }} spacing={{ base: '4', md:'2' }}>
            {
                hasJustClaimed ?
                    <SuccessMessage description="Rewards claimed!" />
                    :
                    totalRewardsUSD > 0.1 ?
                        <ZapperTokens
                            showMarketBtn={showMarketBtn}
                            market={market}
                            claimables={claimables}
                            totalRewardsUSD={totalRewardsUSD}
                            handleClaim={handleClaim}
                            onSuccess={handleClaimSuccess}
                        />
                        :
                        <InfoMessage
                            description="This market has rewards but you don't have any at the moment, it will show if you have at least $0.1 worth of rewards."
                        />
            }
            {extra}
        </Stack>
    </Container>
}