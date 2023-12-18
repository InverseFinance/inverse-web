import SafeAppsSDK from '@safe-global/safe-apps-sdk/dist/src/sdk';
import { getNetworkConfigConstants } from './networks';
import { genTransactionParams } from './web3';
import { BURN_ADDRESS } from '@app/config/constants';

const { INV, XINV } = getNetworkConfigConstants();

export const safeMultisigDelegateInv = async (delegatee: string, escrow?: string) => {
    const SDK = new SafeAppsSDK();

    const txs = [
        genTransactionParams(INV, 'function delegate(address)', [delegatee]),
        genTransactionParams(XINV, 'function delegate(address)', [delegatee]),
    ];

    if(!!escrow && escrow !== BURN_ADDRESS) {
        txs.push(
            genTransactionParams(escrow, 'function delegate(address)', [delegatee])
        );
    }

    await SDK.txs.send({
        txs,
    });
}
