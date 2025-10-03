import { SkeletonBlob } from '@app/components/common/Skeleton'
import Table from "../common/Table"
import { Flex, Stack, Text } from "@chakra-ui/react"
import { Timestamp } from "../common/BlockTimestamp/Timestamp"
import ScannerLink from "../common/ScannerLink"
import { shortenNumber } from "@app/util/markets"
import { timeSince } from "@app/util/time"
import Container from "../common/Container"

const ColHeader = ({ ...props }) => {
    return <Flex justify="flex-start" minWidth={'130px'} fontSize="14px" fontWeight="extrabold" {...props} />
}

const Cell = ({ ...props }) => {
    return <Stack direction="row" fontSize="14px" fontWeight="normal" justify="flex-start" minWidth="130px" {...props} />
}

const CellText = ({ ...props }) => {
    return <Text fontSize="14px" {...props} />
}

const columns = [
    {
        field: 'txHash',
        label: 'tx',
        header: ({ ...props }) => <ColHeader justify="flex-start" minWidth={'100px'} {...props} />,
        value: ({ txHash }) => {
            return <Cell justify="flex-start" minWidth="100px">
                <CellText><ScannerLink value={txHash} type="tx" fontSize='12px' /></CellText>
            </Cell>
        },
    },
    {
        field: 'timestamp',
        label: 'Date',
        header: ({ ...props }) => <ColHeader justify="flex-start" minWidth={'130px'} {...props} />,
        value: ({ timestamp }) => {
            return <Cell justify="flex-start" minWidth="130px">
                <CellText><Timestamp timestamp={timestamp} text1Props={{ fontSize: '12px' }} text2Props={{ fontSize: '12px' }} /></CellText>
            </Cell>
        },
    },
    {
        field: 'totalValue',
        label: "Tx's Net USD output",
        header: ({ ...props }) => <ColHeader minWidth="100px" justify="flex-start"  {...props} />,
        value: ({ totalValue }) => {
            return <Cell minWidth="100px" justify="flex-start" >
                <CellText>{shortenNumber(totalValue, 2, true)}</CellText>
            </Cell>
        },
    },
];

export const VeNftClaimsTable = ({ veNft, events, timestamp, isLoading }: { events: any[], timestamp: number, isLoading: boolean }) => {
    return <Container
        // label={`${veNft.symbol} claims`}
        description={`Pricing data source: Zerion, Last update: ${timestamp > 0 ? timeSince(timestamp) : ''}`}
        noPadding
        m="0"
        p="0"
    >
        {
            isLoading ? <SkeletonBlob skeletonHeight={6} noOfLines={5} /> : <Table
                columns={columns}
                items={events}
                keyName="txHash"
                noDataMessage="No activity yet"
                defaultSortDir="desc"
                enableMobileRender={true}
                defaultSort="timestamp"
                mobileThreshold={1000}
                showRowBorder={true}
                spacing="0"
            />
        }
    </Container>
}