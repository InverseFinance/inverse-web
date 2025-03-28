import { useFirmPositions } from "@app/hooks/useFirm";
import { HStack, Select, Stack, useMediaQuery, VStack } from "@chakra-ui/react"
import { FirmPositionsTable } from "./Infos/FirmPositionsTable";
import { SkeletonBlob } from "../common/Skeleton";
import { F2MarketsParams } from "./F2MarketsParams";
import { NavButtons } from "../common/Button";
import { useCallback, useState } from "react";
import { FirmPositions } from "./liquidations/firm-positions";
import Container from "../common/Container";
import { RadioCardGroup } from "../common/Input/RadioCardGroup";

export const FirmMarketsAndPositions = ({
    vnetPublicId,
    defaultTab = 'Markets'
}: {
    vnetPublicId?: string
    defaultTab?: 'Markets' | 'Positions'
}) => {
    const [isSmallerThan] = useMediaQuery(`(max-width: 1260px)`);
    const [activeTab, setActiveTab] = useState(defaultTab);
    const { positions, isLoading, markets } = useFirmPositions(vnetPublicId);

    const [category, setCategory] = useState('all');

    const marketFilter = useCallback((m: any) => {
        let searchCondition = true;
        let categoryCondition = true;
        if (category === 'majors') {
            categoryCondition = /(btc|eth)/i.test(m.name);
        }
        else if (category === 'active') {
            categoryCondition = !m.borrowPaused && !m.isPhasingOut;
        }
        else if (category === 'paused') {
            categoryCondition = m.borrowPaused;
        }
        else if (category === 'phaseout') {
            categoryCondition = m.isPhasingOut;
        }
        else if (category === 'stablecoins') {
            categoryCondition = m.underlying.isStable && !m.underlying.isLP;
        }
        else if (category === 'lps') {
            categoryCondition = m.underlying.isLP;
        }
        else if (category === 'non-stable') {
            categoryCondition = !m.underlying.isStable && !m.underlying.isLP;
        }

        return searchCondition && categoryCondition;
    }, [category]);

    return <VStack w='full'>
        <HStack w='full' justify='space-between'>
            <NavButtons
                maxW="400px"
                options={['Markets', 'Positions']}
                active={activeTab}
                onClick={(s) => setActiveTab(s)}
            />
            <Stack direction={{ base: 'column', md: 'row' }} pt="2" justify="space-between" alignItems="center">
                {
                    isSmallerThan ? <Select
                        bgColor="containerContentBackgroundAlpha"
                        borderRadius="20px"
                        onChange={(e) => { setCategory(e.target.value) }}>
                        <option value="all">All</option>
                        <option value="active">Active</option>
                        <option value="paused">Paused</option>
                        <option value="phaseout">PhaseOut</option>
                        <option value="majors">BTC/ETH</option>
                        <option value="stablecoins">Stablecoins</option>
                        <option value="lps">Stable LPs</option>
                        <option value="non-stable">Non-Stable</option>
                    </Select> : <RadioCardGroup
                        wrapperProps={{ overflow: 'auto', maxW: '90vw', alignItems: 'center' }}
                        group={{
                            name: 'bool',
                            defaultValue: category,
                            onChange: (v) => { setCategory(v) },
                        }}
                        radioCardProps={{
                            color: "mainTextColor",
                            w: 'fit-content',
                            textAlign: 'center',
                            px: { base: '2', md: '3' },
                            py: '1',
                            fontSize: '14px',
                            whiteSpace: 'nowrap'
                        }}
                        options={[
                            { label: 'All', value: 'all' },
                            { label: 'BTC/ETH', value: 'majors' },
                            { label: 'Stablecoins', value: 'stablecoins' },
                            { label: 'Stable LPs', value: 'lps' },
                            { label: 'Non-Stable', value: 'non-stable' },
                        ]}
                    />
                }
            </Stack>
        </HStack>
        {
            isLoading ?
                <SkeletonBlob />
                :
                <VStack w='full'>
                    <VStack w="full" display={activeTab === 'Markets' ? 'block' : 'none'}>
                        <F2MarketsParams markets={
                            markets.filter(marketFilter)
                        }
                        />
                    </VStack>
                    <VStack w="full" display={activeTab === 'Positions' ? 'block' : 'none'}>
                        {
                            vnetPublicId ?
                                <Container
                                    noPadding p="0"
                                    label="">
                                    <FirmPositionsTable positions={positions.filter(p => marketFilter(p.market))} />
                                </Container>
                                : <FirmPositions vnetPublicId={vnetPublicId} />
                        }
                    </VStack>
                </VStack>
        }
    </VStack>
}