import { getMultiDelegatorContract } from './contracts';
import { JsonRpcSigner } from '@ethersproject/providers';
import { getINVContract } from '@inverse/util/contracts';
import { isAddress } from 'ethers/lib/utils'

export const getDelegationSig = (signer: JsonRpcSigner, delegatee: string): Promise<string> => {
    return new Promise(async (resolve, reject) => {
        try {
            if(!signer || !delegatee) { resolve('') }
            const chainId = signer?.provider?.network?.chainId;
            const account = await signer.getAddress();
            const contract = getMultiDelegatorContract(signer);
            const invContract = getINVContract(signer);

            const domain = { name: 'Inverse DAO', chainId, verifyingContract: invContract.address }

            const types = {
                Delegation: [
                    { name: 'delegatee', type: 'address' },
                    { name: 'nonce', type: 'uint256' },
                    { name: 'expiry', type: 'uint256' },
                ],
            }

            const value = {
                delegatee: delegatee,
                nonce: (await invContract.nonces(account)).toString(),
                expiry: 10e9,
            }

            const signature = await signer._signTypedData(domain, types, value)

            resolve(
                JSON.stringify({
                    sig: signature,
                    nonce: value.nonce,
                    expiry: value.expiry,
                    chainId,
                    signer: account,
                })
            )
        } catch (e) {
            reject(e);
        }
        resolve('');
    })
}

export const isValidSignature = (sig: string): boolean => {
    try {
        const sigObj = JSON.parse(sig);
        if(!sigObj.sig) { return false }
        if(!sigObj.nonce) { return false }
        if(!sigObj.expiry) { return false }
        if(!sigObj.chainId) { return false }
        if(!isAddress(sigObj.signer)) { return false }
    } catch(e) {
        return false;
    }
    return true;
}