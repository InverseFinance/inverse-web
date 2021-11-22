import { UseToastOptions } from "@chakra-ui/react"
import { TransactionReceipt, TransactionResponse } from '@ethersproject/providers'
import ScannerLink from '@inverse/components/common/ScannerLink';
import { CustomToastOptions, NetworkIds } from '@inverse/types';
import { showFailNotif, showToast } from './notify';

const txStatusMessages: { [key: string]: { txStatus: string, toastStatus: UseToastOptions["status"] } } = {
    '0': {
        txStatus: 'failed',
        toastStatus: 'error',
    },
    '1': {
        txStatus: 'success',
        toastStatus: 'success',
    }
}

export const showTxToast = (txHash: string, txStatus: string, toastStatus: CustomToastOptions["status"]) => {
    const chainId = localStorage.getItem('signerChainId') || NetworkIds.mainnet;
    const options: CustomToastOptions = {
        id: txHash,
        title: `Transaction ${txStatus}`,
        description: <ScannerLink chainId={chainId} type="tx" value={txHash} shorten={true} />,
        status: toastStatus,
        duration: txStatus === 'success' ? 6000 : null,
    }
    return showToast(options);
}

export const handleTx = async (
    tx: TransactionResponse,
    options?: { onSuccess?: (tx: TransactionResponse) => void, onFail?: (tx: TransactionResponse) => void, onPending?: (tx: TransactionResponse) => void },
): Promise<void> => {
    if (!tx?.hash) { return }
    try {
        if (options?.onPending) { options.onPending(tx) }
        showTxToast(tx.hash, "pending", "loading");
        const receipt: TransactionReceipt = await tx.wait();
        const msgObj = txStatusMessages[receipt?.status || '0'];
        showTxToast(tx.hash, msgObj.txStatus, msgObj.toastStatus);
        if (options?.onSuccess && receipt?.status === 1) { options.onSuccess(tx) }
        if (options?.onFail && receipt?.status === 0) { options.onFail(tx) }
    } catch (e: any) {
        if (options?.onFail) { options.onFail(tx) }
        showFailNotif(e, true);
    }
}