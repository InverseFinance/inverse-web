/**
 * Extra features specific to certain markets such as claiming rewards
 */

import { F2_ESCROW_ABI } from "@app/config/abis"
import { JsonRpcSigner } from "@ethersproject/providers";
import { Contract } from "ethers"

// Only for cvxCRV escrow
export const setRewardWeight = (escrow: string, newValueBps: string | number, signer: JsonRpcSigner) => {
    const contract = new Contract(escrow, F2_ESCROW_ABI, signer);
    return contract.setRewardWeight(newValueBps);
}

// Generic claim function for an escrow with rewards
export const claim = (escrow: string, signer: JsonRpcSigner, methodName = 'claim') => {
    const contract = new Contract(escrow, F2_ESCROW_ABI, signer);
    return contract[methodName]();
}

export const claimTo = (escrow: string, to: string, signer: JsonRpcSigner, methodName = 'claim') => {
    const contract = new Contract(escrow, F2_ESCROW_ABI, signer);
    return contract[methodName](to);
}