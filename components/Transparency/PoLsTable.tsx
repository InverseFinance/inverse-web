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

const ColHeader = ({ ...props }) => {
    return <Flex justify="flex-start" minWidth={'150px'} fontSize="12px" fontWeight="extrabold" {...props} />
}

const Cell = ({ ...props }) => {
    return <Stack direction="row" fontSize="12px" fontWeight="normal" justify="flex-start" minWidth="150px" {...props} />
}

const CellText = ({ ...props }) => {
    return <Text fontSize="12px" {...props} />
}

const FilterItem = ({ ...props }) => {
    return <HStack fontSize="14px" fontWeight="normal" justify="flex-start" {...props} />
}

const columns = [
    {
        field: 'lpName',
        label: 'Pool',
        showFilter: true,
        filterWidth: '170px',
        filterItemRenderer: ({ lpName }) => <FilterItem>
            <Text>{lpName}</Text>
        </FilterItem>,
        header: ({ ...props }) => <ColHeader minWidth="180px" justify="flex-start"  {...props} />,
        value: (lp) => {
            return <Cell minWidth='180px' spacing="2" justify="flex-start" alignItems="center" direction="row">
                <UnderlyingItem {...lp} label={lp.lpName} showAsLp={true} chainId={lp.chainId} />
            </Cell>
        },
    },
    {
        field: 'protocol',
        label: 'Protocol',
        showFilter: true,
        filterWidth: '80px',
        filterItemRenderer: ({ protocol }) => <FilterItem>
            <Image src={PROTOCOL_IMAGES[protocol]} h='20px' w='20px' borderRadius="50px" title={protocol} />
            <Text>{protocol}</Text>
        </FilterItem>,
        header: ({ ...props }) => <ColHeader minWidth="90px" justify="center"  {...props} />,
        value: ({ protocol, protocolImage }) => {
            return <Cell minWidth='90px' spacing="2" justify="center" alignItems="center" direction="row">
                <Image src={protocolImage} h='20px' w='20px' borderRadius="50px" title={protocol} />
            </Cell>
        },
    },
    {
        field: 'chainId',
        label: 'Chain',
        showFilter: true,
        filterWidth: '80px',
        filterItemRenderer: ({ chainId }) => <FilterItem>
            <Image src={NETWORKS_BY_CHAIN_ID[chainId].image} h='20px' w='20px' borderRadius="50px" title={NETWORKS_BY_CHAIN_ID[chainId].name} />
            <Text>{NETWORKS_BY_CHAIN_ID[chainId].name}</Text>
        </FilterItem>,
        header: ({ ...props }) => <ColHeader minWidth="90px" justify="center"  {...props} />,
        value: ({ chainId, networkName }) => {
            const net = NETWORKS_BY_CHAIN_ID[chainId];
            return <Cell minWidth='90px' spacing="2" justify="center" alignItems="center" direction="row">
                <Image src={net.image} ignoreFallback={true} title={net.name} alt={net.name} w={5} h={5} mr="2" />
            </Cell>
        },
    },
    {
        field: 'tvl',
        label: 'TVL',
        header: ({ ...props }) => <ColHeader minWidth="90px" justify="flex-end"  {...props} />,
        value: ({ tvl }) => {
            return <Cell minWidth="90px" justify="flex-end" fontSize="15px">
                <CellText>{preciseCommify(tvl, 0, true)}</CellText>
            </Cell>
        },
    },
    {
        field: 'pairingDepth',
        label: 'Pairing Depth',
        header: ({ ...props }) => <ColHeader minWidth="110px" justify="flex-end"  {...props} />,
        value: ({ pairingDepth }) => {
            return <Cell minWidth="110px" justify="flex-end" fontSize="15px">
                <CellText>{preciseCommify(pairingDepth || 0, 0, true)}</CellText>
            </Cell>
        },
    },
    {
        field: 'dolaBalance',
        label: 'DOLA Balance',
        header: ({ ...props }) => <ColHeader minWidth="110px" justify="flex-end"  {...props} />,
        value: ({ dolaBalance }) => {
            return <Cell minWidth="110px" justify="flex-end" fontSize="15px">
                <CellText>{preciseCommify(dolaBalance || 0, 0, true)}</CellText>
            </Cell>
        },
    },
    {
        field: 'dolaWeight',
        label: 'DOLA Weight',
        header: ({ ...props }) => <ColHeader minWidth="110px" justify="flex-end"  {...props} />,
        value: ({ dolaWeight }) => {
            return <Cell minWidth="110px" justify="flex-end" fontSize="15px">
                <CellText>{shortenNumber(dolaWeight || 0, 2)}%</CellText>
            </Cell>
        },
    },
    {
        field: 'apy',
        label: 'APY',
        header: ({ ...props }) => <ColHeader minWidth="70px" justify="flex-end"  {...props} />,
        value: ({ apy }) => {
            return <Cell minWidth="70px" justify="flex-end" fontSize="15px">
                <CellText>{typeof apy === 'undefined' ? '-' : `${shortenNumber(apy || 0, 2)}%`}</CellText>
            </Cell>
        },
    }
    , {
        field: 'polDom',
        label: 'Pool Dom',
        header: ({ ...props }) => <ColHeader minWidth="70px" justify="flex-end"  {...props} />,
        value: ({ polDom }) => {
            return <Cell minWidth="70px" justify="flex-end" fontSize="15px">
                <CellText>{shortenNumber(polDom, 2)}%</CellText>
            </Cell>
        },
    }
    , {
        field: 'pol',
        label: 'PoL',
        header: ({ ...props }) => <ColHeader minWidth="100px" justify="flex-end"  {...props} />,
        value: ({ pol }) => {
            return <Cell minWidth="100px" justify="flex-end" fontSize="15px">
                <CellText>{preciseCommify(pol, 0, true)}</CellText>
            </Cell>
        },
    }
    , {
        field: 'rewardDay',
        label: '$/day',
        header: ({ ...props }) => <ColHeader minWidth="90px" justify="flex-end"  {...props} />,
        value: ({ rewardDay }) => {
            return <Cell minWidth="90px" justify="flex-end" fontSize="15px">
                <CellText>{preciseCommify(rewardDay, 2, true)}</CellText>
            </Cell>
        },
    }
];

export const PoLsTable = ({
    items,
    timestamp,
}: {
    items: any[],
    timestamp: number,
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
        description={`Last update: ${timestamp ? moment(timestamp).fromNow() : ''}`}
        contentProps={{
            direction: 'column',
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
                ]}
            />
        }
    >
        {
            !items.length ? <SkeletonBlob /> :
                <Table
                    key="address"
                    columns={columns}
                    items={filtered}
                    defaultSort="tvl"
                    defaultSortDir="desc"
                />
        }
    </Container>
}