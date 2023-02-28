import { Flex, Stack, Text } from "@chakra-ui/react"
import Table from "../common/Table"
import { preciseCommify } from "@app/util/misc"
import { shortenNumber } from "@app/util/markets"
import Container from "../common/Container"

const ColHeader = ({ ...props }) => {
    return <Flex justify="flex-start" minWidth={'150px'} fontSize="14px" fontWeight="extrabold" {...props} />
}

const Cell = ({ ...props }) => {
    return <Stack direction="row" fontSize="14px" fontWeight="normal" justify="flex-start" minWidth="150px" {...props} />
}

const CellText = ({ ...props }) => {
    return <Text fontSize="15px" {...props} />
}

const columns = [
    {
        field: 'name',
        label: 'Pool',
        header: ({ ...props }) => <ColHeader minWidth="200px" justify="flex-start"  {...props} />,
        value: ({ name }) => {
            return <Cell minWidth='200px' spacing="1" justify="center" alignItems={{ base: 'center', md: 'flex-start' }} direction={{ base: 'row', md: 'column' }}>
                <CellText>{name}</CellText>
            </Cell>
        },
    },
    {
        field: 'tvl',
        label: 'TVL',        
        header: ({ ...props }) => <ColHeader minWidth="150px" justify="center"  {...props} />,
        value: ({ tvl }) => {
            return <Cell minWidth="150px" justify="flex-end" fontSize="15px">
                <CellText>{preciseCommify(tvl, 2, true)}</CellText>
            </Cell>
        },
    },
    {
        field: 'pairingDepth',
        label: 'Pairing Depth',        
        header: ({ ...props }) => <ColHeader minWidth="150px" justify="center"  {...props} />,
        value: ({ pairingDepth }) => {
            return <Cell minWidth="150px" justify="flex-end" fontSize="15px">
                <CellText>{preciseCommify(pairingDepth||0, 2, true)}</CellText>
            </Cell>
        },
    },
    {
        field: 'dolaBalance',
        label: 'DOLA Balance',        
        header: ({ ...props }) => <ColHeader minWidth="150px" justify="center"  {...props} />,
        value: ({ dolaBalance }) => {
            return <Cell minWidth="150px" justify="flex-end" fontSize="15px">
                <CellText>{preciseCommify(dolaBalance||0, 2, true)}</CellText>
            </Cell>
        },
    },
    {
        field: 'dolaWeight',
        label: 'DOLA Weight',        
        header: ({ ...props }) => <ColHeader minWidth="90px" justify="center"  {...props} />,
        value: ({ dolaWeight }) => {
            return <Cell minWidth="90px" justify="flex-end" fontSize="15px">
                <CellText>{shortenNumber(dolaWeight||0, 2)}%</CellText>
            </Cell>
        },
    }
    , {
        field: 'pol',
        label: 'PoL',
        header: ({ ...props }) => <ColHeader minWidth="150px" justify="center"  {...props} />,
        value: ({ pol }) => {
            return <Cell minWidth="150px" justify="flex-end" fontSize="15px">
                <CellText>{preciseCommify(pol, 2, true)}</CellText>
            </Cell>
        },
    }
    , {
        field: 'polDom',
        label: 'Pool Dom',        
        header: ({ ...props }) => <ColHeader minWidth="90px" justify="flex-end"  {...props} />,
        value: ({ polDom }) => {
            return <Cell minWidth="90px" justify="flex-end" fontSize="15px">
                <CellText>{shortenNumber(polDom, 2)}%</CellText>
            </Cell>
        },
    }
];

export const PoLsTable = ({
    items,
}) => {
    return <Container noPadding p="0" label="Liquidity">
        <Table
            columns={columns}
            items={items}
        />
    </Container>
}