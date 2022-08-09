import { Flex, HStack, Text } from "@chakra-ui/react"
import Table from "@app/components/common/Table";
import ScannerLink from "@app/components/common/ScannerLink";
import { shortenNumber } from "@app/util/markets";
import Container from "@app/components/common/Container";
import { useDebtRepayments } from "@app/hooks/useDebtConverter";
import { BlockTimestamp } from "@app/components/common/BlockTimestamp";

const ColHeader = ({ ...props }) => {
    return <Flex justify="flex-start" minWidth={'150px'} fontSize="12px" fontWeight="extrabold" {...props} />
}

const Cell = ({ ...props }) => {
    return <HStack fontSize="14px" fontWeight="normal" justify="flex-start" minWidth="150px" {...props} />
}

const columns = [
    {
        field: 'txHash',
        label: 'tx',
        header: ({ ...props }) => <ColHeader minWidth="150px" justify="flex-start"  {...props} />,
        value: ({ txHash }) => {
            return <Cell justify="flex-start" minWidth="150px">
                <ScannerLink value={txHash} type="tx" />
            </Cell>
        },
    },
    {
        field: 'blocknumber',
        label: 'time',
        header: ({ ...props }) => <ColHeader minWidth="150px" justify="flex-start"  {...props} />,
        value: ({ blocknumber }) => {
            return <Cell justify="flex-start" minWidth="150px">
                <BlockTimestamp blockNumber={blocknumber} />
            </Cell>
        },
    },
    {
        field: 'epoch',
        label: 'epoch',
        tooltip: 'The Repayment epoch',
        header: ({ ...props }) => <ColHeader minWidth="100px" justify="center"  {...props} />,
        value: ({ epoch }) => <Cell minWidth="100px" justify="center" >
            <Text>{epoch}</Text>
        </Cell>,
    },    
    {
        field: 'dolaAmount',
        label: 'DOLA amount',
        tooltip: 'The amount of DOLA used for debt repayment',
        header: ({ ...props }) => <ColHeader minWidth="140px" justify="flex-end"  {...props} />,
        value: ({ dolaAmount }) => <Cell minWidth="140px" justify="flex-end" >
            <Text>{shortenNumber(dolaAmount, 2)}</Text>
        </Cell>,
    },    
]

export const DebtRepayments = () => {
    const { repayments } = useDebtRepayments();

    return <Container
        label="Debt Repayments"
        w='full'
    >
        <Table
            keyName="epoch"
            noDataMessage="No Repayment yet"
            columns={columns}
            items={repayments}
            defaultSort="blocknumber"
            defaultSortDir="desc"
        />
    </Container>
}