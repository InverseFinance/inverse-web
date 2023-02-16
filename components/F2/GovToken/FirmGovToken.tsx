import Container from "@app/components/common/Container"
import { Stack, Text } from "@chakra-ui/react"
import { F2MarketContext } from "../F2Contex";
import { useContext } from "react";
import ScannerLink from "@app/components/common/ScannerLink";
import useEtherSWR from "@app/hooks/useEtherSWR";
import { F2_SIMPLE_ESCROW_ABI } from "@app/config/abis";

export const FirmGovToken = () => {
    const { market, escrow } = useContext(F2MarketContext);
    const { data } = useEtherSWR({
        args: [[escrow, 'delegatingTo']],
        abi: F2_SIMPLE_ESCROW_ABI,
    });
    const delegatingTo = data ? data[0] : '';    
    return <Container
        noPadding
        p="0"
        collapsable={true}
        defaultCollapse={true}
        label={`${market.underlying.symbol} Governance Rights`}
        description={`Governance tokens deposited in FiRM keep their voting power!`}
    >
        <Stack direction={{ base: 'column', md: 'row' }}>
            <Text>You are currently delegating to:</Text>
            {
                !!delegatingTo && <ScannerLink value={delegatingTo} useName={false} />
            }
        </Stack>
    </Container>
}