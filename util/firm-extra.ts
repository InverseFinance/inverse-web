/**
 * Extra features specific to certain markets such as claiming rewards
 */

import { F2_ESCROW_ABI, ST_CVX_CRV_ABI } from "@app/config/abis"
import { JsonRpcSigner } from "@ethersproject/providers";
import { Contract } from "ethers"

// Only for cvxCRV escrow
export const setRewardWeight = (escrow: string, newValueBps: string | number, signer: JsonRpcSigner) => {
    const contract = new Contract(escrow, F2_ESCROW_ABI, signer);
    return contract.setRewardWeight(newValueBps);
}

export const getCvxCrvRewards = (escrow: string, signer: JsonRpcSigner) => {
    const contract = new Contract('0xaa0C3f5F7DFD688C6E646F66CD2a6B66ACdbE434', ST_CVX_CRV_ABI, signer);
    return contract.callStatic.earned(escrow);
}

// Generic claim function for an escrow with rewards
export const claim = (escrow: string, signer: JsonRpcSigner, methodName = 'claim') => {
    const contract = new Contract(escrow, F2_ESCROW_ABI, signer);
    return contract[methodName]();
}

export const claimTo = (escrow: string, to: string, signer: JsonRpcSigner, methodName = 'claimTo') => {
    const contract = new Contract(escrow, F2_ESCROW_ABI, signer);
    return contract[methodName](to);
}