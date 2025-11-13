import { Modal } from '@app/components/common/Modal';
import { HStack, Stack, Text, VStack } from '@chakra-ui/react';
import { RefundableTransaction } from '@app/types';
import { InfoMessage } from '@app/components/common/Messages';
import { SubmitButton } from '@app/components/common/Button';
import { BigNumber } from 'ethers';
import { formatEther, parseEther } from '@ethersproject/units';
import { disperseEther } from '@app/util/contracts';
import { useWeb3React } from '@app/util/wallet';
import { TransactionResponse, Web3Provider } from '@ethersproject/providers';
import ScannerLink from '@app/components/common/ScannerLink';
import { submitRefunds } from '@app/util/governance';
import { showToast } from '@app/util/notify';
import { exportToCsv, roundFloorString } from '@app/util/misc';
import { namedAddress } from '@app/util';

type Props = {
    txs: RefundableTransaction[]
    isOpen: boolean
    onClose: () => void
    onSuccess: () => any
    handleExportCsv: () => any
}

export const RefundsModal = ({ txs, onSuccess, onClose, isOpen, handleExportCsv }: Props) => {
    const { provider } = useWeb3React<Web3Provider>();

    const totals: { [key: string]: BigNumber } = {};
    let overallTotal = BigNumber.from('0');
    txs.forEach(t => {
        if (!totals[t.from]) { totals[t.from] = BigNumber.from('0') }
        totals[t.from] = totals[t.from].add(parseEther(t.fees))
        overallTotal = overallTotal.add(parseEther(t.fees))
    })

    const breakdown = {};

    txs.forEach(t => {
        if (!breakdown[t.from]) { breakdown[t.from] = [] }
        breakdown[t.from].push(t);
    });

    const handleClose = () => {
        onClose();
    }

    const handleSubmit = (totals) => {
        const inputs = Object.entries(totals).map(([address, value]) => ({ address, value: formatEther(value) }));
        return disperseEther(inputs, provider?.getSigner());
    }

    // const handleSuccess = async (tx: TransactionResponse) => {
    //     const res = await submitRefunds(txs, tx.hash);
    //     if (res?.status && res?.message) {
    //         const statusType = ["success", "warning", "info", "error"].includes(res?.status) ? res?.status : 'info';
    //         showToast({ status: statusType, description: res?.message });
    //     }
    //     onSuccess();
    // }

    const handleTotalsExportCsv = () => {
        const data = Object.entries(breakdown)
            .map(([ad, txs]) => {
                return {
                    From: ad,
                    FromName: namedAddress(ad),
                    NbTxs: txs.length,
                    TotalFees: formatEther(totals[ad]),
                };
            });
        data.sort((a, b) => parseFloat(roundFloorString(b.TotalFees)) - parseFloat(roundFloorString(a.TotalFees)))
        exportToCsv(data, 'refunds-totals');
    }

    const handleRemove = async () => {
        return submitRefunds(txs, '', () => onSuccess(), provider?.getSigner());
    }

    const handleResolve = async () => {
        const txHash = window.prompt('Transaction hash of the Refund TX');
        if(!txHash) {
            return new Promise((resolve) => resolve(false));
        }
        return submitRefunds(txs, txHash, () => onSuccess(), provider?.getSigner());
    }

    return (
        <Modal
            onClose={handleClose}
            isOpen={isOpen}
            scrollBehavior={'inside'}
            header={
                <Stack minWidth={24} direction="row" align="center" >
                    <Text>Inspecting {txs.length} Tx{txs.length > 0 ? 's' : ''}</Text>
                </Stack>
            }
            footer={
                <VStack w='full' spacing="4">
                    <InfoMessage
                        alertProps={{ fontSize: ' 12px', w: 'full' }}
                        description={<>
                            OVERALL TOTAL: <b>{formatEther(overallTotal)}</b>
                        </>}
                    />
                    <HStack spacing="2">
                        <SubmitButton themeColor="blue.500" onClick={() => handleExportCsv()}>
                            EXPORT TXS
                        </SubmitButton>
                        <SubmitButton themeColor="blue.500" onClick={() => handleTotalsExportCsv()}>
                            EXPORT SUBTOTALS
                        </SubmitButton>
                    </HStack>
                    <HStack spacing="2">
                        <SubmitButton themeColor="orange.500" onClick={() => handleRemove()}>
                            Remove TXS
                        </SubmitButton>
                        <SubmitButton onClick={() => handleSubmit(totals)}>
                            SEND ETH
                        </SubmitButton>
                        <SubmitButton themeColor="green.500" onClick={() => handleResolve()}>
                            Resolve TXS
                        </SubmitButton>
                    </HStack>
                </VStack>
            }
        >
            <Stack p={4} w="full" spacing={4}>
                {
                    Object.entries(breakdown).map(([ad, txs]) =>
                        <VStack alignItems="flex-start" key={ad}>
                            <ScannerLink type="address" value={ad} fontWeight="bold" />
                            <VStack pl="5" alignItems="flex-start">
                                {
                                    txs.map(tx => <HStack key={tx.txHash}>
                                        <ScannerLink type="tx" value={tx.txHash} label={tx.name} />
                                        <Text>{tx.fees}</Text>
                                    </HStack>)
                                }
                                {
                                    txs.length > 1
                                    && <Text>Subtotal: {formatEther(totals[ad])}</Text>
                                }
                            </VStack>
                        </VStack>
                    )
                }
            </Stack>
        </Modal>
    )
}