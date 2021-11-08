import { UseToastOptions } from "@chakra-ui/react"
import { TransactionReceipt, TransactionResponse } from '@ethersproject/providers'
import ScannerLink from '@inverse/components/common/ScannerLink';
import { NetworkIds } from '@inverse/types';
import { showToast } from './notify';

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

// takes a transaction Promise and handles status through Toasts
export const txWrap = async (txPromise: Promise<any>): Promise<void> => {
    try {
        const tx: TransactionResponse = await txPromise;
        if (tx?.hash) {
            showTxToast(tx.hash, "pending", "info");
            const receipt: TransactionReceipt = await tx.wait();
            const msgObj = txStatusMessages[receipt?.status || '0'];
            showTxToast(tx.hash, msgObj.txStatus, msgObj.toastStatus);
        }
    } catch (e: any) {
        console.log(e);
        const msg = e?.error?.message || e?.data?.message || e.reason || e.message;
        if(e?.code === 4001) {
            showToast({
                title: 'Transaction canceled',
                status: 'warning',
                description: msg,
            })
        } else {
            showToast({
                title: 'Transaction prevented',
                status: 'warning',
                description: msg.substring(0, 200),
            })
        }
    }
}