import { Flex, Stack, Text } from "@chakra-ui/react"
import { shortenNumber } from "@app/util/markets";
import Container from "@app/components/common/Container";
import { useFirmLiquidations } from "@app/hooks/useFirm";
import Link from "@app/components/common/Link";
import { ViewIcon } from "@chakra-ui/icons";
import ScannerLink from "@app/components/common/ScannerLink";
import moment from 'moment'
import Table from "@app/components/common/Table";
import { BigImageButton } from "@app/components/common/Button/BigImageButton";
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
        field: 'borrower',
        label: 'Borrower',
        header: ({ ...props }) => <ColHeader justify="flex-start" {...props} minWidth="130px" />,
        value: ({ borrower }) => {
            return <Cell w="130px" justify="flex-start" position="relative" onClick={(e) => e.stopPropagation()}>
                <Link isExternal href={`/firm?viewAddress=${borrower}`}>
                    <ViewIcon color="blue.600" boxSize={3} />
                </Link>
                <ScannerLink value={borrower} />
            </Cell>
        },
        showFilter: true,
        filterWidth: '120px',
    },
    {
        field: 'marketName',
        label: 'Market',
        header: ({ ...props }) => <ColHeader minWidth="100px" justify="flex-start"  {...props} />,
        value: ({ market }) => {
            const { name, icon, marketIcon, underlying } = market;
            return <Cell minWidth="100px" justify="flex-start" alignItems="center" >
                <BigImageButton bg={`url('${marketIcon || icon || underlying?.image}')`} h="20px" w="20px" backgroundSize='contain' backgroundRepeat="no-repeat" />
                <CellText>{name}</CellText>
            </Cell>
        },
        showFilter: true,
        filterWidth: '90px',
        filterItemRenderer: ({ marketName }) => <CellText>{marketName}</CellText>
    },
    {
        field: 'liquidator',
        label: 'Liquidator',
        header: ({ ...props }) => <ColHeader justify="flex-start" {...props} minWidth="100px" />,
        value: ({ liquidator }) => {
            return <Cell w="100px" justify="flex-start" position="relative" onClick={(e) => e.stopPropagation()}>
                <ScannerLink value={liquidator} />
            </Cell>
        },
        showFilter: true,
        filterWidth: '90px',
    },
    {
        field: 'repaidDebt',
        label: 'Debt repaid',
        header: ({ ...props }) => <ColHeader minWidth="90px" justify="center"  {...props} />,
        value: ({ repaidDebt }) => {
            return <Cell minWidth="90px" justify="center" >
                <CellText>{shortenNumber(repaidDebt, 2, false, true)} DOLA</CellText>
            </Cell>
        },
    },
    {
        field: 'liquidatorReward',
        label: 'Liquidator Reward',
        header: ({ ...props }) => <ColHeader minWidth="90px" justify="center"  {...props} />,
        value: ({ liquidatorReward, market }) => {
            return <Cell minWidth="90px" justify="center" >
                <CellText>{shortenNumber(liquidatorReward, 2, false, true)} {market.underlying.symbol}</CellText>
            </Cell>
        },
    },
]

export const FirmLiquidations = ({

}: {

    }) => {
    const { liquidations, timestamp, isLoading } = useFirmLiquidations();

    return <Container
        label="Last 100 Liquidations on FiRM"
        noPadding
        py="4"
        description={timestamp ? `Last update ${moment(timestamp).fromNow()}` : `Loading...`}
        contentProps={{ maxW: { base: '90vw', sm: '100%' }, overflowX: 'auto' }}
        headerProps={{
            direction: { base: 'column', md: 'row' },
            align: { base: 'flex-start', md: 'flex-end' },
        }}
    >
        <Table
            keyName="key"
            noDataMessage={isLoading ? 'Loading' : "No Liquidations"}
            columns={columns}
            items={liquidations.slice(0, 100)}         
            defaultSort={'timestamp'}
            defaultSortDir="desc"
        />
    </Container>
}