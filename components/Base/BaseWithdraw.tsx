import { useEffect, useState } from "react";
import { MsgStatusItem, WithdrawalItem, executeMessage, getBaseProvider, getMessenger, getTransactionsStatuses } from "@app/util/base";
import { MessageStatus } from '@eth-optimism/sdk'
import { useWeb3React } from "@web3-react/core";
import { VStack, Text } from "@chakra-ui/react";
import { InfoMessage } from "../common/Messages";
import Container from "../common/Container";
import { Input } from "../common/Input";
import { RSubmitButton } from "../common/Button/RSubmitButton";
import { useAccount } from "@app/hooks/misc";

export const BaseWithdraw = ({
    transactionItem,
    onSuccess,
    ...props
}: {
    transactionItem: WithdrawalItem | undefined
    onSuccess: () => void
}) => {
    const { provider } = useWeb3React();
    const account = useAccount();
    const [txHash, setTxHash] = useState(transactionItem?.hash || '');
    const [statuses, setStatuses] = useState<MsgStatusItem[]>(transactionItem?.statuses || []);
    const [isLoadingStatus, setIsLoadingStatus] = useState(false);
    const signer = provider?.getSigner();

    useEffect(() => {
        setTxHash(transactionItem?.hash || '');
        setStatuses(transactionItem?.statuses || []);
        setIsLoadingStatus(false);
    }, [transactionItem?.hash]);

    const checkStatus = async () => {
        if (!signer) return;
        const results = await getTransactionsStatuses([txHash], signer);
        const statuses = results[0];
        setIsLoadingStatus(true);
        setStatuses(statuses);
        setIsLoadingStatus(false);
    }

    const canExecute = !!signer && statuses.some(
        (message) =>
            message.status === MessageStatus.READY_TO_PROVE || message.status === MessageStatus.READY_FOR_RELAY
    );

    const hasStatus = statuses.length > 0;

    return <Container
        label="Prove / Relay withdraw"
        noPadding
        p="0"
        {...props}
    >
        {
            !account ? <InfoMessage alertProps={{ w: 'full' }} description="Please connect your wallet" />
                : <VStack w='full' spacing="4" alignItems="flex-start">
                    <VStack w='full'>
                        <Input placeholder="Base transaction hash to prove or finalize" fontSize="12px" value={txHash} onChange={e => setTxHash(e.target.value)} />
                        <RSubmitButton disabled={!txHash} onClick={() => checkStatus()}>
                            {hasStatus ? 'Re-check' : 'Check'} status
                        </RSubmitButton>
                    </VStack>
                    {
                        hasStatus && <VStack alignItems="flex-start">
                            <Text fontWeight="bold">Status:</Text>
                            {
                                isLoadingStatus ?
                                    <Text>Loading...</Text>
                                    :
                                    statuses.map((status) => <Text key={status.index}>{status.shortDescription}</Text>)
                            }
                        </VStack>
                    }
                    {
                        canExecute && <RSubmitButton onSuccess={() => checkStatus()} onClick={() => executeMessage(txHash, statuses, signer)}>
                            Execute
                        </RSubmitButton>
                    }
                </VStack>
        }
    </Container>
}