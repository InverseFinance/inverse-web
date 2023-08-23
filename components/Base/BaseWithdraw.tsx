import { useEffect, useState } from "react";
import { MsgStatusItem, WithdrawalItem, getMessenger, getTransactionsStatuses } from "@app/util/base";
import { MessageStatus } from '@eth-optimism/sdk'
import { useWeb3React } from "@web3-react/core";
import { VStack, Text } from "@chakra-ui/react";
import { InfoMessage } from "../common/Messages";
import Container from "../common/Container";
import { Input } from "../common/Input";
import { RSubmitButton } from "../common/Button/RSubmitButton";

export const BaseWithdraw = ({
    transactionItem,
}: {
    transactionItem: WithdrawalItem | undefined
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
        const results = await getTransactionsStatuses([txHash], provider);
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
        console.log(
            'Execute button pressed. Current message status:',
            statuses,
        )
        if (txHash) {
            const messenger = getMessenger(provider);

            for (const { status, index } of statuses) {
                console.log('Executing message at index:', index)
                if (status === MessageStatus.READY_TO_PROVE) {
                    console.log('Proving message...')
                    await messenger.proveMessage(txHash, undefined, index)
                    console.log('Message proved.')
                } else if (status === MessageStatus.READY_FOR_RELAY) {
                    console.log('Relaying message...')
                    await messenger.finalizeMessage(txHash, undefined, index)
                    console.log('Message relayed.')
                }
            }
        }
    }

    const hasStatus = statuses.length > 0;

    return <Container
        label="Prove / Relay withdraw"
        noPadding
        p="0"
    >
        {
            !account ? <InfoMessage alertProps={{ w: 'full' }} description="Please connect your wallet" />
                : <VStack spacing="4" alignItems="flex-start">
                    <VStack>
                        <Input placeholder="Base transaction hash to prove or finalize" fontSize="14px" w='600px' value={txHash} onChange={e => setTxHash(e.target.value)} />
                        <RSubmitButton disabled={!txHash} onClick={() => checkStatus()}>
                            {hasStatus ? 'Recheck' : 'Check'} status
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
                        canExecute && <RSubmitButton onClick={() => executeMessage()}>
                            Execute
                        </RSubmitButton>
                    }
                </VStack>
        }
    </Container>
}