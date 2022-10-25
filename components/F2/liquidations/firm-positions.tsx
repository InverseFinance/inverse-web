import { Flex, HStack, Stack, Text } from "@chakra-ui/react"
import Table from "@app/components/common/Table";
import { shortenNumber } from "@app/util/markets";
import Container from "@app/components/common/Container";
import { useAccountDBR, useAccountF2Markets, useDBRMarkets } from '@app/hooks/useDBR';
import { useRouter } from 'next/router';
import { useAccount } from '@app/hooks/misc';
import { getRiskColor } from "@app/util/f2";
import { BigImageButton } from "@app/components/common/Button/BigImageButton";
import { useFirmPositions } from "@app/hooks/useFirm";
import Link from "@app/components/common/Link";
import { ViewIcon } from "@chakra-ui/icons";
import ScannerLink from "@app/components/common/ScannerLink";
import { preciseCommify } from "@app/util/misc";

const ColHeader = ({ ...props }) => {
    return <Flex justify="flex-start" minWidth={'100px'} fontSize="14px" fontWeight="extrabold" {...props} />
}

const Cell = ({ ...props }) => {
    return <Stack direction="row" fontSize="14px" fontWeight="normal" justify="flex-start" minWidth="100px" {...props} />
}

const CellText = ({ ...props }) => {
    return <Text fontSize="16px" {...props} />
}

const columns = [
    {
        field: 'marketName',
        label: 'Market',
        header: ({ ...props }) => <ColHeader minWidth="200px" justify="flex-start"  {...props} />,        
        value: ({ market }) => {
            const { name, icon, marketIcon } = market;
            return <Cell minWidth="200px" justify="flex-start" alignItems="center" >
                <BigImageButton bg={`url('${marketIcon||icon}')`} h="40px" w="60px" backgroundSize='contain' backgroundRepeat="no-repeat" />
                <CellText>{name}</CellText>
            </Cell>
        },
        showFilter: true,
        filterWidth: '200px',
        filterItemRenderer: ({marketName}) => <CellText>{marketName}</CellText>
    },
    {
        field: 'user',
        label: 'Account',
        header: ({ ...props }) => <ColHeader justify="flex-start" {...props} minWidth="100px" />,
        value: ({ user }) => {
            return <Cell w="100px" justify="flex-start" position="relative" onClick={(e) => e.stopPropagation()}>
                <Link isExternal href={`/firm?viewAddress=${user}`}>
                    <ViewIcon color="blue.600" boxSize={3} />
                </Link>
                <ScannerLink value={user} />
            </Cell>
        },
        showFilter: true,
        filterWidth: '100px',
    },
    {
        field: 'deposits',
        label: 'Deposits',
        header: ({ ...props }) => <ColHeader minWidth="100px" justify="center"  {...props} />,
        value: ({ deposits, market }) => {
            return <Cell minWidth="100px" justify="center" alignItems="center" direction="column" spacing="0">
                <CellText>{shortenNumber(deposits, 2)}</CellText>
                <CellText>({shortenNumber(deposits * market?.price, 2, true)})</CellText>
            </Cell>
        },
    },
    {
        field: 'creditLimit',
        label: 'Max debt',
        header: ({ ...props }) => <ColHeader minWidth="100px" justify="center"  {...props} />,        
        value: ({ creditLimit }) => {
            return <Cell minWidth="100px" justify="center" alignItems="center" direction="column" spacing="0">
                <CellText>{shortenNumber(creditLimit, 2)}</CellText>                
            </Cell>
        },
    },
    {
        field: 'debt',
        label: 'Debt',
        header: ({ ...props }) => <ColHeader minWidth="150px" justify="center"  {...props} />,
        value: ({ debt }) => {
            return <Cell minWidth="150px" justify="center" >
                <CellText>{shortenNumber(debt, 2, true)}</CellText>
            </Cell>
        },
    },
    {
        field: 'liquidationPrice',
        label: 'Liq. price',
        header: ({ ...props }) => <ColHeader minWidth="100px" justify="center"  {...props} />,
        value: ({ liquidationPrice }) => {
            return <Cell minWidth="100px" justify="center" alignItems="center" direction="column" spacing="0">
                <CellText>{preciseCommify(liquidationPrice, 2, true)}</CellText>                
            </Cell>
        },
    },
    {
        field: 'perc',
        label: 'Loan Health',
        header: ({ ...props }) => <ColHeader minWidth="150px" justify="flex-end"  {...props} />,
        value: ({ perc, debt }) => {
            const color = getRiskColor(perc);
            return <Cell minWidth="150px" justify="flex-end" >
                <CellText color={perc && debt > 0 ? color : undefined}>{debt > 0 ? `${shortenNumber(perc, 2)}%` : '-'}</CellText>
            </Cell>
        },
    },
]

export const FirmPositions = ({

}: {

    }) => {    
    const { positions } = useFirmPositions();

    return <Container
        label="FiRM Positions"
        contentProps={{ maxW: { base: '90vw', sm: '100%' }, overflowX: 'auto' }}
    >
        <Table
            keyName="key"
            noDataMessage="Loading..."
            columns={columns}
            items={positions}
            // onClick={openMarket}
            defaultSort="perc"
            defaultSortDir="asc"
        />
    </Container>
}