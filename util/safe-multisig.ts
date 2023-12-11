import SafeAppsSDK from '@safe-global/safe-apps-sdk/dist/src/sdk';
import { getNetworkConfigConstants } from './networks';
import { genTransactionParams } from './web3';

const { INV, XINV } = getNetworkConfigConstants();

export const safeMultisigDelegateInv = async (delegatee: string) => {
    const SDK = new SafeAppsSDK();
    await SDK.txs.send({
        txs: [
            genTransactionParams(INV, 'function delegate(address)', [delegatee]),
            genTransactionParams(XINV, 'function delegate(address)', [delegatee]),
        ]
    });
}
