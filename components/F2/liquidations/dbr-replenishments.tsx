import { Flex, Stack, Text } from "@chakra-ui/react"
import { shortenNumber } from "@app/util/markets";
import Container from "@app/components/common/Container";
import { useDBRReplenishments } from "@app/hooks/useFirm";
import Link from "@app/components/common/Link";
import { ViewIcon } from "@chakra-ui/icons";
import ScannerLink from "@app/components/common/ScannerLink";
import moment from 'moment'
import Table from "@app/components/common/Table";
import { BigImageButton } from "@app/components/common/Button/BigImageButton";
import { Timestamp } from "@app/components/common/BlockTimestamp/Timestamp";

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
        field: 'txHash',
        label: 'tx',
        header: ({ ...props }) => <ColHeader minWidth="120px" justify="flex-start"  {...props} />,
        value: ({ txHash }) => {
            return <Cell justify="flex-start" minWidth="120px">
                <ScannerLink value={txHash} type="tx" />
            </Cell>
        },
    },
    {
        field: 'timestamp',
        label: 'Date',
        header: ({ ...props }) => <ColHeader justify="flex-start" minWidth={'120px'} {...props} />,
        value: ({ timestamp }) => <Cell justify="flex-start" minWidth="120px">
            <Timestamp timestamp={timestamp} />
        </Cell>,
    },
    {
        field: 'account',
        label: 'Borrower',
        header: ({ ...props }) => <ColHeader justify="flex-start" {...props} minWidth="130px" />,
        value: ({ account }) => {
            return <Cell w="130px" justify="flex-start" position="relative" onClick={(e) => e.stopPropagation()}>
                <Link isExternal href={`/firm?viewAddress=${account}`}>
                    <ViewIcon color="blue.600" boxSize={3} />
                </Link>
                <ScannerLink value={account} />
            </Cell>
        },
        showFilter: true,
        filterWidth: '120px',
    },
    {
        field: 'marketName',
        label: 'Market',
        header: ({ ...props }) => <ColHeader minWidth="150px" justify="flex-start"  {...props} />,
        value: ({ market }) => {
            const { name, icon, marketIcon } = market;
            return <Cell minWidth="150px" justify="flex-start" alignItems="center" >
                <BigImageButton bg={`url('${marketIcon || icon}')`} h="20px" w="20px" backgroundSize='contain' backgroundRepeat="no-repeat" />
                <CellText>{name}</CellText>
            </Cell>
        },
        showFilter: true,
        filterWidth: '140px',
        filterItemRenderer: ({ marketName }) => <CellText>{marketName}</CellText>
    },
    {
        field: 'replenisher',
        label: 'Replenisher',
        header: ({ ...props }) => <ColHeader justify="flex-start" {...props} minWidth="130px" />,
        value: ({ replenisher }) => {
            return <Cell w="130px" justify="flex-start" position="relative" onClick={(e) => e.stopPropagation()}>
                <Link isExternal href={`/firm?viewAddress=${replenisher}`}>
                    <ViewIcon color="blue.600" boxSize={3} />
                </Link>
                <ScannerLink value={replenisher} />
            </Cell>
        },
        showFilter: true,
        filterWidth: '120px',
    },
    {
        field: 'deficit',
        label: 'DBR Deficit',
        header: ({ ...props }) => <ColHeader minWidth="100px" justify="center"  {...props} />,
        value: ({ deficit }) => {
            return <Cell minWidth="100px" justify="center" >
                <CellText>{shortenNumber(deficit, 2, false, true)}</CellText>
            </Cell>
        },
    },
    {
        field: 'replenishmentCost',
        label: 'DOLA Cost',
        header: ({ ...props }) => <ColHeader minWidth="100px" justify="center"  {...props} />,
        value: ({ replenishmentCost }) => {
            return <Cell minWidth="100px" justify="center" >
                <CellText>{shortenNumber(replenishmentCost, 2, false, true)}</CellText>
            </Cell>
        },
    },
    {
        field: 'replenisherReward',
        label: 'DOLA Reward',
        header: ({ ...props }) => <ColHeader minWidth="100px" justify="center"  {...props} />,
        value: ({ replenisherReward }) => {
            return <Cell minWidth="100px" justify="center" >
                <CellText>{shortenNumber(replenisherReward, 2, false, true)}</CellText>
            </Cell>
        },
    },
]

export const DbrReplenishments = ({

}: {

    }) => {
    const { events, timestamp } = useDBRReplenishments();
   
    return <Container
        label="Last Forced Replenishments"
        noPadding
        py="4"
        description={timestamp ? `Last update ${moment(timestamp).from()}` : `Loading...`}
        contentProps={{ maxW: { base: '90vw', sm: '100%' }, overflowX: 'auto' }}
        headerProps={{
            direction: { base: 'column', md: 'row' },
            align: { base: 'flex-start', md: 'flex-end' },
        }}
    >
        <Table
            keyName="key"
            noDataMessage="No DBR replenishments"
            columns={columns}
            items={events}         
            defaultSort={'timestamp'}
            defaultSortDir="desc"
        />
    </Container>
}