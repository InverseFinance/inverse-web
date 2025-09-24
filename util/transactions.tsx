import { UseToastOptions } from "@chakra-ui/react"
import { Log, TransactionReceipt, TransactionResponse } from '@ethersproject/providers'
import ScannerLink from '@app/components/common/ScannerLink';
import { getAbis } from '@app/config/abis';
import { CustomToastOptions, NetworkIds } from '@app/types';
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
    const chainId = window.localStorage.getItem('signerChainId') || process.env.NEXT_PUBLIC_CHAIN_ID!;
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
    onSuccess?: (tx: TransactionResponse, receipt?: any) => void,
    onFail?: (tx: TransactionResponse) => void,
    onPending?: (tx: TransactionResponse) => void,
}

// some rpc providers might throws this error like more recent Geth versions
async function waitIgnoringIndexingErr(tx: TransactionResponse, confirms = 1, pollMs = 4000) {
    while (true) {
        try {
            return await tx.wait(confirms);
        } catch (e: any) {
            const msg = (e?.message || "").toLowerCase();
            if (msg.includes("transaction indexing is in progress")) {
                await new Promise(r => setTimeout(r, pollMs));
                continue; // keep polling
            }
            throw e; // bubble up other errors
        }
    }
}

export const handleTx = async (
    tx: TransactionResponse,
    options?: HandleTxOptions,
): Promise<void> => {
    if (!tx?.hash) { return }
    try {
        if (options?.onPending) { options.onPending(tx) }
        showTxToast(tx.hash, "pending", "loading");
        const receipt: TransactionReceipt = await waitIgnoringIndexingErr(tx);

        let hasOpaqueFailure = false;
        if (receipt?.logs?.length) {
            const events = getTransactionEvents(receipt, process.env.NEXT_PUBLIC_CHAIN_ID!);
            hasOpaqueFailure = !!events.find(event => event?.name === 'Failure');
        }
        const msgObj = txStatusMessages[hasOpaqueFailure ? 'opaqueFailure' : (receipt?.status || '0')];
        showTxToast(tx.hash, msgObj.txStatus, msgObj.toastStatus);

        if (options?.onFail && (receipt?.status === 0 || hasOpaqueFailure)) { options.onFail(tx) }
        else if (options?.onSuccess && receipt?.status === 1) { options.onSuccess(tx, receipt) }
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

export const parseLog = (log: Log, abi: any) => {
    try {
        const iface = new Interface(abi);
        return iface.parseLog(log);
    }
    catch (e) {
        return null
    }
}