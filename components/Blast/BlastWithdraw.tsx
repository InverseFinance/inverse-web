import { useEffect, useState } from "react";
import { MsgStatusItem, WithdrawalItem, executeMessage, getTransactionsStatuses } from "@app/util/blast";
import { MessageStatus } from '@eth-optimism/sdk'
import { useWeb3React } from "@web3-react/core";
import { VStack, Text } from "@chakra-ui/react";
import { InfoMessage } from "../common/Messages";
import Container, { AppContainerProps } from "../common/Container";
import { Input } from "../common/Input";
import { RSubmitButton } from "../common/Button/RSubmitButton";
import { useAccount } from "@app/hooks/misc";
import { useAppTheme } from "@app/hooks/useAppTheme";

export const BlastWithdraw = ({
    transactionItem,
    onSuccess,
    ...props
}: {
    transactionItem: WithdrawalItem | undefined
    onSuccess: () => void
} & Partial<AppContainerProps>) => {
    const { themeStyles } = useAppTheme();
    const { provider } = useWeb3React();
    const account = useAccount();
    const [txHash, setTxHash] = useState(transactionItem?.hash || '');
    const [statuses, setStatuses] = useState<MsgStatusItem[]>(transactionItem?.statuses || []);
    const [isLoadingStatus, setIsLoadingStatus] = useState(false);
    const signer = provider?.getSigner();

    useEffect(() => {
        setTxHash(transactionItem?.hash || '');
    }, [transactionItem?.hash, transactionItem?.statuses]);

    useEffect(() => {
        setStatuses(transactionItem?.hash === txHash ? transactionItem?.statuses || [] : []);
        setIsLoadingStatus(false);
    }, [txHash, transactionItem?.hash, transactionItem?.statuses]);

    const checkStatus = async () => {
        if (!signer) return;
        setIsLoadingStatus(true);
        const results = await getTransactionsStatuses([txHash], signer);
        const statuses = results[0];
        setStatuses(statuses);
        setIsLoadingStatus(false);
    }

    const refresh = () => {
        checkStatus();
        onSuccess();
    }

    const canExecute = !!signer && !!txHash && statuses.some(
        (message) =>
            message.status === MessageStatus.READY_TO_PROVE || message.status === MessageStatus.READY_FOR_RELAY
    );

    const hasStatus = statuses.length > 0;
    const isInvalidTx = !!txHash && (txHash?.length !== 66 || !txHash.startsWith('0x'));

    return <Container
        label="Prove / Relay withdraw"
        description="The withdrawal transaction hash initiated on Blast"
        noPadding
        p="0"
        {...props}
    >
        {
            !account ? <InfoMessage alertProps={{ w: 'full' }} description="Please connect your wallet" />
                : <VStack w='full' spacing="4" alignItems="flex-start">
                    <VStack w='full'>
                        <Input borderColor={isInvalidTx ? `${themeStyles.colors.error}` : undefined} borderWidth={isInvalidTx ? '1px' : '0'} placeholder="Blast transaction hash to prove or finalize" fontSize="12px" value={txHash} onChange={e => setTxHash(e.target.value)} />
                        <RSubmitButton disabled={!txHash || isInvalidTx} onClick={() => checkStatus()}>
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
                        !isLoadingStatus && canExecute && <RSubmitButton onSuccess={() => refresh()} onClick={() => executeMessage(txHash, statuses, signer)}>
                            Execute
                        </RSubmitButton>
                    }
                </VStack>
        }
    </Container>
}