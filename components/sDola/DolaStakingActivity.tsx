import { Text, Flex, Stack } from "@chakra-ui/react"
import { shortenNumber } from "@app/util/markets";
import { SWR } from "@app/types";
import { useCustomSWR } from "@app/hooks/useCustomSWR";
import { fetcher } from "@app/util/web3";
import Table from "@app/components/common/Table";
import ScannerLink from "@app/components/common/ScannerLink";
import { Timestamp } from "@app/components/common/BlockTimestamp/Timestamp";
import moment from "moment";
import Container from "../common/Container";
import { useDolaStakingEvents } from "@app/util/dola-staking";

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
        header: ({ ...props }) => <ColHeader justify="flex-start" {...props} minWidth="130px" />,
        value: ({ recipient }) => {
            return <Cell w="130px" justify="flex-start" position="relative" onClick={(e) => e.stopPropagation()}>
                <ScannerLink value={recipient} />
            </Cell>
        },
    },
    {
        field: 'name',
        label: 'Event',
        header: ({ ...props }) => <ColHeader minWidth="90px" justify="center"  {...props} />,
        value: ({ name }) => {
            return <Cell minWidth="90px" justify="center" >
                <CellText>{name}</CellText>
            </Cell>
        },
    },
    {
        field: 'amount',
        label: 'Amount',
        header: ({ ...props }) => <ColHeader minWidth="90px" justify="center"  {...props} />,
        value: ({ amount, name }) => {
            return <Cell minWidth="90px" justify="center" >
                <CellText>{shortenNumber(amount, 2, false, true)} {name === 'Claim' ? 'DBR' : 'DOLA'}</CellText>
            </Cell>
        },
    },
]

export const useDolaStakingActivity = (from?: string, isDsa = false): SWR & {
    events: any,
    accountEvents: any,
    timestamp: number,
} => {
    const liveEvents = useDolaStakingEvents();    
    const { data, error } = useCustomSWR(`/api/dola-staking/activity`, fetcher);

    const events = (liveEvents || (data?.events || [])).filter(e => e.isDirectlyDsa === isDsa);

    return {
        events,
        accountEvents: events.filter(e => e.recipient === from),
        timestamp: data ? data.timestamp : 0,
        isLoading: !error && !data,
        isError: error,
    }
}

export const DolaStakingActivity = ({ events, title, lastUpdate }: { events: any[], title: string, lastUpdate: number }) => {
    return <Container
        label={title}
        description={events.length > 0 ? `Last update: ${moment(lastUpdate).fromNow()}` : undefined}
        noPadding
        m="0"
        p="0"
    >
        <Table
            keyName="txHash"
            columns={columns}
            items={events}
            noDataMessage="No staking activity yet"
        />
    </Container>
}