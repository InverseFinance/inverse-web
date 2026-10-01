import Container from "@app/components/common/Container";
import { InfoMessage } from "@app/components/common/Messages";
import Link from "@app/components/common/Link";
import { F2Market } from "@app/types";
import { useAccount } from "@app/hooks/misc";
import { useMerklFirmRewards } from "@app/hooks/useMerkl";
import { getMerklUserUrl } from "@app/util/merkl";
import { shortenNumber } from "@app/util/markets";
import { preciseCommify } from "@app/util/misc";
import { Badge, Stack, StackProps, Tooltip, VStack } from "@chakra-ui/react";
import { ExternalLinkIcon } from "@chakra-ui/icons";
import { ZapperTokens } from "./ZapperTokens";

const MerklRewardsBadge = ({ apr, label, tooltip }: { apr: number, label: string, tooltip: string }) => {
    return <Tooltip hasArrow label={tooltip}>
        <Badge
            fontWeight="normal"
            textTransform="none"
            borderRadius="50px"
            px="8px"
            cursor="default"
            bgColor="accentTextColor"
            color="contrastMainTextColor"
        >
            {shortenNumber(apr, 2)}% {label}
        </Badge>
    </Tooltip>
}

// Merkl incentives are shown apart from the collateral yield
export const MerklRewardsBadges = ({
    merklApy = 0,
    merklBorrowApr = 0,
    ...props
}: {
    merklApy?: number
    merklBorrowApr?: number
} & StackProps) => {
    if (!(merklApy > 0) && !(merklBorrowApr > 0)) {
        return null;
    }
    return <Stack spacing="1" {...props}>
        {
            merklBorrowApr > 0 && <MerklRewardsBadge
                apr={merklBorrowApr}
                label="Merkl borrow rewards"
                tooltip="APR on the DOLA borrowed in this market, distributed by Merkl and claimable on the Merkl app"
            />
        }
        {
            merklApy > 0 && <MerklRewardsBadge
                apr={merklApy}
                label="Merkl rewards"
                tooltip="APR on the collateral deposited in this market, distributed by Merkl and claimable on the Merkl app"
            />
        }
    </Stack>
}

// FiRM incentives distributed by Merkl, the rewards are claimed on the Merkl app
export const FirmMerklRewards = ({ market }: { market: F2Market }) => {
    const account = useAccount();
    const { claimables, isLoading, error } = useMerklFirmRewards(market.hasMerklRewards ? account : undefined);

    if (!market.hasMerklRewards || !account || isLoading) {
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
            <MerklRewardsBadges merklApy={market.merklApy} merklBorrowApr={market.merklBorrowApr} direction="row" />
            {
                withBalance.length > 0 ?
                    <ZapperTokens
                        market={market}
                        claimables={withBalance}
                        totalRewardsUSD={totalRewardsUSD}
                        claimLink={merklUrl}
                    />
                    : <InfoMessage description={
                        error ?
                            "Your Merkl rewards could not be loaded at the moment, you can check them on the Merkl app."
                            : "This market has Merkl rewards but you don't have any to claim at the moment."
                    } />
            }
            {
                withPending.length > 0 && <InfoMessage
                    description={`Claimable after the next Merkl update: ${withPending.map(c => `${shortenNumber(c.pending, 2)} ${c.symbol}${c.price ? ` (${preciseCommify(c.pendingUSD, 2, true)})` : ''}`).join(', ')}`}
                />
            }
        </VStack>
    </Container>
}
