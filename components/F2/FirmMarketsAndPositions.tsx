import { useFirmPositions } from "@app/hooks/useFirm";
import { HStack, InputGroup, InputLeftElement, Select, Stack, useMediaQuery, VStack, Input as ChakraInput, Text } from "@chakra-ui/react"
import { SkeletonBlob } from "../common/Skeleton";
import { F2MarketsParams } from "./F2MarketsParams";
import { NavButtons } from "../common/Button";
import { useCallback, useState } from "react";
import { RadioCardGroup } from "../common/Input/RadioCardGroup";
import { SearchIcon } from "@chakra-ui/icons";
import { FirmMarketsStats, FirmPositions } from "./liquidations/firm-positions";
import { F2Market } from "@app/types";
import { shortenNumber } from "@app/util/markets";

export const FirmMarketsAndPositions = ({
    vnetPublicId,
    defaultTab = 'Positions',
    onlyShowDefaultTab = false,
    useAdminMarketsColumns = false
}: {
    vnetPublicId?: string,
    defaultTab?: 'Markets' | 'Positions' | 'Stats',
    onlyShowDefaultTab?: boolean,
    useAdminMarketsColumns?: boolean,
}) => {
    const { timestamp, positions, isLoading, markets } = useFirmPositions(vnetPublicId);
    return <FirmMarketsAndPositionsRenderer
        vnetPublicId={vnetPublicId}
        defaultTab={defaultTab}
        markets={markets}
        positions={positions}
        isLoading={isLoading}
        timestamp={timestamp}
        onlyShowDefaultTab={onlyShowDefaultTab}
        useAdminMarketsColumns={useAdminMarketsColumns}
    />
}

export const FirmMarketsAndPositionsRenderer = ({
    vnetPublicId,
    defaultTab = 'Positions',
    markets,
    positions,
    isLoading,
    timestamp,
    onlyShowDefaultTab = false,
    useAdminMarketsColumns = false,
    marketsDisplaysData,
}: {
    vnetPublicId?: string
    defaultTab?: 'Markets' | 'Positions' | 'Stats',
    markets: F2Market[],
    positions: any[],
    isLoading: boolean,
    timestamp: number,
    onlyShowDefaultTab?: boolean,
    useAdminMarketsColumns?: boolean
    marketsDisplaysData?: any
}) => {
    const [isSmallerThan] = useMediaQuery(`(max-width: 1260px)`);
    const [activeTab, setActiveTab] = useState(defaultTab);
    const [search, setSearch] = useState('');
    const [category, setCategory] = useState('all');

    const marketFilter = useCallback((m: any) => {
        let searchCondition = true;
        let categoryCondition = true;
        if (search) {
            searchCondition = m.name.toLowerCase().includes(search.toLowerCase());
        }
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
            categoryCondition = (m.underlying.isStable && !m.underlying.isLP) || m.isPendle;
        }
        else if (category === 'lps') {
            categoryCondition = m.underlying.isLP;
        }
        else if (category === 'non-stable') {
            categoryCondition = !m.underlying.isStable && !m.underlying.isLP;
        }

        return searchCondition && categoryCondition;
    }, [search, category]);

    const badDebt = positions?.filter(p => p.seizableWorth > p.depositsUsd).reduce((acc, p) => acc + p.debt, 0) || 0;

    return <VStack w='full'>
        <HStack alignItems="center" w='full' justify='space-between'>
            {
                !onlyShowDefaultTab && <NavButtons
                    maxW="400px"
                    options={['Markets', 'Positions', 'Stats']}
                    active={activeTab}
                    onClick={(s) => setActiveTab(s)}
                />
            }
            <Stack direction={{ base: 'column', md: 'row' }} justify="space-between" alignItems="center">
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
            <InputGroup
                left="0"
                w={{ base: '100%', md: '230px' }}
                bgColor="transparent"
            >
                <InputLeftElement
                    pointerEvents='none'
                    children={<SearchIcon color='gray.300' />}
                />
                <ChakraInput
                    color="mainTextColor"
                    borderRadius="20px"
                    type="search"
                    bgColor="containerContentBackgroundAlpha"
                    // w="200px"
                    placeholder="Search a market"
                    value={search}
                    onChange={(e) => {
                        setSearch(e.target.value)
                    }}
                />
            </InputGroup>
        </HStack>
        {
            isLoading ?
                <SkeletonBlob />
                :
                <VStack w='full'>
                    {
                        ((onlyShowDefaultTab && defaultTab === 'Markets') || !onlyShowDefaultTab) && <VStack w="full" display={activeTab === 'Markets' ? 'block' : 'none'}>
                            <F2MarketsParams
                                markets={
                                    markets?.filter(marketFilter)
                                }
                                isSimContext={!!vnetPublicId}
                                useAdminMarketsColumns={useAdminMarketsColumns}
                                marketsDisplaysData={marketsDisplaysData}
                            />
                        </VStack>
                    }
                    {
                        ((onlyShowDefaultTab && defaultTab === 'Positions') || !onlyShowDefaultTab) &&
                        <VStack w="full" display={activeTab === 'Positions' ? 'block' : 'none'}>
                            <FirmPositions
                                containerProps={{ description: '', noPadding: true, p: 0, right: badDebt > 0 &&<HStack>
                                    <Text>Bad debt:</Text>
                                    <Text>{shortenNumber(badDebt, 2)} DOLA</Text>
                                </HStack> }}
                                isLoading={isLoading} timestamp={timestamp} positions={positions?.filter(p => marketFilter(p.market))}
                            />
                        </VStack>
                    }
                    {
                        ((onlyShowDefaultTab && defaultTab === 'Stats') || !onlyShowDefaultTab) &&
                        <VStack pt='8' w="full" display={activeTab === 'Stats' ? 'block' : 'none'}>
                            <FirmMarketsStats positions={positions?.filter(p => marketFilter(p.market))} isLoading={isLoading} />
                        </VStack>
                    }
                </VStack>
        }
    </VStack>
}