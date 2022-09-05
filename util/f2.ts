import { F2_MARKET_ABI } from "@app/config/abis";
import { F2Market } from "@app/types";
import { JsonRpcSigner } from "@ethersproject/providers";
import { BigNumber, Contract } from "ethers";
import { getNetworkConfigConstants } from "./networks";

const { DBR } = getNetworkConfigConstants();

export const f2deposit = (signer: JsonRpcSigner, market: string, amount: string | BigNumber) => {
    const contract = new Contract(market, F2_MARKET_ABI, signer);
    return contract.deposit(amount);
}

export const f2withdraw = async (signer: JsonRpcSigner, market: string, amount: string | BigNumber, to?: string) => {
    const contract = new Contract(market, F2_MARKET_ABI, signer);
    const _to = to ? to : await signer.getAddress();
    return contract.withdraw(amount);
}

export const f2borrow = (signer: JsonRpcSigner, market: string, amount: string | BigNumber) => {
    const contract = new Contract(market, F2_MARKET_ABI, signer);
    return contract.borrow(amount);
}

export const f2repay = async (signer: JsonRpcSigner, market: string, amount: string | BigNumber, to?: string) => {
    const contract = new Contract(market, F2_MARKET_ABI, signer);
    const _to = to ? to : await signer.getAddress();
    return contract.repay(_to, amount);
}

const betweenZeroAnd100 = (v: number) => {
    return Math.min(Math.max(v, 0), 100);
}

export const f2CalcNewHealth = (
    market: F2Market,
    deposits: number,
    debt: number,
    depositsDelta: number,
    debtDelta: number,
    perc: number,
) => {
    const newDeposits = (deposits + (depositsDelta || 0));
    const newCreditLimit = newDeposits * market.collateralFactor / 100 * market.price;
    const newDebt = debt + debtDelta;

    const newPerc = !depositsDelta && !debtDelta ?
        perc : betweenZeroAnd100(
            newCreditLimit > 0 ?
                ((newCreditLimit - newDebt) / newCreditLimit) * 100
                : 0
        );
    const newCreditLeft = newCreditLimit - newDebt;
    const newLiquidationPrice = newDebt && newDeposits ? newDebt / (market.collateralFactor/100 * newDeposits) : null;

    return {
        newCreditLimit,
        newCreditLeft,
        newDebt,
        newPerc,
        newLiquidationPrice,
    }
}

export const getRiskColor = (newPerc: number) => {
    return (newPerc >= 75 ? 'success' : (newPerc >= 50 ? 'lightWarning' : (newPerc >= 25 ? 'warning' : 'error')));
}

export const getDBRBuyLink = () => {
    return `https://app.sushi.com/swap?chainId=${process.env.NEXT_PUBLIC_CHAIN_ID}&inputCurrency=ETH&outputCurrency=${DBR}`
}