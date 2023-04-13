import Container from "@app/components/common/Container";
import { ZapperTokens } from "./ZapperTokens"
import { claim } from "@app/util/firm-extra";
import { JsonRpcSigner } from "@ethersproject/providers";
import { InfoMessage } from "@app/components/common/Messages";
import { F2Market } from "@app/types";
import Link from "@app/components/common/Link";

export const CvxCrvRewards = ({
    escrow,
    signer,
    claimables,
    totalRewardsUSD,
    label = 'Rewards',
    showMarketBtn = false,
    defaultCollapse = undefined,
    market,
}: {
    escrow: string,
    claimables: any,
    totalRewardsUSD: number,
    signer: JsonRpcSigner,
    label?: string
    showMarketBtn?: boolean
    defaultCollapse?: boolean
    market: F2Market
}) => {

    const handleClaim = async () => {
        return claim(escrow, signer);
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
        {
            totalRewardsUSD > 0 ?
                <ZapperTokens showMarketBtn={showMarketBtn} market={market} claimables={claimables} totalRewardsUSD={totalRewardsUSD} handleClaim={handleClaim} />
                :
                <InfoMessage
                    description="This market has rewards but you don't have any at the moment"
                />
        }
    </Container>
}