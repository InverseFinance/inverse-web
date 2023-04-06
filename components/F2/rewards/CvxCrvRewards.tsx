import Container from "@app/components/common/Container";
import { ZapperTokens } from "./ZapperTokens"
import { claim } from "@app/util/firm-extra";
import { JsonRpcSigner } from "@ethersproject/providers";
import { InfoMessage } from "@app/components/common/Messages";

export const CvxCrvRewards = ({
    escrow,
    signer,
    claimables,
    totalRewardsUSD,
}: {
    escrow: string,
    claimables: any,
    totalRewardsUSD: number,
    signer: JsonRpcSigner,
}) => {

    const handleClaim = async () => {
        return claim(escrow, signer);
    }

    return <Container label="Rewards" noPadding p='0' collapsable={true} defaultCollapse={!totalRewardsUSD}>
        {
            totalRewardsUSD > 0 ?
                <ZapperTokens claimables={claimables} totalRewardsUSD={totalRewardsUSD} handleClaim={handleClaim} />
                :
                <InfoMessage
                    description="This market has rewards but you don't have any at the moment"
                />
        }

    </Container>
}