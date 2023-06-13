import { F2_HELPER_ABI, F2_MARKET_ABI, F2_ESCROW_ABI } from "@app/config/abis";
import { CHAIN_ID, DEFAULT_FIRM_HELPER_TYPE, ONE_DAY_MS, ONE_DAY_SECS } from "@app/config/constants";
import { F2Market } from "@app/types";
import { JsonRpcSigner, Web3Provider } from "@ethersproject/providers";
import { BigNumber, Contract } from "ethers";
import moment from 'moment';
import { getNetworkConfigConstants } from "./networks";
import { parseUnits, splitSignature } from "ethers/lib/utils";
import { getBnToNumber, getNumberToBn } from "./markets";
import { callWithHigherGL } from "./contracts";

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

export const f2sellAndRepayHelper = async (
    signer: JsonRpcSigner,
    market: string,
    repay: string | BigNumber,
    minDolaOut: string | BigNumber,
    dbrAmountToSell: string | BigNumber,
) => {
    const helperContract = new Contract(F2_HELPER, F2_HELPER_ABI, signer);
    return callWithHigherGL(
        helperContract,
        'sellDbrAndRepayOnBehalf',
        [market, repay, minDolaOut, dbrAmountToSell],
    );
}

export const f2repayAndWithdrawNative = async (
    signer: JsonRpcSigner,
    market: string,
    repay: string | BigNumber,
    withdraw: string | BigNumber,
) => {
    const signatureResult = await getFirmSignature(signer, market, withdraw, 'WithdrawOnBehalf');
    if (signatureResult) {
        const { deadline, r, s, v } = signatureResult;
        const helperContract = new Contract(F2_HELPER, F2_HELPER_ABI, signer);
        return helperContract
            .repayAndWithdrawNativeEthOnBehalf(market, repay, withdraw, deadline.toString(), v.toString(), r, s);
    }
    return new Promise((res, rej) => rej("Signature failed or canceled"));
}

export const f2sellAndWithdrawHelper = async (
    signer: JsonRpcSigner,
    market: string,
    repay: string | BigNumber,
    withdraw: string | BigNumber,
    minDolaOut: string | BigNumber,
    dbrAmountToSell: string | BigNumber,
    isNativeCoin = false,
) => {
    const signatureResult = await getFirmSignature(signer, market, withdraw, 'WithdrawOnBehalf');
    if (signatureResult) {
        const { deadline, r, s, v } = signatureResult;
        const helperContract = new Contract(F2_HELPER, F2_HELPER_ABI, signer);
        return callWithHigherGL(
            helperContract,
            isNativeCoin ? 'sellDbrRepayAndWithdrawNativeEthOnBehalf' : 'sellDbrRepayAndWithdrawOnBehalf',
            [market, repay, minDolaOut, dbrAmountToSell, withdraw, deadline.toString(), v.toString(), r, s],
        );
    }
    return new Promise((res, rej) => rej("Signature failed or canceled"));
}

export const getHelperDolaAndDbrParams = (
    helperType: 'curve-v2' | 'balancer',
    durationDays: number,
    approx: { maxDola: number, minDrb: number, maxDolaBn: BigNumber, minDbrBn: BigNumber, dolaForDbrBn: BigNumber, dolaForDbrWithSlippageBn: BigNumber },
) => {
    const durationSecs = durationDays * ONE_DAY_SECS;
    if (helperType === 'curve-v2') {
        return { dolaParam: approx.dolaForDbrWithSlippage, dbrParam: approx.minDbr };
    } else if (helperType === 'balancer') {
        return { dolaParam: approx.maxDola, dbrParam: durationSecs.toString() };
    }
    return { dolaParam: '0', dbrParam: '0' };
}

export const f2approxDbrAndDolaNeeded = async (
    signer: JsonRpcSigner,
    dolaAmount: BigNumber,
    dbrBuySlippage: string | number,
    durationDays: number,
    helperType: 'curve-v2' | 'balancer' = DEFAULT_FIRM_HELPER_TYPE,
): {
    minDbr: BigNumber, maxDola: BigNumber, dolaForDbrWithSlippage: BigNumber, dolaForDbr: BigNumber, totalDolaNeeded: BigNumber, dbrNeeded: BigNumber,
    minDbrNum: number, maxDolaNum: number, dolaForDbrWithSlippageNum: number, dolaForDbrNum: number, totalDolaNeededNum: number, dbrNeededNum: number,
} => {
    const helperContract = new Contract(F2_HELPER, F2_HELPER_ABI, signer);
    const durationSecs = durationDays * ONE_DAY_SECS;

    const approx = await helperContract
        // Balancer: 8 iterations are used inside the Balancer helper contract
        // Curve: after 18 is precise enough
        .approximateDolaAndDbrNeeded(dolaAmount, durationSecs, helperType === 'balancer' ? 8 : 20);

    let dolaForDbr, totalDolaNeeded = BigNumber.from(0);

    if (helperType === 'balancer') {
        totalDolaNeeded = approx[0];
        dolaForDbr = totalDolaNeeded.sub(dolaAmount)//getBnToNumber(totalDolaNeeded) - debtAmountNum;
    } else if (helperType === 'curve-v2') {
        dolaForDbr = approx[0];
        totalDolaNeeded = dolaForDbr.add(dolaAmount);
    }
    const dbrNeeded = approx[1];

    const dbrCostSlippage = 10000 + parseFloat(dbrBuySlippage) * 100;
    const dbrAmountSlippage = 10000 - parseFloat(dbrBuySlippage) * 100;
    const dolaForDbrWithSlippage = dolaForDbr.mul(dbrCostSlippage).div(10000);
    const maxDola = dolaForDbrWithSlippage.add(dolaAmount);
    const minDbr = dbrNeeded.mul(dbrAmountSlippage).div(10000);
    const bns = { minDbr, maxDola, dolaForDbrWithSlippage, dolaForDbr, totalDolaNeeded, dbrNeeded };
    const nums = Object.entries(bns).reduce(
        (prev, [k, v]) => {
            return { ...prev, [`${k}Num`]: getBnToNumber(v) };
        }, {});
    return { ...bns, ...nums };
}

export const f2depositAndBorrowHelper = async (
    signer: JsonRpcSigner,
    market: string,
    deposit: string | BigNumber,
    borrow: BigNumber,
    dbrBuySlippage: string | number,
    durationDays: number,
    isNativeCoin = false,
    isBorrowOnly = false,
    helperType = DEFAULT_FIRM_HELPER_TYPE,
) => {
    const approx = await f2approxDbrAndDolaNeeded(signer, borrow, dbrBuySlippage, durationDays, helperType);

    const signatureResult = await getFirmSignature(signer, market, !durationDays ? borrow : approx.maxDola, 'BorrowOnBehalf');
    const { dolaParam, dbrParam } = getHelperDolaAndDbrParams(helperType, durationDays, approx);

    if (signatureResult) {
        const { deadline, r, s, v } = signatureResult;
        const helperContract = new Contract(F2_HELPER, F2_HELPER_ABI, signer);
        if (isNativeCoin) {
            if (!durationDays) {
                return helperContract
                    .depositNativeEthAndBorrowOnBehalf(market, borrow, deadline.toString(), v.toString(), r, s, { value: deposit });
            }
            return callWithHigherGL(
                helperContract,
                'depositNativeEthBuyDbrAndBorrowOnBehalf',
                [market, borrow, dolaParam, dbrParam, deadline.toString(), v.toString(), r, s],
                50000,
                { value: deposit },
            )
        }
        if (isBorrowOnly) {
            return callWithHigherGL(
                helperContract,
                'buyDbrAndBorrowOnBehalf',
                [market, borrow, dolaParam, dbrParam, deadline.toString(), v.toString(), r, s]
            );
        }

        return callWithHigherGL(
            helperContract,
            'depositBuyDbrAndBorrowOnBehalf',
            [market, deposit, borrow, dolaParam, dbrParam, deadline.toString(), v.toString(), r, s],
        );
    }
    return new Promise((res, rej) => rej("Signature failed or canceled"));
}

export const f2deposit = async (signer: JsonRpcSigner, market: string, amount: string | BigNumber, isNativeCoin = false) => {
    const account = await signer.getAddress();
    if (isNativeCoin) {
        const helperContract = new Contract(F2_HELPER, F2_HELPER_ABI, signer);
        return helperContract.depositNativeEthOnBehalf(market, { value: amount });
    }
    const contract = new Contract(market, F2_MARKET_ABI, signer);
    return contract.deposit(account, amount);
}

export const f2withdraw = async (signer: JsonRpcSigner, market: string, amount: string | BigNumber, isNativeCoin?: boolean) => {
    if (isNativeCoin) {
        const signatureResult = await getFirmSignature(signer, market, amount, 'WithdrawOnBehalf');
        if (signatureResult) {
            const { deadline, r, s, v } = signatureResult;
            const helperContract = new Contract(F2_HELPER, F2_HELPER_ABI, signer);
            return helperContract.withdrawNativeEthOnBehalf(market, amount, deadline, v, r, s);
        }
    }
    const contract = new Contract(market, F2_MARKET_ABI, signer);
    return contract.withdraw(amount);
}

export const f2withdrawMax = async (signer: JsonRpcSigner, market: string) => {
    const contract = new Contract(market, F2_MARKET_ABI, signer);
    return contract.withdrawMax();
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
    const escrowContract = new Contract(escrow, F2_ESCROW_ABI, signer);
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
                res(findMaxBorrow(market, deposits, debt, dbrPrice, duration, collateralAmount, debtAmount, naiveMax - 0.01 * naiveMax, perc, isAutoDBR));
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

export const getDbrPriceOnCurve = async (SignerOrProvider: JsonRpcSigner | Web3Provider) => {
    const crvPool = new Contract(
        '0x056ef502c1fc5335172bc95ec4cae16c2eb9b5b6',
        ['function price_oracle() public view returns(uint)',],
        SignerOrProvider,
    );
    const dolaPriceInDbr = await crvPool.price_oracle();
    const priceInDola = 1 / getBnToNumber(dolaPriceInDbr);
    return { priceInDolaBn: getNumberToBn(priceInDola), priceInDola: priceInDola };
}

export const getDbrSwapPriceOnCurve = async (SignerOrProvider: JsonRpcSigner | Web3Provider, ask = 1000) => {
    const crvPool = new Contract(
        '0x056ef502c1fc5335172bc95ec4cae16c2eb9b5b6',
        ['function get_dy(uint i, uint j, uint dx) public view returns(uint)',],
        SignerOrProvider,
    );
    const askBn = parseUnits(ask.toString());
    const data = await crvPool.get_dy(1, 0, askBn);
    const price = data ? 1/(getBnToNumber(data)/ask) : undefined;
    return { priceInDolaBn: getNumberToBn(price), priceInDola: price };
}

export const zapperRefresh = (account: string) => {
    return fetch(
        `/api/f2/rewards-post?account=${account || ''}`,
        {
            method: 'POST',
        }
    );
}