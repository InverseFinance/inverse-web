import { useState } from 'react';
import { Flex, Stack, Text, useDisclosure, VStack, HStack } from "@chakra-ui/react"
import Table from "@app/components/common/Table";
import ScannerLink from "@app/components/common/ScannerLink";
import { UnderlyingItemBlock } from "@app/components/common/Assets/UnderlyingItemBlock";
import { UNDERLYING } from "@app/variables/tokens";
import { shortenNumber } from "@app/util/markets";
import Container from "@app/components/common/Container";
import { DebtConversion } from "@app/types";
import { useDebtConversions } from "@app/hooks/useDebtConverter";
import { redeemAllIOUs } from "@app/util/contracts";
import { JsonRpcSigner } from '@ethersproject/providers';
import { showToast } from '@app/util/notify';
import { BlockTimestamp } from "@app/components/common/BlockTimestamp";
import ConfirmModal from "@app/components/common/Modal/ConfirmModal";
import { InfoMessage } from '@app/components/common/Messages';

const ColHeader = ({ ...props }) => {
    return <Flex justify="flex-start" minWidth={'150px'} fontSize="12px" fontWeight="extrabold" {...props} />
}

const Cell = ({ ...props }) => {
    return <Stack direction="row" fontSize="14px" fontWeight="normal" justify="flex-start" minWidth="150px" {...props} />
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
        label: 'asset sold',
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
        label: 'already Redeemed',
        tooltip: 'IOUs already redeemed',
        header: ({ ...props }) => <ColHeader minWidth="180px" justify="flex-end"  {...props} />,
        value: ({ redeemedIOUs, redeemableIOUs, redeemedPerc }) => <Cell direction="column" minWidth="180px" alignItems="flex-end" >
            <Text>{shortenNumber(redeemedIOUs)} / {shortenNumber(redeemableIOUs, 2)} IOUs</Text>
            <Text>({shortenNumber(redeemedPerc, 2)}%)</Text>
        </Cell>,
    },
    {
        field: 'currentlyRedeemableIOUs',
        label: 'Redeemable now',
        tooltip: 'IOUs redeemable at the moment for your remaining IOUs',
        header: ({ ...props }) => <ColHeader minWidth="150px" justify="flex-end"  {...props} />,
        value: ({ leftToRedeem, currentlyRedeemableIOUs, redeemablePerc }) => <Cell direction="column" minWidth="150px" alignItems="flex-end" >
            {
                leftToRedeem > 0 ?
                    <>
                        <Text>{shortenNumber(currentlyRedeemableIOUs)} / {shortenNumber(leftToRedeem, 2)} IOUs</Text>
                        <Text>({shortenNumber(redeemablePerc, 2)}%)</Text>
                    </>
                    : <Text>-</Text>
            }
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
    const { conversions } = useDebtConversions(account);
    const { isOpen, onClose, onOpen } = useDisclosure();
    const [conversion, setConversion] = useState<DebtConversion | null>(null);

    const openRedeem = (conversion: DebtConversion) => {
        setConversion(conversion);
        if (!conversion.redeemableIOUs) {
            showToast({ status: 'info', description: 'No redeemable IOUs at the moment for this conversation' })
            return;
        } else {
            onOpen();
        }
    }

    const handleRedeem = () => {
        return redeemAllIOUs(signer, conversion.conversionIndex);
    }

    return <Container
        label="Past Conversions"
        description={`All the Debt Conversions you made to get DOLA IOUs - Redeems will be possible progressively after each Debt Repayment made by the Treasury`}
        contentProps={{ maxW: { base: '90vw', sm: '100%' }, overflowX: 'auto' }}
    >
        <ConfirmModal
            title={`Confirm Redeem IOU`}
            onClose={onClose}
            onCancel={onClose}
            onOk={handleRedeem}
            isOpen={isOpen}
        >
            <VStack my="4" mx="2">
                <InfoMessage
                    alertProps={{ w: 'full' }}
                    description={
                        <VStack alignItems="flex-start" w='full'>
                            <HStack w='full' justifyContent="space-between">
                                <Text>This will redeem:</Text>
                                <Text>~{shortenNumber(conversion?.currentlyRedeemableIOUs, 2)} IOUs</Text>
                            </HStack>
                            <HStack w='full' justifyContent="space-between">
                                <Text>You will get:</Text>
                                <Text>~{shortenNumber(conversion?.currentlyRedeemableDOLAs, 2)} DOLA</Text>
                            </HStack>
                        </VStack>
                    }
                />
            </VStack>
        </ConfirmModal>
        <Table
            keyName="conversionIndex"
            noDataMessage="No Conversion yet"
            columns={columns}
            items={conversions}
            onClick={openRedeem}
            defaultSort="blocknumber"
            defaultSortDir="desc"
        />
    </Container>
}