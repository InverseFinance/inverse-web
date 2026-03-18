import { Flex, Stack, Text } from "@chakra-ui/react"
import { shortenNumber } from "@app/util/markets";
import Container from "@app/components/common/Container";
import Link from "@app/components/common/Link";
import { ViewIcon } from "@chakra-ui/icons";
import ScannerLink from "@app/components/common/ScannerLink";

import Table from "@app/components/common/Table";
import { timeSince } from "@app/util/time";
import { useCacheFirstSWR } from "@app/hooks/useCustomSWR";

const ColHeader = ({ ...props }) => {
    return <Flex justify="flex-start" minWidth={'100px'} fontSize="12px" fontWeight="extrabold" {...props} />
}

const Cell = ({ ...props }) => {
    return <Stack direction="row" fontSize="12px" fontWeight="normal" justify="flex-start" minWidth="100px" {...props} />
}

const CellText = ({ ...props }) => {
    return <Text fontSize="12px" {...props} />
}

const columns = [
    {
        field: 'account',
        label: 'Staker',
        header: ({ ...props }) => <ColHeader justify="flex-start" {...props} minWidth="200px" />,
        value: ({ account }) => {
            return <Cell w="200px" justify="flex-start" position="relative" onClick={(e) => e.stopPropagation()}>
                <Link isExternal href={`/firm?viewAddress=${account}`}>
                    <ViewIcon color="blue.600" boxSize={3} />
                </Link>
                <ScannerLink value={account} />
            </Cell>
        },
        showFilter: true,
        filterWidth: '200px',
    },
    {
        field: 'balance',
        label: 'Balance',
        header: ({ ...props }) => <ColHeader minWidth="90px" justify="center"  {...props} />,
        value: ({ balance }) => {
            return <Cell minWidth="90px" justify="center" >
                <CellText>{shortenNumber(balance, 2, false, true)}</CellText>
            </Cell>
        },
    },
    {
        field: 'balanceInDola',
        label: 'Bal (in DOLA)',
        header: ({ ...props }) => <ColHeader minWidth="90px" justify="center"  {...props} />,
        value: ({ balanceInDola }) => {
            return <Cell minWidth="90px" justify="center" >
                <CellText>{shortenNumber(balanceInDola, 2, false, true)}</CellText>
            </Cell>
        },
    },
    {
        field: 'withdrawAmount',
        label: 'Withdrawing',
        header: ({ ...props }) => <ColHeader minWidth="90px" justify="center"  {...props} />,
        value: ({ withdrawAmount }) => {
            return <Cell minWidth="90px" justify="center" >
                <CellText>{shortenNumber(withdrawAmount, 2, false, true)}</CellText>
            </Cell>
        },
    },
    {
        field: 'withdrawStatus',
        label: 'Withdraw status',
        header: ({ ...props }) => <ColHeader minWidth="100px" justify="center"  {...props} />,
        value: ({ withdrawStatus }) => {
            return <Cell minWidth="100px" justify="center" >
                <CellText>{withdrawStatus}</CellText>
            </Cell>
        },
        showFilter: true,
        filterWidth: '100px',
    },
];

export const JrDolaStakersTable = () => {
    const { data, isLoading } = useCacheFirstSWR(`/api/junior/j-stakers`)
    const timestamp = data?.timestamp;

    return <Container
        label={`jrDOLA Stakers`}
        noPadding
        py="4"
        description={`Last update: ${timestamp ? timeSince(timestamp) : ''}`}
        contentProps={{ maxW: { base: '90vw', sm: '100%' }, overflowX: 'auto' }}
        headerProps={{
            direction: { base: 'column', md: 'row' },
            align: { base: 'flex-start', md: 'flex-end' },
        }}
    >
        <Table
            keyName="key"
            noDataMessage={isLoading ? 'Loading' : "No stakers"}
            columns={columns}
            items={data?.positions || []}
            defaultSort={'account'}
            defaultSortDir="desc"
        />
    </Container>
}