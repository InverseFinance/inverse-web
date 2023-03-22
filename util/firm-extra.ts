/**
 * Extra features specific to certain markets such as claiming rewards
 */

import { F2_ESCROW_ABI } from "@app/config/abis"
import { JsonRpcSigner } from "@ethersproject/providers";
import { Contract } from "ethers"

export const setRewardWeight = (escrow: string, newValueBps: string | number, signer: JsonRpcSigner) => {
    const contract = new Contract(escrow, F2_ESCROW_ABI, signer);
    return contract.setRewardWeight(newValueBps);
}