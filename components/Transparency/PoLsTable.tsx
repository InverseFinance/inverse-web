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
        header: ({ ...props }) => <ColHeader minWidth="120px" justify="flex-start"  {...props} />,
        value: ({ name }) => {
            return <Cell minWidth='120px' spacing="1" justify="center" alignItems={{ base: 'center', md: 'flex-start' }} direction={{ base: 'row', md: 'column' }}>
                <CellText>{name}</CellText>
            </Cell>
        },
    },
    {
        field: 'tvl',
        label: 'TVL',        
        header: ({ ...props }) => <ColHeader minWidth="100px" justify="center"  {...props} />,
        value: ({ tvl }) => {
            return <Cell minWidth="100px" justify="center" fontSize="15px">
                <CellText>{preciseCommify(tvl, 2, true)}</CellText>
            </Cell>
        },
    }
    , {
        field: 'pol',
        label: 'PoL',        
        header: ({ ...props }) => <ColHeader minWidth="100px" justify="center"  {...props} />,
        value: ({ pol }) => {
            return <Cell minWidth="100px" justify="center" fontSize="15px">
                <CellText>{preciseCommify(pol, 2, true)}</CellText>
            </Cell>
        },
    }
    , {
        field: 'polDom',
        label: 'Pool Dom',        
        header: ({ ...props }) => <ColHeader minWidth="100px" justify="flex-end"  {...props} />,
        value: ({ polDom }) => {
            return <Cell minWidth="100px" justify="flex-end" fontSize="15px">
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