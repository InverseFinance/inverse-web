import { UseToastOptions } from "@chakra-ui/react"
import { TransactionReceipt, TransactionResponse } from '@ethersproject/providers'
import ScannerLink from '@inverse/components/common/ScannerLink';
import { NetworkIds } from '@inverse/types';
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

export const showTxToast = (txHash: string, txStatus: string, toastStatus: UseToastOptions["status"]) => {
    const chainId = localStorage.getItem('signerChainId') || NetworkIds.mainnet;
    const options: UseToastOptions = {
        id: txHash,
        title: `Transaction ${txStatus}`,
        description: <ScannerLink chainId={chainId} type="tx" value={txHash} shorten={true} />,
        status: toastStatus,
        duration: txStatus === 'success' ? 6000 : null,
    }
    return showToast(options);
}

export const handleTx = async (tx: TransactionResponse): Promise<void> => {
    if(!tx?.hash) { return }
    try {
        showTxToast(tx.hash, "pending", "info");
        const receipt: TransactionReceipt = await tx.wait();
        const msgObj = txStatusMessages[receipt?.status || '0'];
        showTxToast(tx.hash, msgObj.txStatus, msgObj.toastStatus);
    } catch (e: any) {
        showFailNotif(e, true);
    }
}