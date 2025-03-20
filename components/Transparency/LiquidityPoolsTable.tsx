import { Flex, Stack, Text, Image, HStack } from "@chakra-ui/react"
import Table from "../common/Table"
import { preciseCommify } from "@app/util/misc"
import { shortenNumber } from "@app/util/markets"
import Container from "../common/Container"
import { UnderlyingItem } from "../common/Assets/UnderlyingItem"
import { PROTOCOL_IMAGES } from "@app/variables/images"
import { NETWORKS_BY_CHAIN_ID } from "@app/config/networks"
import { RadioCardGroup } from "../common/Input/RadioCardGroup"
import { useEffect, useState } from "react"
import moment from "moment"
import { SkeletonBlob } from "../common/Skeleton"
import Link from "../common/Link"
import { ExternalLinkIcon } from "@chakra-ui/icons"
import { getLpLink } from "@app/variables/tokens"
import { FEATURE_FLAGS } from "@app/config/features"

const ColHeader = ({ ...props }) => {
    return <Flex justify="flex-start" minWidth={'150px'} fontSize="12px" fontWeight="extrabold" {...props} />
}

const Cell = ({ ...props }) => {
    return <Stack cursor="default" direction="row" fontSize="12px" fontWeight="normal" justify="flex-start" minWidth="150px" {...props} />
}

const CellText = ({ ...props }) => {
    return <Text fontSize="12px" {...props} />
}

const ClickableCellText = ({ ...props }) => {
    return <CellText
        textDecoration="underline"
        cursor="pointer"
        style={{ 'text-decoration-skip-ink': 'none' }}
        {...props}
    />
}

const FilterItem = ({ ...props }) => {
    return <HStack fontSize="14px" fontWeight="normal" justify="flex-start" {...props} />
}

const noPropagation = (e: React.MouseEvent<HTMLElement>) => e.stopPropagation();

export const LP_COLS = [
    {
        field: 'lpName',
        label: 'Pool',
        showFilter: true,
        filterWidth: '140px',
        filterItemRenderer: ({ lpName }) => <FilterItem>
            <Text>{lpName}</Text>
        </FilterItem>,
        header: ({ ...props }) => <ColHeader minWidth="150px" justify="flex-start"  {...props} />,
        value: (lp) => {
            const link = getLpLink(lp);
            if (!link) {
                return <Cell onClick={noPropagation} minWidth='150px' spacing="2" justify="flex-start" alignItems="center" direction="row">
                    <UnderlyingItem textProps={{ fontSize: '12px', ml: '2', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', maxWidth: '90px' }} imgSize={15} {...lp} label={lp.lpName} showAsLp={true} chainId={lp.chainId} />
                </Cell>
            }
            return <Cell onClick={noPropagation} minWidth='150px' spacing="2" justify="flex-start" alignItems="center" direction="row">
                <Link textDecoration="underline" href={link} isExternal target="_blank" display="flex" justify="flex-start" alignItems="center" direction="row">
                    <UnderlyingItem textProps={{ fontSize: '12px', ml: '2', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', maxWidth: '90px' }} imgSize={15} {...lp} label={lp.lpName} showAsLp={true} chainId={lp.chainId} />
                    <ExternalLinkIcon color="info" ml="1" />
                </Link>
            </Cell>
        },
    },
    {
        field: 'protocol',
        label: 'Protocol',
        showFilter: true,
        filterWidth: '70px',
        filterItemRenderer: ({ protocol }) => <FilterItem>
            <Image src={PROTOCOL_IMAGES[protocol]} h='20px' w='20px' borderRadius="50px" title={protocol} />
            <Text>{protocol}</Text>
        </FilterItem>,
        header: ({ ...props }) => <ColHeader minWidth="80px" justify="center"  {...props} />,
        value: ({ protocol, protocolImage }) => {
            return <Cell onClick={noPropagation} minWidth='80px' spacing="2" justify="center" alignItems="center" direction="row">
                <Image src={protocolImage} h='20px' w='20px' borderRadius="50px" title={protocol} />
            </Cell>
        },
    },
    {
        field: 'chainId',
        label: 'Chain',
        showFilter: true,
        filterWidth: '70px',
        filterItemRenderer: ({ chainId }) => <FilterItem>
            <Image src={NETWORKS_BY_CHAIN_ID[chainId].image} h='20px' w='20px' borderRadius="50px" title={NETWORKS_BY_CHAIN_ID[chainId].name} />
            <Text>{NETWORKS_BY_CHAIN_ID[chainId].name}</Text>
        </FilterItem>,
        header: ({ ...props }) => <ColHeader minWidth="80px" justify="center"  {...props} />,
        value: ({ chainId, networkName }) => {
            const net = NETWORKS_BY_CHAIN_ID[chainId];
            return <Cell onClick={noPropagation} minWidth='80px' spacing="2" justify="center" alignItems="center" direction="row">
                <Image src={net.image} ignoreFallback={true} title={net.name} alt={net.name} w={5} h={5} mr="2" />
            </Cell>
        },
    },
    {
        field: 'isFed',
        label: 'Has Fed?',
        showFilter: true,
        filterWidth: '70px',
        header: ({ ...props }) => <ColHeader minWidth="70px" justify="center"  {...props} />,
        value: ({ isFed }) => {
            return <Cell onClick={noPropagation} minWidth='70px' spacing="2" justify="center" alignItems="center" direction="row">
                <CellText fontWeight={isFed ? 'bold' : 'normal'}>{isFed ? 'Yes' : 'No'}</CellText>
            </Cell>
        },
    },
    {
        field: 'tvl',
        label: 'TVL',
        header: ({ ...props }) => <ColHeader minWidth="80px" justify="flex-end"  {...props} />,
        value: ({ tvl }) => {
            return <Cell minWidth="80px" justify="flex-end" fontSize="15px">
                <ClickableCellText>{preciseCommify(tvl, 0, true)}</ClickableCellText>
            </Cell>
        },
    },
    {
        field: 'pairingDepth',
        label: 'Pairing Depth',
        header: ({ ...props }) => <ColHeader minWidth="100px" justify="flex-end"  {...props} />,
        value: ({ pairingDepth }) => {
            return <Cell minWidth="100px" justify="flex-end" fontSize="15px">
                <ClickableCellText>{preciseCommify(pairingDepth || 0, 0, true)}</ClickableCellText>
            </Cell>
        },
    },
    {
        field: 'dolaBalance',
        label: 'DOLA Balance',
        header: ({ ...props }) => <ColHeader minWidth="100px" justify="flex-end"  {...props} />,
        value: ({ dolaBalance }) => {
            return <Cell minWidth="100px" justify="flex-end" fontSize="15px">
                <ClickableCellText>{preciseCommify(dolaBalance || 0, 0, true)}</ClickableCellText>
            </Cell>
        },
    },
    {
        field: 'dolaWeight',
        label: 'DOLA Weight',
        header: ({ ...props }) => <ColHeader minWidth="90px" justify="flex-end"  {...props} />,
        value: ({ dolaWeight }) => {
            return <Cell minWidth="90px" justify="flex-end" fontSize="15px">
                <ClickableCellText>{shortenNumber(dolaWeight || 0, 2)}%</ClickableCellText>
            </Cell>
        },
    },
    {
        field: 'apy',
        label: 'APY',
        header: ({ ...props }) => <ColHeader minWidth="60px" justify="flex-end"  {...props} />,
        value: ({ apy }) => {
            return <Cell minWidth="60px" justify="flex-end" fontSize="15px">
                <ClickableCellText>{typeof apy === 'undefined' ? '-' : `${shortenNumber(apy || 0, 2)}%`}</ClickableCellText>
            </Cell>
        },
    }
    , {
        field: 'perc',
        label: 'Pool Dom',
        header: ({ ...props }) => <ColHeader minWidth="70px" justify="flex-end"  {...props} />,
        value: ({ perc }) => {
            return <Cell minWidth="70px" justify="flex-end" fontSize="15px">
                <ClickableCellText>{shortenNumber(perc, 2)}%</ClickableCellText>
            </Cell>
        },
    }
    , {
        field: 'ownedAmount',
        label: 'PoL',
        header: ({ ...props }) => <ColHeader minWidth="80px" justify="flex-end"  {...props} />,
        value: ({ ownedAmount }) => {
            return <Cell minWidth="80px" justify="flex-end" fontSize="15px">
                <ClickableCellText>{preciseCommify(ownedAmount, 0, true)}</ClickableCellText>
            </Cell>
        },
    }
    , {
        field: 'rewardDay',
        label: '$/day',
        header: ({ ...props }) => <ColHeader minWidth="70px" justify="flex-end"  {...props} />,
        value: ({ rewardDay }) => {
            return <Cell minWidth="70px" justify="flex-end" fontSize="15px">
                <ClickableCellText>{preciseCommify(rewardDay, 0, true)}</ClickableCellText>
            </Cell>
        },
    }
];
if (FEATURE_FLAGS.lpZaps) {
    LP_COLS.push({
        field: 'hasEnso',
        label: 'Zap',
        header: ({ ...props }) => <ColHeader minWidth="50px" justify="flex-end" {...props} />,
        value: ({ hasEnso }) => <Cell minWidth="50px" justify="flex-end" cursor="pointer" _hover={{ filter: 'brightness(1.1)' }}>
            {hasEnso && <Image src="/assets/zap.png" h="20px" w="20px" />}
        </Cell>,
    });
}

export const LiquidityPoolsTable = ({
    items,
    timestamp,
    onRowClick,
}: {
    items: any[],
    timestamp: number,
    onRowClick: (item: any) => void,
}) => {
    const [category, setCategory] = useState('stable');
    const [filtered, setFiltered] = useState(items);

    useEffect(() => {
        if (category === 'all') {
            setFiltered(items);
        } else {
            const regEx = new RegExp(category, 'i');
            if (['volatile', 'stable'].includes(category)) {
                setFiltered(
                    items.filter(item => category === 'stable' ? item.isStable : !item.isStable)
                );
            } else {
                setFiltered(items.filter(o => regEx.test(o.lpName)));
            }
        }
    }, [items, category]);

    return <Container
        noPadding
        p="0"
        label="Liquidity Pools Details"
        description={`Last update: ${timestamp ? timeSince(timestamp) : ''}`}
        contentProps={{
            direction: 'column',
            overflowX: 'scroll',
        }}
        headerProps={{
            direction: { base: 'column', md: 'row' },
            align: { base: 'flex-start', md: 'flex-end' },
        }}
        right={
            <RadioCardGroup
                wrapperProps={{ mt: { base: '2' }, overflow: 'auto', maxW: '90vw' }}
                group={{
                    name: 'category',
                    defaultValue: category,
                    onChange: (v) => { setCategory(v) },
                }}
                radioCardProps={{
                    w: 'fit-content',
                    textAlign: 'center',
                    px: { base: '2', md: '3' },
                    py: '1',
                    fontSize: '12px',
                    whiteSpace: 'nowrap'
                }}
                options={[
                    { label: 'All', value: 'all' },
                    { label: 'Stable', value: 'stable' },
                    { label: 'Volatile', value: 'volatile' },
                    { label: 'INV', value: 'inv' },
                    { label: 'DOLA', value: 'dola' },
                    { label: 'DBR', value: 'dbr' },
                    { label: 'sDOLA', value: 'sDOLA' },
                ]}
            />
        }
    >
        {
            !items.length ? <SkeletonBlob /> :
                <Table
                    key="address"
                    columns={LP_COLS}
                    items={filtered}
                    defaultSort="tvl"
                    defaultSortDir="desc"
                    onClick={onRowClick}
                />
        }
    </Container>
}