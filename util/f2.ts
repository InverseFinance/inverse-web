import { F2_HELPER_ABI, F2_MARKET_ABI, F2_SIMPLE_ESCROW_ABI } from "@app/config/abis";
import { CHAIN_ID, ONE_DAY_MS, ONE_DAY_SECS } from "@app/config/constants";
import { F2Market } from "@app/types";
import { JsonRpcSigner } from "@ethersproject/providers";
import { BigNumber, Contract } from "ethers";
import moment from 'moment';
import { getNetworkConfigConstants } from "./networks";
import { splitSignature } from "ethers/lib/utils";

const { F2_HELPER } = getNetworkConfigConstants();

export const getFirmSignature = (
    signer: JsonRpcSigner,
    market: string,
    amount: string | BigNumber,
    type: 'BorrowOnBehalf' | 'WithdrawOnBehalf',
): Promise<{
    deadline: number,
    r: string,
    s: string,
    v: number,
} | null> => {
    return new Promise(async (resolve, reject) => {
        try {
            if (!signer) { resolve(null) }
            const from = await signer.getAddress();
            const marketContract = new Contract(market, F2_MARKET_ABI, signer);

            const domain = { name: 'DBR MARKET', version: '1', chainId: CHAIN_ID, verifyingContract: market }

            const types = {
                [type]: [
                    { name: 'caller', type: 'address' },
                    { name: 'from', type: 'address' },
                    { name: 'amount', type: 'uint256' },
                    { name: 'nonce', type: 'uint256' },
                    { name: 'deadline', type: 'uint256' },
                ],
            }

            const value = {
                caller: F2_HELPER,
                from,
                amount,
                nonce: (await marketContract.nonces(from)).toString(),
                deadline: Math.floor(Date.now() / 1000 + 600),// 10 min deadline
            }

            const signature = await signer._signTypedData(domain, types, value)
            const { r, s, v } = splitSignature(signature);

            resolve({
                deadline: value.deadline,
                r,
                s,
                v,
            });
        } catch (e) {
            reject(e);
        }
        resolve(null);
    })
}

export const f2depositAndBorrowHelper = async (
    signer: JsonRpcSigner,
    market: string,
    deposit: string | BigNumber,
    borrow: string | BigNumber,
    maxDolaIn: string | BigNumber,
    durationDays: number,
) => {
    const signatureResult = await getFirmSignature(signer, market, borrow, 'BorrowOnBehalf');
    if (signatureResult) {        
        const { deadline, r, s, v } = signatureResult;
        const helperContract = new Contract(F2_HELPER, F2_HELPER_ABI, signer);      
        const durationSecs = durationDays * ONE_DAY_SECS;        
        return helperContract
            .depositAndBorrowOnBehalf(market, deposit, borrow, maxDolaIn, durationSecs.toString(), deadline.toString(), v.toString(), r, s);
    }
    return new Promise((res, rej) => rej("Signature failed or canceled"));
}

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
    return contract.repayAndWithdraw(repay, withdraw);
}

export const f2exitMarket = async (signer: JsonRpcSigner, market: string) => {
    const account = await signer.getAddress();
    const marketContract = new Contract(market, F2_MARKET_ABI, signer);
    const escrow = await marketContract.escrows(account);
    const escrowContract = new Contract(escrow, F2_SIMPLE_ESCROW_ABI, signer);
    const balance = await escrowContract.balance();
    const debt = await marketContract.debts(account);
    return marketContract.repayAndWithdraw(debt, balance);
}

export const f2liquidate = async (signer: JsonRpcSigner, borrower: string, market: string, repay: string | BigNumber) => {
    const contract = new Contract(market, F2_MARKET_ABI, signer);
    return contract.liquidate(borrower, repay);
}

export const f2replenish = async (signer: JsonRpcSigner, borrower: string, market: string, amount: string | BigNumber) => {
    const contract = new Contract(market, F2_MARKET_ABI, signer);
    return contract.forceReplenish(borrower, amount);
}

export const f2replenishAll = async (signer: JsonRpcSigner, borrower: string, market: string) => {
    const contract = new Contract(market, F2_MARKET_ABI, signer);
    return contract.forceReplenishAll(borrower);
}

const betweenZeroAnd100 = (v: number) => {
    return Math.min(Math.max(v, 0), 100);
}

export const f2CalcNewHealth = (
    market: F2Market,
    deposits: number,
    debt: number,
    depositsDelta = 0,
    debtDelta = 0,
    perc?: number,
) => {
    const newDeposits = Math.max((deposits + (depositsDelta || 0)), 0);
    const newCreditLimit = newDeposits * market.collateralFactor * market.price;
    const newDebt = debt + debtDelta;

    const newPerc = !depositsDelta && !debtDelta && perc !== undefined ?
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
    return `https://swap.defillama.com/?chain=ethereum&from=0x865377367054516e17014ccded1e7d814edc9ce4&to=0xAD038Eb671c44b853887A7E32528FaB35dC5D710`
}

export const findMaxBorrow = async (market, deposits, debt, dbrPrice, duration, collateralAmount, debtAmount, naiveMax, perc, isAutoDBR = true): Promise<number> => {
    return new Promise((res) => {
        const dbrCoverDebt = isAutoDBR ? naiveMax * dbrPrice / (365 / duration) : 0;

        const {
            newPerc
        } = f2CalcNewHealth(market, deposits, debt + dbrCoverDebt + debtAmount, collateralAmount, naiveMax, perc);

        const {
            newCreditLeft,
        } = f2CalcNewHealth(market, deposits, debt, collateralAmount, debtAmount, perc);

        if (newCreditLeft <= 0) {
            res(0);
        } else if (newPerc < 1) {
            setTimeout(() => {
                res(findMaxBorrow(market, deposits, debt, dbrPrice, duration, collateralAmount, debtAmount, naiveMax - 0.1, perc, isAutoDBR));
            }, 1);
        } else {
            res(naiveMax < 0 ? 0 : Math.floor(naiveMax));
        }
    })
}

export const getDepletionDate = (timestamp: number, comparedTo: number) => {
    return !!timestamp ?
        (timestamp - ONE_DAY_MS) <= comparedTo ?
            timestamp <= comparedTo ? 'Instant' : `~${moment(timestamp).from()}`
            :
            moment(timestamp).format('MMM Do, YYYY') : '-'
}

export const getDBRRiskColor = (timestamp: number, comparedTo: number) => {
    return getRiskColor((timestamp - comparedTo) / (365 * ONE_DAY_MS) * 200);
}