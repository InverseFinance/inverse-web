import { F2_MARKET_ABI, F2_SIMPLE_ESCROW } from "@app/config/abis";
import { F2Market } from "@app/types";
import { JsonRpcSigner } from "@ethersproject/providers";
import { BigNumber, Contract } from "ethers";
import { getNetworkConfigConstants } from "./networks";
import moment from 'moment';

const { DBR } = getNetworkConfigConstants();

export const f2deposit = async (signer: JsonRpcSigner, market: string, amount: string | BigNumber) => {
    const account = await signer.getAddress();
    const contract = new Contract(market, F2_MARKET_ABI, signer);
    return contract.deposit(account, amount);
}

export const f2withdraw = async (signer: JsonRpcSigner, market: string, amount: string | BigNumber, to?: string) => {
    const contract = new Contract(market, F2_MARKET_ABI, signer);
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

export const f2depositAndBorrow = (signer: JsonRpcSigner, market: string, deposit: string | BigNumber, borrow: string | BigNumber) => {
    const contract = new Contract(market, F2_MARKET_ABI, signer);
    return contract.depositAndBorrow(deposit, borrow);
}

export const f2repayAndWithdraw = (signer: JsonRpcSigner, market: string, repay: string | BigNumber, withdraw: string | BigNumber) => {
    const contract = new Contract(market, F2_MARKET_ABI, signer);
    console.log(repay.toString())
    console.log(withdraw.toString())
    return contract.repayAndWithdraw(repay, withdraw);
}

export const f2exitMarket = async (signer: JsonRpcSigner, market: string) => {
    const account = await signer.getAddress();
    const marketContract = new Contract(market, F2_MARKET_ABI, signer);
    const escrow = await marketContract.escrows(account);
    const escrowContract = new Contract(escrow, F2_SIMPLE_ESCROW, signer);
    const balance = await escrowContract.balance();
    const debt = await marketContract.debts(account);
    return marketContract.repayAndWithdraw(debt, balance);
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
    const newDeposits = Math.max((deposits + (depositsDelta || 0)), 0);
    const newCreditLimit = newDeposits * market.collateralFactor * market.price;
    const newDebt = debt + debtDelta;

    const newPerc = !depositsDelta && !debtDelta ?
        perc : betweenZeroAnd100(
            newCreditLimit > 0 ?
                ((newCreditLimit - newDebt) / newCreditLimit) * 100
                : newDebt > 0 ? 0 : 100
        );
    const newCreditLeft = newCreditLimit - newDebt;
    const newLiquidationPrice = newDebt && newDeposits ? newDebt / (market.collateralFactor * newDeposits) : null;

    return {
        newCreditLimit,
        newCreditLeft,
        newDebt,
        newPerc,
        newLiquidationPrice,
        newDeposits,
    }
}

export const getRiskColor = (newPerc: number) => {
    return (newPerc >= 75 ? 'seagreen' : (newPerc >= 50 ? 'darkgoldenrod' : (newPerc >= 25 ? 'darkorange' : 'red')));
}

export const getDBRBuyLink = () => {
    return `https://app.sushi.com/swap?chainId=${process.env.NEXT_PUBLIC_CHAIN_ID}&inputCurrency=ETH&outputCurrency=${DBR}`
}

export const findMaxBorrow = (market, deposits, debt, dbrPrice, duration, collateralAmount, debtAmount, naiveMax, perc, isAutoDBR = true): number => {
    const dbrCoverDebt = isAutoDBR ? naiveMax * dbrPrice / (365 / duration) : 0;
    
    const {
        newPerc
    } = f2CalcNewHealth(market, deposits, debt + dbrCoverDebt + debtAmount, collateralAmount, naiveMax, perc);

    const {
        newCreditLeft, 
    } = f2CalcNewHealth(market, deposits, debt, collateralAmount, debtAmount, perc);

    if(newCreditLeft <= 0) {
        return 0;
    } else if(newPerc < 1) {        
        return findMaxBorrow(market, deposits, debt, dbrPrice, duration, collateralAmount, debtAmount, naiveMax - 0.1, perc, isAutoDBR)
    }
    return naiveMax < 0 ? 0 : Math.floor(naiveMax);
}

export const getDepletionDate = (timestamp: number, comparedTo: number) => {
    return !!timestamp ?
    (timestamp - 86400000) <= comparedTo ?
    timestamp <= comparedTo ? 'Instant' : `~${moment(timestamp).from()}`
        :
        moment(timestamp).format('MMM Do, YYYY') : '-'
}

export const getDBRRiskColor = (timestamp: number, comparedTo: number) => {
    return getRiskColor((timestamp - comparedTo) / (365 * 86400000) * 200);
}