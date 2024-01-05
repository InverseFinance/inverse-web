import { Text, Flex, Stack } from "@chakra-ui/react"
import { shortenNumber } from "@app/util/markets";
import Container from "../../common/Container";
import { SWR } from "@app/types";
import { useCustomSWR } from "@app/hooks/useCustomSWR";
import { fetcher } from "@app/util/web3";
import { useAccount } from "@app/hooks/misc";
import Table from "@app/components/common/Table";
import ScannerLink from "@app/components/common/ScannerLink";
import { Timestamp } from "@app/components/common/BlockTimestamp/Timestamp";

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
        field: 'to',
        label: 'Buyer',
        header: ({ ...props }) => <ColHeader justify="flex-start" {...props} minWidth="130px" />,
        value: ({ to }) => {
            return <Cell w="130px" justify="flex-start" position="relative" onClick={(e) => e.stopPropagation()}>                
                <ScannerLink value={to} />
            </Cell>
        },
    },
    {
        field: 'dolaIn',
        label: 'Sold',
        header: ({ ...props }) => <ColHeader minWidth="90px" justify="center"  {...props} />,
        value: ({ dolaIn }) => {
            return <Cell minWidth="90px" justify="center" >
                <CellText>{shortenNumber(dolaIn, 2, false, true)} DOLA</CellText>
            </Cell>
        },
    },
    {
        field: 'dbrOut',
        label: 'Bought',
        header: ({ ...props }) => <ColHeader minWidth="90px" justify="center"  {...props} />,
        value: ({ dbrOut, market }) => {
            return <Cell minWidth="90px" justify="center" >
                <CellText>{shortenNumber(dbrOut, 2, false, true)} DBR</CellText>
            </Cell>
        },
    },
]

export const useDbrAuctionBuys = (from?: string): SWR & {
    events: any,
    timestamp: number,
} => {
    const { data, error } = useCustomSWR(`/api/auctions/dbr-buys`, fetcher);

    const events = !from ? (data?.buys || []) : (data?.buys || []).filter(e => e.caller === from);

    return {
        events,
        timestamp: data ? data.timestamp : 0,
        isLoading: !error && !data,
        isError: error,
    }
}

export const DbrAuctionBuys = () => {
    const account = useAccount();
    const { events } = useDbrAuctionBuys(account);
    
    return <Container
        label="My past DBR buys from the auction"
        noPadding
        m="0"
        p="0"
        >
        <Table
            keyName="txHash"
            columns={columns}
            items={events}
            noDataMessage="No DBR buys yet"
        />
    </Container>
}