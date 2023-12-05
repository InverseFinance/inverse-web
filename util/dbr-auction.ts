import { DBR_AUCTION_ABI, DBR_AUCTION_HELPER_ABI } from "@app/config/abis";
import { JsonRpcSigner } from "@ethersproject/providers";
import { BigNumber, Contract } from "ethers";

export const DBR_AUCTION_ADDRESS = '0xf274De14171Ab928A5Ec19928cE35FaD91a42B64';
export const DBR_AUCTION_HELPER_ADDRESS = '0xcb0A9835CDf63c84FE80Fcc59d91d7505871c98B';

export const getDbrAuctionContract = (signerOrProvider: JsonRpcSigner) => {
    return new Contract(DBR_AUCTION_ADDRESS, DBR_AUCTION_ABI, signerOrProvider);
}

export const getDbrAuctionHelperContract = (signerOrProvider: JsonRpcSigner) => {
    return new Contract(DBR_AUCTION_HELPER_ADDRESS, DBR_AUCTION_HELPER_ABI, signerOrProvider);
}

export const sellDolaForDbr = async (signerOrProvider: JsonRpcSigner, dolaToSell: BigNumber, minDbrOut: BigNumber) => {
    const contract = getDbrAuctionContract(signerOrProvider);
    return contract.buyDBR(dolaToSell, minDbrOut);
}

export const swapExactDolaForDbr = (signerOrProvider: JsonRpcSigner, dolaToSell: BigNumber, minDbrOut: BigNumber) => {
    const contract = getDbrAuctionHelperContract(signerOrProvider);
    return contract.swapExactDolaForDbr(dolaToSell, minDbrOut);
}

export const swapDolaForExactDbr = (signerOrProvider: JsonRpcSigner, dolaInMax: BigNumber, dbrOut: BigNumber) => {
    const contract = getDbrAuctionHelperContract(signerOrProvider);
    return contract.swapDolaForExactDbr(dbrOut, dolaInMax);
}

export const getDbrOut = async (signerOrProvider: JsonRpcSigner, dolaToSell: BigNumber) => {
    const contract = getDbrAuctionHelperContract(signerOrProvider);
    return contract.getDbrOut(dolaToSell);
}