/**
 * Extra features specific to certain markets such as claiming rewards
 */

import { CONVEX_REWARD_POOL, DBR_REWARDS_HELPER_ABI, F2_ESCROW_ABI, ST_CVX_CRV_ABI } from "@app/config/abis"
import { JsonRpcSigner } from "@ethersproject/providers";
import { BigNumber, Contract } from "ethers"
import { getBnToNumber } from "./markets";
import { getNetworkConfigConstants } from "./networks";
import { BURN_ADDRESS } from "@app/config/constants";
import { callWithHigherGL } from "./contracts";

const { F2_DBR_REWARDS_HELPER } = getNetworkConfigConstants();

// Only for cvxCRV escrow
export const setRewardWeight = (escrow: string, newValueBps: string | number, signer: JsonRpcSigner) => {
    const contract = new Contract(escrow, F2_ESCROW_ABI, signer);
    return contract.setRewardWeight(newValueBps);
}

export const getCvxCrvRewards = (escrow: string, signer: JsonRpcSigner) => {
    const contract = new Contract('0xaa0C3f5F7DFD688C6E646F66CD2a6B66ACdbE434', ST_CVX_CRV_ABI, signer);
    return contract.callStatic.earned(escrow);
}

export const getCvxRewards = async (escrow: string, signer: JsonRpcSigner) => {
    const contract = new Contract('0xCF50b810E57Ac33B91dCF525C6ddd9881B139332', CONVEX_REWARD_POOL, signer);
    const extraRewardsLength = await contract.extraRewardsLength();
    const extraRewards = [];
    for (let i = 0; i < extraRewardsLength; i++) {
        const extraReward = await contract.extraRewards(i);
        extraRewards.push(extraReward);
    }
    const earned = await contract.earned(escrow);
    return {
        extraRewardsLength: getBnToNumber(extraRewardsLength, 0),
        earned,
        extraRewards,
    }
}

// Generic claim function for an escrow with rewards
export const claim = async (escrow: string, signer: JsonRpcSigner, methodName = 'claim', extraRewards?: string[]) => {
    if (extraRewards?.length) {
        return claimTo(escrow, await signer.getAddress(), signer, methodName, extraRewards);
    }
    const contract = new Contract(escrow, F2_ESCROW_ABI, signer);
    return contract[methodName]();
}

export const claimTo = (escrow: string, to: string, signer: JsonRpcSigner, methodName = 'claimTo', extraRewards?: string[]) => {
    const contract = new Contract(escrow, F2_ESCROW_ABI, signer);
    if (extraRewards?.length) {
        return contract[methodName](to, extraRewards);
    }
    return contract[methodName](to);
}

// struct ClaimAndSell {
//     address toDbr; // Address to receive leftover DBR
//     address toDola; // Address to receive DOLA
//     address toInv; // Address to receive INV deposit
//     uint256 minOutDola;
//     uint256 sellForDola; // Percentage of claimed DBR swapped for DOLA (in basis points)
//     uint256 minOutInv;
//     uint256 sellForInv; // Percentage of claimed DBR swapped for INV (in basis points)
// }

// struct Repay {
//     address market;
//     address to;
//     uint256 percentage; // Percentage of DOLA swapped from claimed DBR to use for repaying debt (in basis points)
// }

export const claimDbrAndSell = async (
    signer: JsonRpcSigner,
    claimAndSellData: any,
    repayData: any,
) => {
    const contract = new Contract(F2_DBR_REWARDS_HELPER, DBR_REWARDS_HELPER_ABI, signer);
    return callWithHigherGL(contract, 'claimAndSell', [claimAndSellData, repayData], 90000);    
}

export const claimDbrAndSellForDola = async (minDolaOut: BigNumber, signer: JsonRpcSigner, destinationAddress: string) => {
    const contract = new Contract(F2_DBR_REWARDS_HELPER, DBR_REWARDS_HELPER_ABI, signer);    
    const exchangeData = [destinationAddress, destinationAddress, destinationAddress, minDolaOut, '10000', '0', '0'];
    const repayData = [BURN_ADDRESS, BURN_ADDRESS, '0'];
    return contract.claimAndSell(exchangeData, repayData);
}

export const claimDbrSellAndRepay = async (minDolaOut: BigNumber, market: string, signer: JsonRpcSigner, destinationAddress: string) => {
    const contract = new Contract(F2_DBR_REWARDS_HELPER, DBR_REWARDS_HELPER_ABI, signer);    
    const exchangeData = [destinationAddress, destinationAddress, destinationAddress, minDolaOut, '10000', '0', '0'];
    const repayData = [market, destinationAddress, '10000'];
    return contract.claimAndSell(exchangeData, repayData);
}

export const claimDbrSellAndDepositInv = async (minInvOut: BigNumber, signer: JsonRpcSigner, destinationAddress: string) => {
    const contract = new Contract(F2_DBR_REWARDS_HELPER, DBR_REWARDS_HELPER_ABI, signer);    
    const exchangeData = [destinationAddress, destinationAddress, destinationAddress, '0', '0', minInvOut, '10000'];
    const repayData = [BURN_ADDRESS, BURN_ADDRESS, '0'];
    return contract.claimAndSell(exchangeData, repayData);
}