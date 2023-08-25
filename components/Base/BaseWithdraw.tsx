import { useEffect, useState } from "react";
import { MsgStatusItem, WithdrawalItem, getBaseProvider, getMessenger, getTransactionsStatuses } from "@app/util/base";
import { MessageStatus } from '@eth-optimism/sdk'
import { useWeb3React } from "@web3-react/core";
import { VStack, Text } from "@chakra-ui/react";
import { InfoMessage } from "../common/Messages";
import Container from "../common/Container";
import { Input } from "../common/Input";
import { RSubmitButton } from "../common/Button/RSubmitButton";

export const BaseWithdraw = ({
    transactionItem,
    onSuccess,
    ...props,
}: {
    transactionItem: WithdrawalItem | undefined
    onSuccess: () => void
}) => {
    const { provider, account } = useWeb3React();
    const [txHash, setTxHash] = useState(transactionItem?.hash || '');
    const [statuses, setStatuses] = useState<MsgStatusItem[]>(transactionItem?.statuses || []);
    const [isLoadingStatus, setIsLoadingStatus] = useState(false);

    useEffect(() => {
        setTxHash(transactionItem?.hash || '');
        setStatuses(transactionItem?.statuses || []);
        setIsLoadingStatus(false);
    }, [transactionItem?.hash]);

    const checkStatus = async () => {
        if(!provider?.getSigner()) return;
        const results = await getTransactionsStatuses([txHash], provider?.getSigner());
        const statuses = results[0];
        setIsLoadingStatus(true);
        setStatuses(statuses);
        setIsLoadingStatus(false);
    }

    const canExecute = statuses.some(
        (message) =>
            message.status === MessageStatus.READY_TO_PROVE || message.status === MessageStatus.READY_FOR_RELAY
    );

    const executeMessage = async () => {
        if(!provider?.getSigner()) return
        console.log(
            'Execute button pressed. Current message status:',
            statuses,
        )
        if (txHash) {
            const messenger = getMessenger(provider?.getSigner(), getBaseProvider()!);

            for (const { status, index } of statuses) {
                console.log('Executing message at index:', index)
                if (status === MessageStatus.READY_TO_PROVE) {
                    console.log('Proving message...')
                    return messenger.proveMessage(txHash, undefined, index)
                } else if (status === MessageStatus.READY_FOR_RELAY) {
                    console.log('Relaying message...')
                    return messenger.finalizeMessage(txHash, undefined, index)
                }
            }
        }
    }

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
                        canExecute && <RSubmitButton onSuccess={() => checkStatus()} onClick={() => executeMessage()}>
                            Execute
                        </RSubmitButton>
                    }
                </VStack>
        }
    </Container>
}