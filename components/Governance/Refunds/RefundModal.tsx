import { Modal } from '@app/components/common/Modal';
import { HStack, Stack, Text, VStack } from '@chakra-ui/react';
import { RefundableTransaction } from '@app/types';
import { InfoMessage } from '@app/components/common/Messages';
import { SubmitButton } from '@app/components/common/Button';
import { BigNumber } from 'ethers';
import { formatEther, parseEther } from '@ethersproject/units';
import { disperseEther } from '@app/util/contracts';
import { useWeb3React } from '@web3-react/core';
import { TransactionResponse, Web3Provider } from '@ethersproject/providers';
import ScannerLink from '@app/components/common/ScannerLink';
import { submitRefunds } from '@app/util/governance';

type Props = {
    txs: RefundableTransaction[]
    isOpen: boolean
    onClose: () => void
    onSuccess: (p: any) => any
}

export const RefundsModal = ({ txs, onSuccess, onClose, isOpen }: Props) => {
    const { library } = useWeb3React<Web3Provider>();

    const totals = {};
    let overallTotal = BigNumber.from('0');
    txs.forEach(t => {
        if (!totals[t.from]) { totals[t.from] = BigNumber.from('0') }
        totals[t.from] = totals[t.from].add(parseEther(t.fees))
        overallTotal = overallTotal.add(parseEther(t.fees))
    })

    const breakdown = {}
    txs.forEach(t => {
        if (!breakdown[t.from]) { breakdown[t.from] = [] }
        breakdown[t.from].push(t);
    })

    const handleClose = () => {
        onClose();
    }

    const handleSubmit = (totals) => {
        const inputs = Object.entries(totals).map(([address, value]) => ({ address, value: formatEther(value) }));
        return disperseEther(inputs, library?.getSigner());
    }

    const handleSuccess = (tx: TransactionResponse) => {
        return submitRefunds(txs, tx.hash, library?.getSigner(), onSuccess)
    }

    return (
        <Modal
            onClose={handleClose}
            isOpen={isOpen}
            scrollBehavior={'inside'}
            header={
                <Stack minWidth={24} direction="row" align="center" >
                    <Text>Execute {txs.length} Refund{txs.length > 0 ? 's' : ''}</Text>
                </Stack>
            }
            footer={
                <VStack w='full'>
                    <InfoMessage
                        alertProps={{ fontSize: ' 12px', w: 'full' }}
                        description={<>
                            OVERALL TOTAL: <b>{formatEther(overallTotal)}</b>
                        </>} />
                    <SubmitButton onClick={() => handleSubmit(totals)} onSuccess={handleSuccess}>
                        SEND ETH
                    </SubmitButton>
                </VStack>
            }
        >
            <Stack p={4} w="full" spacing={4}>
                {
                    Object.entries(breakdown).map(([ad, txs]) =>
                        <VStack alignItems="flex-start" key={ad}>
                            <ScannerLink value={ad} fontWeight="bold" />
                            <VStack pl="5" alignItems="flex-start">
                                {
                                    txs.map(tx => <HStack key={tx.txHash}>
                                        <ScannerLink value={tx.txHash} label={tx.name} />
                                        <Text>{tx.fees}</Text>
                                    </HStack>)
                                }
                                {
                                    txs.length > 1
                                    && <Text>Subtotal: {formatEther(txs.reduce((prev, curr) => prev.add(parseEther(curr.fees)), BigNumber.from('0')))}</Text>
                                }
                            </VStack>
                        </VStack>
                    )
                }
            </Stack>
        </Modal>
    )
}