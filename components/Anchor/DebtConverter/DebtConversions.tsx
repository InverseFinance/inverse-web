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
    // {
    //     field: 'epoch',
    //     label: 'epoch',
    //     tooltip: 'The Repayment epoch',
    //     header: ({ ...props }) => <ColHeader minWidth="100px" justify="center"  {...props} />,
    //     value: ({ epoch }) => <Cell minWidth="100px" justify="center" >
    //         <Text>{epoch}</Text>
    //     </Cell>,
    // },
    {
        field: 'anToken',
        label: 'asset',
        header: ({ ...props }) => <ColHeader minWidth="100px" justify="center"  {...props} />,
        value: ({ anToken }) => {
            const underlying = UNDERLYING[anToken];
            return <Cell minWidth="100px" justify="center" >
                <UnderlyingItemBlock symbol={underlying?.symbol} imgSize={20} />
            </Cell>
        },
    },
    {
        field: 'underlyingAmount',
        label: 'sold amount',
        tooltip: 'The amount of asset exchanged for IOUs',
        header: ({ ...props }) => <ColHeader minWidth="140px" justify="flex-end"  {...props} />,
        value: ({ underlyingAmount }) => <Cell minWidth="140px" justify="flex-end" >
            <Text>{shortenNumber(underlyingAmount, 2)}</Text>
        </Cell>,
    },
    {
        field: 'dolaAmount',
        label: 'Sell Worth',
        tooltip: 'The total DOLA value of the exchanged asset at the moment of conversion',
        header: ({ ...props }) => <ColHeader minWidth="140px" justify="flex-end"  {...props} />,
        value: ({ dolaAmount }) => <Cell minWidth="140px" justify="flex-end" >
            <Text>{shortenNumber(dolaAmount, 2)}</Text>
        </Cell>,
    },
    {
        field: 'redeemedIOUs',
        label: 'Redeemed IOU',
        tooltip: 'IOUs already redeemed',
        header: ({ ...props }) => <ColHeader minWidth="150px" justify="flex-end"  {...props} />,
        value: ({ redeemedIOUs, redeemableIOUs, redeemedPerc }) => <Cell minWidth="150px" justify="flex-end" >
            <Text>{shortenNumber(redeemedIOUs)} / {shortenNumber(redeemableIOUs, 2)} ({shortenNumber(redeemedPerc, 2)}%)</Text>
        </Cell>,
    },
    {
        field: 'currentlyRedeemableIOUs',
        label: 'Redeemable IOU',
        tooltip: 'IOUs redeemable at the moment',
        header: ({ ...props }) => <ColHeader minWidth="150px" justify="flex-end"  {...props} />,
        value: ({ redeemableIOUs, currentlyRedeemableIOUs, redeemablePerc, redeemedIOUs }) => <Cell minWidth="150px" justify="flex-end" >
            <Text>{shortenNumber(currentlyRedeemableIOUs)} / {shortenNumber(redeemableIOUs - redeemedIOUs, 2)} ({shortenNumber(redeemablePerc, 2)}%)</Text>
        </Cell>,
    },
    // {
    //     field: 'redeemableDolas',
    //     label: 'Redeemable DOLAs',
    //     tooltip: 'DOLAs corresponding to the current redeemable IOUs',
    //     header: ({ ...props }) => <ColHeader minWidth="150px" justify="flex-end"  {...props} />,
    //     value: ({ redeemableDolas }) => <Cell minWidth="150px" justify="flex-end" >
    //         <Text>{shortenNumber(redeemableDolas, 2)}</Text>
    //     </Cell>,
    // },
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
            noDataMessage="No Conversions yet"
            columns={columns}
            items={conversions}
            onClick={handleRedeem}
            defaultSort="blocknumber"
            defaultSortDir="desc"
        />
    </Container>
}