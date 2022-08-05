import { Flex, HStack, Text } from "@chakra-ui/react"
import { useContractEvents } from '@app/hooks/useContractEvents';
import { getNetworkConfigConstants } from '@app/util/networks';
import { DEBT_CONVERTER_ABI } from "@app/config/abis";
import Table from "@app/components/common/Table";
import ScannerLink from "@app/components/common/ScannerLink";
import { UnderlyingItemBlock } from "@app/components/common/Assets/UnderlyingItemBlock";
import { UNDERLYING } from "@app/variables/tokens";
import { getBnToNumber, shortenNumber } from "@app/util/markets";
import Container from "@app/components/common/Container";

const { DEBT_CONVERTER } = getNetworkConfigConstants();

const ColHeader = ({ ...props }) => {
    return <Flex justify="flex-start" minWidth={'150px'} fontSize="24px" fontWeight="extrabold" {...props} />
}

const Cell = ({ ...props }) => {
    return <HStack fontSize="16px" fontWeight="normal" justify="flex-start" minWidth="150px" {...props} />
}

const columns = [
    {
        field: 'txHash',
        label: 'tx',
        header: ({ ...props }) => <ColHeader minWidth="200px" justify="flex-start"  {...props} />,
        value: ({ txHash }) => {
            return <Cell justify="flex-start" minWidth="200px">
                <ScannerLink value={txHash} type="tx" />
            </Cell>
        },
    },
    {
        field: 'epoch',
        label: 'epoch',
        header: ({ ...props }) => <ColHeader minWidth="100px" justify="center"  {...props} />,
        value: ({ epoch }) => <Cell minWidth="100px" justify="center" >
            <Text>{epoch}</Text>
        </Cell>,
    },
    {
        field: 'anToken',
        label: 'asset',
        header: ({ ...props }) => <ColHeader minWidth="220px" justify="center"  {...props} />,
        value: ({ anToken }) => {
            const underlying = UNDERLYING[anToken];
            return <Cell minWidth="220px" justify="center" >
                <UnderlyingItemBlock symbol={underlying?.symbol} imgSize={20} />
            </Cell>
        },
    },
    {
        field: 'dolaAmount',
        label: 'dola amount',
        header: ({ ...props }) => <ColHeader minWidth="200px" justify="flex-end"  {...props} />,
        value: ({ dolaAmount }) => <Cell minWidth="200px" justify="flex-end" >
            <Text>{shortenNumber(dolaAmount, 2)}</Text>
        </Cell>,
    },
]

export const DebtConversions = ({
    account
}: {
    account: string
}) => {
    const { events } = useContractEvents(DEBT_CONVERTER, DEBT_CONVERTER_ABI, 'Conversion', [account]);

    const items = (events)?.map((e, i) => {
        return {
            ...e.args,
            dolaAmount: getBnToNumber(e.args.dolaAmount),
            epoch: getBnToNumber(e.args.epoch, 0),
            conversionIndex: i,
            txHash: e.transactionHash,
            blocknumber: e.blockNumber,
        }
    });

    return <Container label="Past Conversions" w='full'>
        <Table
            keyName="conversionIndex"
            columns={columns}
            items={items}
        />
    </Container>
}