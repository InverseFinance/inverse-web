import { getMultiDelegatorContract } from './contracts';
import { JsonRpcSigner, TransactionResponse } from '@ethersproject/providers';
import { getINVContract } from '@inverse/util/contracts';
import { isAddress, splitSignature } from 'ethers/lib/utils'
import { BigNumber } from 'ethers'
import localforage from 'localforage';

export const getDelegationSig = (signer: JsonRpcSigner, delegatee: string): Promise<string> => {
    return new Promise(async (resolve, reject) => {
        try {
            if (!signer || !delegatee) { resolve('') }
            const chainId = signer?.provider?.network?.chainId;
            const account = await signer.getAddress();
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
        if (!sigObj.sig) { return false }
        if (!sigObj.nonce) { return false }
        if (!sigObj.expiry) { return false }
        if (!sigObj.chainId) { return false }
        if (!isAddress(sigObj.signer)) { return false }
    } catch (e) {
        return false;
    }
    return true;
}

// delegateBySig(address delegatee, address[] delegator, uint256[] nonce, uint256[] expiry, uint8[] v, bytes32[] r, bytes32[] s)
export const submitMultiDelegation = async (signer: JsonRpcSigner, signatures: string[], delegatee?: string): Promise<TransactionResponse> => {
    return new Promise(async (resolve, reject) => {
        try {
            const contract = getMultiDelegatorContract(signer);
            const signerAddress = await signer.getAddress();
            const signatureObjects = signatures.map(sig => JSON.parse(sig));
            const vrs = signatureObjects.map(sigObj => splitSignature(sigObj.sig));

            const promise = contract.delegateBySig(
                delegatee || signerAddress,
                signatureObjects.map(sigObj => sigObj.signer),
                signatureObjects.map(sigObj => BigNumber.from(sigObj.nonce)),
                signatureObjects.map(sigObj => BigNumber.from(sigObj.expiry)),
                vrs.map(splittedSig => splittedSig.v),
                vrs.map(splittedSig => splittedSig.r),
                vrs.map(splittedSig => splittedSig.s),
            );
            resolve(promise);
        } catch(e) {
            console.log(e);
            reject(e);
        }
    })
}

export const storeDelegationsCollected = (delegationSignatures: string[]) => {
    localforage.setItem('signaturesCollected', delegationSignatures);
}

export const getStoredDelegationsCollected = async (): Promise<string[] | null> => {
    return await localforage.getItem('signaturesCollected');
}

export const clearStoredDelegationsCollected = (): void => {
    localforage.removeItem('signaturesCollected');
}