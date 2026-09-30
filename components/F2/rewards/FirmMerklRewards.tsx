import Container from "@app/components/common/Container";
import { InfoMessage } from "@app/components/common/Messages";
import Link from "@app/components/common/Link";
import { F2Market } from "@app/types";
import { useAccount } from "@app/hooks/misc";
import { useMerklFirmRewards } from "@app/hooks/useMerkl";
import { getMerklUserUrl } from "@app/util/merkl";
import { shortenNumber } from "@app/util/markets";
import { preciseCommify } from "@app/util/misc";
import { VStack } from "@chakra-ui/react";
import { ExternalLinkIcon } from "@chakra-ui/icons";
import { ZapperTokens } from "./ZapperTokens";

// FiRM incentives distributed by Merkl, the rewards are claimed on the Merkl app
export const FirmMerklRewards = ({ market }: { market: F2Market }) => {
    const account = useAccount();
    const { claimables, isLoading } = useMerklFirmRewards(account);

    // no active incentive for this market and nothing to claim
    if (!account || isLoading || (!market.hasMerklRewards && !claimables.length)) {
        return <></>
    }

    const merklUrl = getMerklUserUrl(account);
    const withBalance = claimables.filter(c => c.balance > 0);
    const withPending = claimables.filter(c => c.pending > 0);
    const totalRewardsUSD = withBalance.reduce((prev, curr) => prev + curr.balanceUSD, 0);

    return <Container
        label="Merkl Rewards"
        description="Your rewards from FiRM incentives distributed by Merkl, claimable on the Merkl app"
        noPadding
        p='0'
        collapsable={true}
        defaultCollapse={false}
        right={
            <Link textDecoration="underline" isExternal={true} target="_blank" href={merklUrl}>
                View on Merkl <ExternalLinkIcon />
            </Link>
        }
    >
        <VStack w='full' alignItems="flex-start" spacing="4">
            {
                withBalance.length > 0 ?
                    <ZapperTokens
                        market={market}
                        claimables={withBalance}
                        totalRewardsUSD={totalRewardsUSD}
                        claimLink={merklUrl}
                    />
                    : <InfoMessage description="This market has Merkl rewards but you don't have any to claim at the moment." />
            }
            {
                withPending.length > 0 && <InfoMessage
                    description={`Claimable after the next Merkl update: ${withPending.map(c => `${shortenNumber(c.pending, 2)} ${c.symbol}${c.price ? ` (${preciseCommify(c.pendingUSD, 2, true)})` : ''}`).join(', ')}`}
                />
            }
        </VStack>
    </Container>
}
