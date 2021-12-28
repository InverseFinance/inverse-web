import { getMultiDelegatorContract, getGovernanceContract, getINVContract } from './contracts';
import { JsonRpcSigner, TransactionResponse } from '@ethersproject/providers';
import { AbiCoder, isAddress, splitSignature, parseUnits, FunctionFragment } from 'ethers/lib/utils'
import { BigNumber } from 'ethers'
import localforage from 'localforage';
import { ProposalFormFields, ProposalFormActionFields, ProposalFunction, GovEra, ProposalStatus, NetworkIds } from '@inverse/types';
import { CURRENT_ERA, GRACE_PERIOD_MS } from '@inverse/config/constants';

export const getDelegationSig = (signer: JsonRpcSigner, delegatee: string): Promise<string> => {
    return new Promise(async (resolve, reject) => {
        try {
            if (!signer || !delegatee) { resolve('') }
            const chainId = NetworkIds.mainnet;
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

export const submitMultiDelegation = async (signer: JsonRpcSigner, signatures: string[], delegatee?: string): Promise<TransactionResponse> => {
    return new Promise(async (resolve, reject) => {
        try {
            const contract = getMultiDelegatorContract(signer);
            const signerAddress = await signer.getAddress();
            const signatureObjects = signatures.map(sig => JSON.parse(sig));
            const vrs = signatureObjects.map(sigObj => splitSignature(sigObj.sig));

            // delegateBySig(address delegatee, address[] delegator, uint256[] nonce, uint256[] expiry, uint8[] v, bytes32[] r, bytes32[] s)
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
        } catch (e) {
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

export const getCallData = (action: ProposalFormActionFields) => {
    const abiCoder = new AbiCoder()
    return abiCoder.encode(
        action.args.map(arg => arg.type),
        action.args.map(arg => {
            if (arg.type === "bool" || arg.type === "bool[]") {
                return JSON.parse(arg.value);
            } else {
                return arg.value;
            }
        })
    )
}

export const getArgs = (fragment: FunctionFragment, calldata: string) => {
    const abiCoder = new AbiCoder()
    const types: any = fragment.inputs.map(v => ({ type: v.type, name: v.name }));
    const values = abiCoder.decode(
        types,
        calldata,
    );
    return types.map((t, i) => {
        return { ...t, value: values[i] }
    })
}

export const submitProposal = (signer: JsonRpcSigner, proposalForm: ProposalFormFields): Promise<TransactionResponse> => {
    return new Promise(async (resolve, reject) => {
        try {
            const contract = getGovernanceContract(signer, CURRENT_ERA);
            const { title, description, actions } = proposalForm;

            const text = `# ${title}\n${description}`

            const calldatas = actions.map(action => getCallData(action))

            // propose(address[] targets, uint256[] values, string[] signatures, bytes[] calldata, string description) public returns (uint)
            resolve(contract.propose(
                actions.map(a => a.contractAddress),
                actions.map(a => parseUnits((a.value || '0').toString())),
                actions.map(a => a.fragment!.format('sighash')),
                calldatas,
                text,
            ));
        } catch (e) {
            console.log(e);
            reject(e);
        }
    })
}

export const getFunctionsFromProposalActions = (actions: ProposalFormActionFields[]): ProposalFunction[] => {
    return actions.map(getFunctionFromProposalAction);
}

export const getFunctionFromProposalAction = (action: ProposalFormActionFields): ProposalFunction => {
    return {
        target: action.contractAddress,
        callData: getCallData(action),
        signature: action.fragment?.format('sighash') || '',
    }
}

export const getProposalActionFromFunction = (actionId: number, func: ProposalFunction): ProposalFormActionFields => {
    const fragment = FunctionFragment.from(func.signature);
    return {
        actionId,
        value: '',
        contractAddress: func.target,
        args: getArgs(fragment, func.callData),
        fragment,
        func: func.signature || '',
    }
}

export const queueProposal = (signer: JsonRpcSigner, era: GovEra, id: number) => {
    const govContract = getGovernanceContract(signer, era);
    return govContract.queue(id);
}

export const executeProposal = (signer: JsonRpcSigner, era: GovEra, id: number) => {
    const govContract = getGovernanceContract(signer, era);
    return govContract.execute(id);
}

export const getProposalStatus = (
    canceled: boolean,
    executed: boolean,
    eta: BigNumber,
    startBlock: BigNumber,
    endBlock: BigNumber,
    blockNumber: number,
    againstVotes: BigNumber,
    forVotes: BigNumber,
    quorumVotes: BigNumber,
) => {
    if (canceled) {
        return ProposalStatus.canceled;
    } else if (executed) {
        return ProposalStatus.executed;
    } else if (blockNumber <= startBlock.toNumber()) {
        return ProposalStatus.pending;
    } else if (blockNumber <= endBlock.toNumber()) {
        return ProposalStatus.active;
    } else if (forVotes.lte(againstVotes) || forVotes.lte(quorumVotes)) {
        return ProposalStatus.defeated;
    } else if (eta.isZero()) {
        return ProposalStatus.succeeded;
    } else if (Date.now() >= (eta.toNumber() * 1000) + GRACE_PERIOD_MS) {
        return ProposalStatus.expired;
    }
    return ProposalStatus.queued
}

export const saveLocalDraft = async (title: string, description: string, functions: ProposalFunction[]) => {
    try {
        const drafts: any[] = await localforage.getItem('proposal-drafts') || []
        const draftId = drafts.length + 1
        const newDraft = { title, description, functions, draftId };
        drafts.unshift(newDraft);
        await localforage.setItem('proposal-drafts', drafts);
        return draftId
    } catch (e) {
        return 0
    }
}

export const getLocalDrafts = async () => {
    return await localforage.getItem('proposal-drafts') || []
}