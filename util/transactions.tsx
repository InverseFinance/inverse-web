import { UseToastOptions } from "@chakra-ui/react"
import { TransactionReceipt, TransactionResponse } from '@ethersproject/providers'
import ScannerLink from '@inverse/components/common/ScannerLink';
import { getAbis } from '@inverse/config/abis';
import { CustomToastOptions, NetworkIds } from '@inverse/types';
import { Interface, LogDescription } from 'ethers/lib/utils';
import { showFailNotif, showToast } from './notify';

const txStatusMessages: { [key: string]: { txStatus: string, toastStatus: UseToastOptions["status"] } } = {
    '0': {
        txStatus: 'failed',
        toastStatus: 'error',
    },
    '1': {
        txStatus: 'success',
        toastStatus: 'success',
    },
    'opaqueFailure': {
        txStatus: '"success" but with a Failure event: no funds have been moved to avoid liquidation',
        toastStatus: 'warning',
    }
}

export const showTxToast = (txHash: string, txStatus: string, toastStatus: CustomToastOptions["status"]) => {
    const chainId = window.localStorage.getItem('signerChainId') || NetworkIds.mainnet;
    const options: CustomToastOptions = {
        id: txHash,
        title: `Transaction ${txStatus}`,
        description: <ScannerLink chainId={chainId} type="tx" value={txHash} shorten={true} />,
        status: toastStatus,
        duration: txStatus === 'success' ? 6000 : null,
    }
    return showToast(options);
}

export type HandleTxOptions = {
    onSuccess?: (tx: TransactionResponse) => void,
    onFail?: (tx: TransactionResponse) => void,
    onPending?: (tx: TransactionResponse) => void,
}

export const handleTx = async (
    tx: TransactionResponse,
    options?: HandleTxOptions,
): Promise<void> => {
    if (!tx?.hash) { return }
    try {
        if (options?.onPending) { options.onPending(tx) }
        showTxToast(tx.hash, "pending", "loading");
        const receipt: TransactionReceipt = await tx.wait();

        let hasOpaqueFailure = false;
        if (receipt?.logs?.length) {
            const events = getTransactionEvents(receipt, NetworkIds.mainnet);
            hasOpaqueFailure = !!events.find(event => event?.name === 'Failure');
        }
        const msgObj = txStatusMessages[hasOpaqueFailure ? 'opaqueFailure' : (receipt?.status || '0')];
        showTxToast(tx.hash, msgObj.txStatus, msgObj.toastStatus);

        if (options?.onFail && (receipt?.status === 0 || hasOpaqueFailure)) { options.onFail(tx) }
        else if (options?.onSuccess && receipt?.status === 1) { options.onSuccess(tx) }
    } catch (e: any) {
        if (options?.onFail) { options.onFail(tx) }
        showFailNotif(e, true);
    }
}

export const getTransactionEvents = (receipt: TransactionReceipt, chainId: string): Partial<LogDescription>[] => {
    try {
        const abi = getAbis(chainId)?.get(receipt.to);
        if (!abi) { return [] }
        const iface = new Interface(abi);

        const events = receipt.logs.map(log => {
            try {
                return iface.parseLog(log);
            } catch (e) {
                // event abi missing for this log
                return {};
            }
        });

        return events
    }
    catch (e) {
        return []
    }
}