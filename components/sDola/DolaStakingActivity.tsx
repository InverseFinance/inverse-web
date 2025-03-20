import { Text, Flex, Stack, ContainerProps } from "@chakra-ui/react"
import { shortenNumber } from "@app/util/markets";
import Table from "@app/components/common/Table";
import ScannerLink from "@app/components/common/ScannerLink";
import { Timestamp } from "@app/components/common/BlockTimestamp/Timestamp";
import moment from "moment";
import Container from "../common/Container";

const ColHeader = ({ ...props }) => {
    return <Flex justify="flex-start" minWidth={'100px'} fontSize="12px" fontWeight="extrabold" {...props} />
}

const Cell = ({ ...props }) => {
    return <Stack direction="row" fontSize="12px" fontWeight="normal" justify="flex-start" minWidth="100px" {...props} />
}

const CellText = ({ ...props }) => {
    return <Text fontSize="12px" {...props} />
}

const ACTION_COLORS = {
    'Stake': 'info',
    'Unstake': 'warning',
    'Claim': 'success',
}

const columns = [
    {
        field: 'txHash',
        label: 'tx',
        header: ({ ...props }) => <ColHeader minWidth="100px" justify="flex-start"  {...props} />,
        value: ({ txHash }) => {
            return <Cell justify="flex-start" minWidth="100px">
                <ScannerLink value={txHash} type="tx" fontSize='12px' />
            </Cell>
        },
    },
    {
        field: 'timestamp',
        label: 'Date',
        header: ({ ...props }) => <ColHeader justify="flex-start" minWidth={'100px'} {...props} />,
        value: ({ timestamp }) => <Cell justify="flex-start" minWidth="100px">
            <Timestamp timestamp={timestamp} text1Props={{ fontSize: '12px' }} text2Props={{ fontSize: '12px' }} />
        </Cell>,
    },
    {
        field: 'recipient',
        label: 'Staker',
        header: ({ ...props }) => <ColHeader justify="center" {...props} minWidth="130px" />,
        value: ({ recipient }) => {
            return <Cell w="130px" justify="center" position="relative" onClick={(e) => e.stopPropagation()}>
                <ScannerLink value={recipient} />
            </Cell>
        },
        showFilter: true,
        filterWidth: '130px',
    },
    {
        field: 'name',
        label: 'Action',
        header: ({ ...props }) => <ColHeader minWidth="90px" justify="center"  {...props} />,
        value: ({ name }) => {
            return <Cell minWidth="90px" justify="center" >
                <CellText color={ACTION_COLORS[name]} fontWeight="bold">{name}</CellText>
            </Cell>
        },
        showFilter: true,
        filterWidth: '90px',
    },    
    {
        field: 'amount',
        label: 'Amount',
        header: ({ ...props }) => <ColHeader minWidth="90px" justify="center"  {...props} />,
        value: ({ amount, name }) => {
            return <Cell minWidth="90px" justify="center" >
                <CellText color={ACTION_COLORS[name]} fontWeight="bold">{shortenNumber(amount, 2, false, true)} {name === 'Claim' ? 'DBR' : 'DOLA'}</CellText>
            </Cell>
        },
    },
]

export const DolaStakingActivity = ({ events, title, lastUpdate, ...containerProps }: { events: any[], title: string, lastUpdate: number, containerProps?: ContainerProps }) => {    
    return <Container
        label={title}
        description={lastUpdate > 0 ? `Last update: ${timeSince(lastUpdate)}` : undefined}
        noPadding
        m="0"
        p="0"
        {...containerProps}
    >
        <Table
            keyName="key"
            columns={columns}
            items={events}
            noDataMessage="No staking activity yet"
            defaultSort="timestamp"
            defaultSortDir="desc"
        />
    </Container>
}