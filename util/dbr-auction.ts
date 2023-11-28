import { DBR_AUCTION_ABI } from "@app/config/abis";
import { JsonRpcSigner } from "@ethersproject/providers";
import { BigNumber, Contract } from "ethers";

export const DBR_AUCTION_ADDRESS = '0xFf658343244c0475b9305859F1b7CDAB9784762f';

export const getDbrAuctionContract = (signerOrProvider: JsonRpcSigner) => {
    return new Contract(DBR_AUCTION_ADDRESS, DBR_AUCTION_ABI, signerOrProvider);
}

export const sellDolaForDbr = async (signerOrProvider: JsonRpcSigner, dolaToSell: BigNumber, minDbrOut: BigNumber) => {
    const contract = getDbrAuctionContract(signerOrProvider);
    return contract.buyDBR(dolaToSell, minDbrOut);
}

export const getDbrOut = async (signerOrProvider: JsonRpcSigner, dolaToSell: BigNumber) => {
    const contract = getDbrAuctionContract(signerOrProvider);
    return contract.getDbrOut(dolaToSell);
}