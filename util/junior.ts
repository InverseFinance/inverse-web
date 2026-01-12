import { Contract } from "ethers";
import { JDOLA_AUCTION_ABI, JUNIOR_ESCROW_ABI } from "@app/config/abis";
import { JsonRpcSigner } from "@ethersproject/providers";
import { parseEther } from "@ethersproject/units";
import { JDOLA_AUCTION_ADDRESS, JUNIOR_ESCROW_ADDRESS } from "@app/config/constants";

export const jdolaDeposit = async (amount: string, signer: JsonRpcSigner) => {
    const contract = new Contract(JDOLA_AUCTION_ADDRESS, JDOLA_AUCTION_ABI, signer);
    return contract.deposit(parseEther(amount));
}

export const jdolaWithdraw = async (amount: string, signer: JsonRpcSigner) => {
    const contract = new Contract(JDOLA_AUCTION_ADDRESS, JDOLA_AUCTION_ABI, signer);
    return contract.redeem(parseEther(amount));
}

export const juniorQueueWithdrawal = async (amount: string, maxWithdrawDelay: number, signer: JsonRpcSigner) => {
    const contract = new Contract(JUNIOR_ESCROW_ADDRESS, JUNIOR_ESCROW_ABI, signer);
    return contract.queueWithdrawal(parseEther(amount), maxWithdrawDelay);
}

export const juniorCompleteWithdraw = async (signer: JsonRpcSigner) => {
    const contract = new Contract(JUNIOR_ESCROW_ADDRESS, JUNIOR_ESCROW_ABI, signer);
    return contract.completeWithdraw();
}

export const cancelWithdrawal = async (signer: JsonRpcSigner) => {
    const contract = new Contract(JUNIOR_ESCROW_ADDRESS, JUNIOR_ESCROW_ABI, signer);
    return contract.cancelWithdrawal();
}