import { F2_MARKET_ABI } from "@app/config/abis";
import { JsonRpcSigner } from "@ethersproject/providers";
import { BigNumber, Contract } from "ethers"

export const f2deposit = (signer: JsonRpcSigner, market: string, amount: string | BigNumber) => {
    const contract = new Contract(market, F2_MARKET_ABI, signer);
    return contract.deposit(amount);
}

export const f2borrow = (signer: JsonRpcSigner, market: string, amount: string | BigNumber) => {
    const contract = new Contract(market, F2_MARKET_ABI, signer);
    return contract.borrow(amount);
}