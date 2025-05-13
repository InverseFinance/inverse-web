import { getMultiDelegatorContract, getGovernanceContract, getINVContract } from './contracts';
import { JsonRpcSigner, TransactionReceipt, TransactionResponse } from '@ethersproject/providers';
import { AbiCoder, isAddress, splitSignature, FunctionFragment, verifyMessage, ParamType } from 'ethers/lib/utils'
import { BigNumber } from 'ethers'
import localforage from 'localforage';
import { ProposalFormFields, ProposalFormActionFields, ProposalFunction, GovEra, ProposalStatus, NetworkIds, DraftProposal, DraftReview, RefundableTransaction } from '@app/types';
import { CURRENT_ERA, SIGN_MSG, GRACE_PERIOD_MS, DRAFT_WHITELIST } from '@app/config/constants';
import { showToast } from './notify';

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
                    delegatee: value.delegatee,
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

export const submitMultiDelegation = async (signer: JsonRpcSigner, signatures: string[]): Promise<TransactionResponse> => {
    return new Promise(async (resolve, reject) => {
        try {
            const contract = getMultiDelegatorContract(signer);
            const signatureObjects = signatures.map(sig => JSON.parse(sig));
            const vrs = signatureObjects.map(sigObj => splitSignature(sigObj.sig));

            // delegateBySig(address delegatee, address[] delegator, uint256[] nonce, uint256[] expiry, uint8[] v, bytes32[] r, bytes32[] s)
            const promise = contract.delegateBySig(
                signatureObjects[0].delegatee,
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
    const abiCoder = new AbiCoder();
    return abiCoder.encode(
        action.args.map((arg, argIndex) => {
            return arg.type === "tuple" ? ParamType.fromObject(action.fragment.inputs[argIndex]!) : arg.type;
        }),
        action.args.map(arg => {
            if (arg.type === "bool" || arg.type === "bool[]" || arg.type === "tuple") {
                return JSON.parse(arg.value);
            } else {
                return arg.value;
            }
        })
    );
}

export const getArgs = (fragment: FunctionFragment, calldata: string) => {
    const abiCoder = new AbiCoder()
    const types: any = fragment.inputs.map((v, argIndex) => {
        return v.type === 'tuple' ? ParamType.fromObject(fragment.inputs[argIndex]!) : { type: v.type, name: v.name };
    });
    const values = abiCoder.decode(
        types,
        calldata,
    );
    return types.map((t, i) => {
        return { ...t, value: t.type === 'tuple' ? JSON.stringify(values[i]) : values[i] }
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
                actions.map(a => a.value || '0'),
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
        value: action.value || '',
    }
}

export const getProposalActionFromFunction = (actionId: number, func: ProposalFunction): ProposalFormActionFields => {
    const fragment = FunctionFragment.from(func.signature);
    return {
        actionId,
        value: !func.value || func.value === '0' ? '' : func.value,
        contractAddress: func.target,
        args: getArgs(fragment, func.callData),
        fragment,
        func: func.signature || '',
        collapsed: true,
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
    eta: number,
    startBlock: number,
    endBlock: number,
    blockNumber: number,
    againstVotes: number,
    forVotes: number,
    quorumVotes: number,
) => {
    if (canceled) {
        return ProposalStatus.canceled;
    } else if (executed) {
        return ProposalStatus.executed;
    } else if (blockNumber <= startBlock) {
        return ProposalStatus.pending;
    } else if (blockNumber <= endBlock) {
        return ProposalStatus.active;
    } else if (forVotes <= againstVotes || forVotes < quorumVotes) {
        return ProposalStatus.defeated;
    } else if (!eta) {
        return ProposalStatus.succeeded;
    } else if (Date.now() >= (eta * 1000) + GRACE_PERIOD_MS) {
        return ProposalStatus.expired;
    }
    return ProposalStatus.queued
}

export const saveLocalDraft = async (title: string, description: string, functions: ProposalFunction[], draftId?: number): Promise<number> => {
    try {
        const drafts: DraftProposal[] = await localforage.getItem('proposal-drafts') || []
        const id = draftId || (drafts.length + 1)
        const newDraft = { title, description, functions, draftId: id };

        if (draftId) {
            const oldDraft = drafts[drafts.findIndex(d => d.draftId === draftId)];
            drafts[drafts.findIndex(d => d.draftId === draftId)] = { ...oldDraft, ...newDraft, updatedAt: Date.now() };
        } else {
            drafts.unshift({ ...newDraft, createdAt: Date.now() });
        }

        await localforage.setItem('proposal-drafts', drafts);
        return id;
    } catch (e) {
        return 0
    }
}

export const removeLocalDraft = async (draftId: number): Promise<void> => {
    try {
        const drafts: DraftProposal[] = await localforage.getItem('proposal-drafts') || []
        const index = drafts.findIndex(d => d.draftId === draftId)
        drafts.splice(index, 1)
        await localforage.setItem('proposal-drafts', drafts);
    } catch (e) {

    }
}

export const getLocalDrafts = async (): Promise<DraftProposal[]> => {
    return await localforage.getItem('proposal-drafts') || []
}

export const clearLocalDrafts = () => localforage.removeItem('proposal-drafts')

export const publishDraft = async (
    title: string,
    description: string,
    functions: ProposalFunction[],
    signer: JsonRpcSigner,
    draftId?: number,
    onSuccess?: (id: number) => void,
): Promise<any> => {
    try {
        const sig = await signer.signMessage(SIGN_MSG);
        const rawResponse = await fetch(`/api/drafts${draftId ? `/${draftId}` : ''}`, {
            method: draftId ? 'PUT' : 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ title, description, functions, sig })
        });
        const result = await rawResponse.json();
        if (onSuccess && !!result.publicDraftId) { onSuccess(result.publicDraftId) }
        return result;
    } catch (e: any) {
        return { status: 'warning', message: e.message || 'An error occured' }
    }
}

export const deleteDraft = async (publicDraftId: number, signer: JsonRpcSigner, onSuccess?: () => void) => {
    try {
        const sig = await signer.signMessage(SIGN_MSG);
        const rawResponse = await fetch(`/api/drafts/${publicDraftId}`, {
            method: 'DELETE',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ sig })
        });
        const result = await rawResponse.json();
        if (onSuccess) { onSuccess() }
        return result;
    } catch (e: any) {
        return { status: 'warning', message: e.message || 'An error occured' }
    }
}

export const linkDraft = async (publicDraftId: number, proposalId: string, signer: JsonRpcSigner, onSuccess?: () => void) => {
    showToast({ status: 'loading', id: 'linkDraft', title: 'Link Proof of Reviews to Proposal', description: 'Sign to proceed' , duration: null });
    return new Promise(async (resolve) => {
        try {
            const sig = await signer.signMessage(SIGN_MSG);
            showToast({ status: 'loading', id: 'linkDraft', title: 'Link Proof of Reviews to Proposal', description: 'Linking...' , duration: null });
            const triggerProposalsResult = await triggerProposalUpdate(signer, sig);

            const rawResponse = await fetch(`/api/drafts/${publicDraftId}`, {
                method: 'PUT',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ sig, proposalId })
            });
            const result = await rawResponse.json();

            const isSuccess = result.status === 'success';
            if (onSuccess && isSuccess) { onSuccess() }
            showToast({
                status: isSuccess ? 'success' : 'warning',
                id: 'linkDraft',
                title: 'Link Proof of Reviews to Proposal',
                description: result.message,
                duration: 6000,
            });

            if(triggerProposalsResult.success && !result.skipRedirect){
                window.location.href = `/governance/proposals/${CURRENT_ERA}/${proposalId}`;
            }
            resolve(result);
        } catch (e: any) {
            showToast({
                status: 'warning',
                id: 'linkDraft',
                title: 'Link Proof of Reviews to Proposal',
                description: 'Linking failed',
                duration: 6000,
            });
            resolve({ status: 'warning', message: e.message || 'An error occured' })
        }
    })
}

export const isProposalActionInvalid = (action: ProposalFormActionFields) => {
    if (action.contractAddress.length === 0) return true;
    if (action.func.length === 0) return true;
    if (action.fragment === undefined) return true;
    for (const arg of action.args) {
        if (arg.value.length === 0) return true;
    }
    try {
        getFunctionsFromProposalActions([action]);
    } catch (e) {
        return true
    }
    return false
}

export const isProposalFormInvalid = ({ title, description, actions }: ProposalFormFields) => {
    if (title.length === 0) return true;
    if (description.length === 0) return true;
    if (actions.length > 20) return true;
    for (const action of actions) {
        if (isProposalActionInvalid(action)) { return true }
    }
    try {
        getFunctionsFromProposalActions(actions);
    } catch (e) {
        return true
    }
    return false;
}

export const getReadGovernanceNotifs = async (): Promise<string[]> => {
    return await localforage.getItem('read-governance-notifs') || [];
}

export const getLastNbNotif = async (): Promise<number> => {
    const lastFromStorage = window.localStorage.getItem('last-nb-notifs');
    return Number((lastFromStorage !== null ? lastFromStorage : await localforage.getItem('last-nb-notifs')) || 0);
}

export const setLastNbNotif = (nbNotif: number): void => {
    localforage.setItem('last-nb-notifs', nbNotif);
    try {
        window.localStorage.setItem('last-nb-notifs', nbNotif.toString());
    } catch (e) { }
}

export const updateReadGovernanceNotifs = async (readKey: string): Promise<void> => {
    const current = await getReadGovernanceNotifs();
    if (current.includes(readKey)) { return }
    current.push(readKey);
    await localforage.setItem('read-governance-notifs', current);
}

export const sendDraftReview = async (
    signer: JsonRpcSigner,
    draftId: number,
    status: boolean,
    comment: string,
    onSuccess: (reviews: DraftReview[]) => void,
): Promise<any> => {
    try {
        const sig = await signer.signMessage(SIGN_MSG);

        const rawResponse = await fetch(`/api/drafts/reviews/${draftId}`, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status, comment, sig })
        });
        const result = await rawResponse.json();
        if (onSuccess && result.status === 'success') { onSuccess(result.reviews) }
        return result;
    } catch (e: any) {
        return { status: 'warning', message: e.message || 'An error occured' }
    }
}

export const simulateOnChainActions = async (
    form: any,
    onResult: (reviews: DraftReview[]) => void,
): Promise<{
    hasError: boolean,
    receipts: TransactionReceipt[],
}> => {
    const continueOnSimId = window.prompt('Execute simulation as a continuation proposal of a previous Simulation (if yes, enter the public-ID, otherwise leave blank)?');
    try {
        const rawResponse = await fetch(`/api/drafts/sim?continueOnSimId=${continueOnSimId}`, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },            
            body: JSON.stringify(form)
        });
        const result = await rawResponse.json();
        if (onResult) { onResult(result) }
        return result;
    } catch (e: any) {
        return { status: 'warning', message: e.message || 'An error occured' }
    }
}

export const submitRefunds = async (
    txs: RefundableTransaction[],
    refundTxHash?: string,
    onSuccess?: (updated: RefundableTransaction[]) => void,
    signer?: JsonRpcSigner,
): Promise<any> => {
    try {
        let sig;
        if (signer) {
            sig = await signer.signMessage(SIGN_MSG);
        }
        const rawResponse = await fetch(`/api/gov/submit-refunds`, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ refunds: txs.map(t => ({ ...t, checked: undefined })), refundTxHash, sig })
        });
        const result = await rawResponse.json();
        if (onSuccess && result.status === 'success') { onSuccess(result) }
        return result;
    } catch (e: any) {
        return { status: 'warning', message: e.message || 'An error occured' }
    }
}

export const addTxToRefund = async (
    txHash: string,
    signer: JsonRpcSigner,
    onSuccess?: (updated: RefundableTransaction[]) => void,
): Promise<any> => {
    try {
        const sig = await signer.signMessage(SIGN_MSG);

        const rawResponse = await fetch(`/api/gov/add-tx`, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ txHash, sig })
        });
        const result = await rawResponse.json();
        if (onSuccess && result.status === 'success') { onSuccess(result) }
        return result;
    } catch (e: any) {
        return { status: 'warning', message: e.message || 'An error occured' }
    }
}

export const checkDraftRights = (sig: string) => {
    if (!sig) { return null }

    const sigAddress = verifyMessage(SIGN_MSG, sig).toLowerCase();

    if (!DRAFT_WHITELIST.includes(sigAddress)) {
        return null
    };

    return sigAddress;
}

export const triggerProposalUpdate = async (
    signer: JsonRpcSigner,
    sig?: string,
    onSuccess?: (result: any) => void,
): Promise<any> => {
    try {
        let _sig = sig || await signer.signMessage(SIGN_MSG)

        const rawResponse = await fetch(`/api/proposals`, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ sig: _sig })
        });
        const result = await rawResponse.json();
        if (onSuccess && result.success) { onSuccess(result) }
        return result;
    } catch (e: any) {
        return { status: 'warning', message: e.message || 'An error occured' }
    }
}

// No need for api, does not often change. not necessarily exact block numbers
export const getHistoricalGovParams = (block: number) => {
    if(block > 19069443) {
        return { quorum: 15500, threshold: 1900 };
    } else if(block > 15666400) {
        return { quorum: 9500, threshold: 1900 };
    } else if(block > 14834695) {
        return { quorum: 7000, threshold: 1400 };
    }
    return { quorum: 4000, threshold: 1000 };
}

export const getHistoricalGovParamsAsArray = (block: number) => {
    const params = getHistoricalGovParams(block);
    return [params.quorum, params.threshold];
}