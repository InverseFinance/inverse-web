import { Text, Flex, Stack, VStack } from "@chakra-ui/react"
import { shortenNumber } from "@app/util/markets";
import Container from "../../common/Container";
import Table from "@app/components/common/Table";
import ScannerLink from "@app/components/common/ScannerLink";
import { Timestamp } from "@app/components/common/BlockTimestamp/Timestamp";
import moment from "moment";
import { useStakedDola } from "@app/util/dola-staking";
import { useDBRPrice } from "@app/hooks/useDBR";
import { ONE_DAY_MS } from "@app/config/constants";
import { getLastThursdayTimestamp, preciseCommify } from "@app/util/misc";

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
        showFilter: true,
        filterWidth: '100px',
    },
    {
        field: 'amountIn',
        label: 'Gave',
        header: ({ ...props }) => <ColHeader minWidth="90px" justify="center"  {...props} />,
        value: ({ amountIn, auctionType }) => {
            return <Cell minWidth="90px" justify="center" >
                <CellText fontWeight="bold">{shortenNumber(amountIn, 2, false, true)} {auctionType === 'sINV' ? 'INV' : 'DOLA' }</CellText>
            </Cell>
        },
    },
    {
        field: 'dbrOut',
        label: 'Bought',
        header: ({ ...props }) => <ColHeader minWidth="90px" justify="center"  {...props} />,
        value: ({ dbrOut }) => {
            return <Cell minWidth="90px" justify="center" >
                <CellText>{shortenNumber(dbrOut, 2, false, true)} DBR</CellText>
            </Cell>
        },
    },
    {
        field: 'priceInDola',
        label: 'DBR Price',
        header: ({ ...props }) => <ColHeader minWidth="90px" justify="center"  {...props} />,
        value: ({ priceInDola, priceInInv, auctionType }) => {
            return <Cell minWidth="90px" justify="center">
                <CellText>{shortenNumber(auctionType === 'sINV' ? priceInInv : priceInDola, 5, false, true)} {auctionType === 'sINV' ? 'INV' : 'DOLA'}</CellText>
            </Cell>
        },
    }, 
    {
        field: 'auctionType',
        label: 'Auction Type',
        header: ({ ...props }) => <ColHeader minWidth="90px" justify="center"  {...props} />,
        value: ({ auctionType, version }) => {
            return <Cell minWidth="90px" justify="center" >
                <CellText>{auctionType}{version ? ` ${version}` : ''}</CellText>
            </Cell>
        },
        showFilter: true,
        filterWidth: '90px',
    },
];

const sDOLAColumns = columns.slice(0, columns.length - 1).map(c => ({ ...c, showFilter: false}));

export const DbrAuctionBuys = ({ events, title, subtitle, lastUpdate }: { events: any[], title: string, subtitle: string, lastUpdate: number }) => {
    return <Container
        label={title}
        description={subtitle || (lastUpdate > 0 ? `Last update: ${moment(lastUpdate).fromNow()}` : undefined)}
        noPadding
        m="0"
        p="0"
    >
        <Table
            keyName="key"
            defaultSort="timestamp"
            defaultSortDir="desc"
            columns={columns}
            items={events}
            noDataMessage="No DBR buys yet"
        />
    </Container>
}

export const DbrAuctionBuysSDola = ({ events, title, subtitle, lastUpdate }: { events: any[], title: string, subtitle: string, lastUpdate: number }) => {
    const { priceUsd: dbrPrice, priceDola: dbrDolaPrice } = useDBRPrice();
    const { apy, pastWeekRevenue } = useStakedDola(dbrPrice);
    const lastWeekEnd = getLastThursdayTimestamp();
    const lastWeekStart = lastWeekEnd - (ONE_DAY_MS * 7);   
    const pastWeekEvents = events.filter(e => e.timestamp < lastWeekEnd && e.timestamp >= lastWeekStart);

    return <Container
        label={`Where does the ${shortenNumber(apy, 2)}% APY come from?`}
        description={`Easily verify below the on-chain source of the sDOLA real-yield`}
        noPadding
        m="0"
        p="0"
        right={
            <VStack spacing="0" alignItems="flex-end">
                <Text>Last week's revenue to distribute this week:</Text>
                <Text fontWeight="bold">{preciseCommify(pastWeekRevenue, 2)} DOLA</Text>
            </VStack>
        }
        headerProps={{
            direction: { base: 'column', md: 'row' },
            align: { base: 'flex-start', md: 'flex-end' },
        }}
    >
        <Table
            keyName="txHash"
            defaultSort="timestamp"
            defaultSortDir="desc"
            columns={sDOLAColumns}
            items={pastWeekEvents}
            noDataMessage="No DBR buys in the sDOLA auction last week"
        />
    </Container>
}