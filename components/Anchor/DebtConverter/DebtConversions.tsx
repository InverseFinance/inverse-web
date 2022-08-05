import { Flex, HStack, Text } from "@chakra-ui/react"
import Table from "@app/components/common/Table";
import ScannerLink from "@app/components/common/ScannerLink";
import { UnderlyingItemBlock } from "@app/components/common/Assets/UnderlyingItemBlock";
import { UNDERLYING } from "@app/variables/tokens";
import { shortenNumber } from "@app/util/markets";
import Container from "@app/components/common/Container";
import { DebtConversion } from "@app/types";
import { useDebtConversions, useDebtConverter } from "@app/hooks/useDebtConverter";
import { redeemAllIOUs } from "@app/util/contracts";
import { JsonRpcSigner } from '@ethersproject/providers';
import { showToast } from '@app/util/notify';

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
        tooltip: 'The Repayment epoch',
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
        label: 'Total Value',
        tooltip: 'The total DOLA value at the moment of conversion',
        header: ({ ...props }) => <ColHeader minWidth="200px" justify="flex-end"  {...props} />,
        value: ({ dolaAmount }) => <Cell minWidth="200px" justify="flex-end" >
            <Text>{shortenNumber(dolaAmount, 2)}</Text>
        </Cell>,
    },
    {
        field: 'redeemableIOUs',
        label: 'Redeemable IOUs',
        tooltip: 'IOUs redeemable at the moment',
        header: ({ ...props }) => <ColHeader minWidth="200px" justify="flex-end"  {...props} />,
        value: ({ redeemableIOUs }) => <Cell minWidth="200px" justify="flex-end" >
            <Text>{shortenNumber(redeemableIOUs, 2)}</Text>
        </Cell>,
    },
    {
        field: 'redeemableDolas',
        label: 'Redeemable DOLAs',
        tooltip: 'DOLAs corresponding to the current redeemable IOUs',
        header: ({ ...props }) => <ColHeader minWidth="200px" justify="flex-end"  {...props} />,
        value: ({ redeemableDolas }) => <Cell minWidth="200px" justify="flex-end" >
            <Text>{shortenNumber(redeemableDolas, 2)}</Text>
        </Cell>,
    },
]

export const DebtConversions = ({
    account,
    signer,
}: {
    account: string
    signer: JsonRpcSigner,
}) => {
    const { totalRedeemableDola } = useDebtConverter(account);
    const { conversions } = useDebtConversions(account);

    const handleRedeem = (conversion: DebtConversion) => {
        if(!conversion.redeemableIOUs) {
            showToast({ status: 'info', description: 'No redeemable IOUs at the moment for this conversation' })
            return;
        }
        return redeemAllIOUs(signer, conversion.conversionIndex);
    }

    return <Container
        label="Past Conversions"
        description={`Total redeemable DOLAs: ${shortenNumber(totalRedeemableDola, 2)}`}
        w='full'
    >
        <Table
            keyName="conversionIndex"
            columns={columns}
            items={conversions}
            onClick={handleRedeem}
        />
    </Container>
}