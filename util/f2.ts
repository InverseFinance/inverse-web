import { F2_HELPER_ABI, F2_MARKET_ABI, F2_ESCROW_ABI } from "@app/config/abis";
import { BURN_ADDRESS, CHAIN_ID, DEFAULT_FIRM_HELPER_TYPE, ONE_DAY_MS, ONE_DAY_SECS } from "@app/config/constants";
import { F2Market } from "@app/types";
import { BlockTag, JsonRpcSigner, Web3Provider } from "@ethersproject/providers";
import { BigNumber, Contract } from "ethers";
import moment from 'moment';
import { getNetworkConfigConstants } from "./networks";
import { parseUnits, splitSignature } from "ethers/lib/utils";
import { getBnToNumber, getNumberToBn } from "./markets";
import { callWithHigherGL } from "./contracts";
import { calculateMaxLeverage, uniqueBy } from "./misc";
import { getMulticallOutput } from "./multicall";
import { FIRM_ESCROWS } from "@app/variables/extraConfig";

const { F2_HELPER, F2_MARKETS } = getNetworkConfigConstants();

const needsHigherGasLimit = (market: string) => {
    const marketObj = F2_MARKETS.find(m => m.address === market)!;
    return marketObj.escrowImplementation !== FIRM_ESCROWS.simple
}

export const getFirmSignature = (
    signer: JsonRpcSigner,
    market: string,
    amount: string | BigNumber,
    type: 'BorrowOnBehalf' | 'WithdrawOnBehalf',
    caller: string = F2_HELPER,
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
                caller,
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
    iterations?: number,
): {
    minDbr: BigNumber, maxDola: BigNumber, dolaForDbrWithSlippage: BigNumber, dolaForDbr: BigNumber, totalDolaNeeded: BigNumber, dbrNeeded: BigNumber,
    minDbrNum: number, maxDolaNum: number, dolaForDbrWithSlippageNum: number, dolaForDbrNum: number, totalDolaNeededNum: number, dbrNeededNum: number,
} => {
    const helperContract = new Contract(F2_HELPER, F2_HELPER_ABI, signer);
    const durationSecs = durationDays * ONE_DAY_SECS;

    const _iterations = iterations || (helperType === 'balancer' ? 8 : 20);

    const approx = await helperContract
        // Balancer: 8 iterations are used inside the Balancer helper contract
        // Curve: after 18 is precise enough
        .approximateDolaAndDbrNeeded(dolaAmount, durationSecs, _iterations);

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
    dbrHelperType = DEFAULT_FIRM_HELPER_TYPE,
) => {
    const approx = await f2approxDbrAndDolaNeeded(signer, borrow, dbrBuySlippage, durationDays, dbrHelperType);

    const signatureResult = await getFirmSignature(signer, market, !durationDays ? borrow : approx.maxDola, 'BorrowOnBehalf');
    const { dolaParam, dbrParam } = getHelperDolaAndDbrParams(dbrHelperType, durationDays, approx);

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

export const f2deposit = async (signer: JsonRpcSigner, market: string, amount: string | BigNumber, isNativeCoin = false, customRecipient?: string) => {
    const account = await signer.getAddress();
    if (isNativeCoin) {
        const helperContract = new Contract(F2_HELPER, F2_HELPER_ABI, signer);
        return helperContract.depositNativeEthOnBehalf(market, { value: amount });
    }
    const useCustomRecipient = !!customRecipient && customRecipient?.toLowerCase() !== account?.toLowerCase() && customRecipient !== BURN_ADDRESS;
    // need non-ambigious deposit function for callWithHigherGL
    const contract = new Contract(market, useCustomRecipient ? ["function deposit(address user, uint amount) public"] : ["function deposit(uint amount) public"], signer);
    if (needsHigherGasLimit(market)) {
        return callWithHigherGL(contract, 'deposit', useCustomRecipient ? [customRecipient, amount] : [amount]);
    }
    return useCustomRecipient ? contract.deposit(customRecipient, amount) : contract.deposit(amount);
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
    if (needsHigherGasLimit(market)) {
        return callWithHigherGL(contract, 'withdraw', [amount]);
    }
    return contract.withdraw(amount);
}

export const f2withdrawMax = async (signer: JsonRpcSigner, market: string) => {
    const contract = new Contract(market, F2_MARKET_ABI, signer);
    return contract.withdrawMax();
}


export const f2borrow = (signer: JsonRpcSigner, market: string, amount: string | BigNumber) => {
    const contract = new Contract(market, F2_MARKET_ABI, signer);
    if (needsHigherGasLimit(market)) {
        return callWithHigherGL(contract, 'borrow', [amount]);
    }
    return contract.borrow(amount);
}

export const f2repay = async (signer: JsonRpcSigner, market: string, amount: string | BigNumber, to?: string) => {
    const contract = new Contract(market, F2_MARKET_ABI, signer);
    const _to = to ? to : await signer.getAddress();
    if (needsHigherGasLimit(market)) {
        return callWithHigherGL(contract, 'repay', [_to, amount]);
    }
    return contract.repay(_to, amount);
}

export const f2depositAndBorrow = (signer: JsonRpcSigner, market: string, deposit: string | BigNumber, borrow: string | BigNumber) => {
    const contract = new Contract(market, F2_MARKET_ABI, signer);
    if (needsHigherGasLimit(market)) {
        return callWithHigherGL(contract, 'depositAndBorrow', [deposit, borrow]);
    }
    return contract.depositAndBorrow(deposit, borrow);
}

export const f2repayAndWithdraw = (signer: JsonRpcSigner, market: string, repay: string | BigNumber, withdraw: string | BigNumber) => {
    const contract = new Contract(market, F2_MARKET_ABI, signer);
    if (needsHigherGasLimit(market)) {
        return callWithHigherGL(contract, 'repayAndWithdraw', [repay, withdraw]);
    }
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
    const newDebtSigned = debt + debtDelta;
    const newDebt = Math.max(newDebtSigned, 0);

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
        newDebtSigned,
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
            timestamp <= comparedTo ? 'Instant' : `~${moment(timestamp).fromNow()}`
            :
            moment(timestamp).format('MMM Do, YYYY') : '-'
}

export const getDBRRiskColor = (timestamp: number, comparedTo: number) => {
    return getRiskColor((timestamp - comparedTo) / (365 * ONE_DAY_MS) * 300);
}

export const getDbrPriceOnCurve = async (SignerOrProvider: JsonRpcSigner | Web3Provider) => {
    const crvPool = new Contract(
        '0xC7DE47b9Ca2Fc753D6a2F167D8b3e19c6D18b19a',
        ['function price_oracle(uint) public view returns(uint)'],
        SignerOrProvider,
    );
    const priceInDolaBn = await crvPool.price_oracle('0');
    const priceInDola = getBnToNumber(priceInDolaBn);
    return { priceInDolaBn: priceInDolaBn, priceInDola: priceInDola };
}

export const getHistoricDbrPriceOnCurve = async (SignerOrProvider: JsonRpcSigner | Web3Provider, block: number) => {
    const crvPool = new Contract(
        '0xC7DE47b9Ca2Fc753D6a2F167D8b3e19c6D18b19a',
        [
            'function price_oracle(uint) public view returns(uint)',
            'function get_dy(uint i, uint j, uint dx) public view returns(uint)'
        ],
        SignerOrProvider,
    );
    const [priceInDolaBn, dbrOutForOneInvBn] = await getMulticallOutput([
        { contract: crvPool, functionName: 'price_oracle', params: ['0'] },
        // { contract: crvPool, functionName: 'price_oracle', params: ['1'] },
        { contract: crvPool, functionName: 'get_dy', params: ['2', '1', '1000000000000000000'] },
    ], 1, block);
    const priceInDola = getBnToNumber(priceInDolaBn);
    const priceInInv = getBnToNumber(dbrOutForOneInvBn) > 0 ? 1 / getBnToNumber(dbrOutForOneInvBn) : 0;
    return { priceInDolaBn: priceInDolaBn, priceInDola: priceInDola, priceInInv: priceInInv, block };
}

export const getDolaUsdPriceOnCurve = async (SignerOrProvider: JsonRpcSigner | Web3Provider, block?: BlockTag) => {
    try {
        const crvPool = new Contract(
            '0x8272e1a3dbef607c04aa6e5bd3a1a134c8ac063b',
            [
                'function price_oracle() public view returns(uint)',
                'function totalSupply() public view returns(uint)',
                'function get_virtual_price() public view returns(uint)',
            ],
            SignerOrProvider,
        );
        const crvUsdAggreg = new Contract(
            '0x18672b1b0c623a30089A280Ed9256379fb0E4E62',
            ['function last_price() public view returns(uint)',],
            SignerOrProvider,
        );
        const [dolaPriceInCrvUsd, crvUsdLastPrice, totalSupply, lpVirtualPrice] = await getMulticallOutput([
            { contract: crvPool, functionName: 'price_oracle' },
            { contract: crvUsdAggreg, functionName: 'last_price' },
            { contract: crvPool, functionName: 'totalSupply' },
            { contract: crvPool, functionName: 'get_virtual_price' },
        ], 1, block);
        return {
            price: getBnToNumber(crvUsdLastPrice) / getBnToNumber(dolaPriceInCrvUsd),
            tvl: getBnToNumber(lpVirtualPrice) * getBnToNumber(totalSupply),
        };
    } catch (e) {
        return { price: 0, tvl: 0, error: true };
    }
}

export const zapperRefresh = (account: string) => {
    return fetch(
        `/api/f2/rewards-post?account=${account || ''}`,
        {
            method: 'POST',
        }
    );
}

const FIRM_EVENTS_DEFAULT_STARTING_VALUES = {
    depositedByUser: 0,
    unstakedCollateralBalance: 0,
    liquidated: 0,
    claims: 0,
    replenished: 0,
    debt: 0,
}

export const formatFirmEvents = (
    market: F2Market,
    flatenedEvents: any[],
    timestamps: number[],
    startingValues = FIRM_EVENTS_DEFAULT_STARTING_VALUES,
) => {
    // can be different than current balance when staking
    let { depositedByUser, unstakedCollateralBalance, liquidated, claims, replenished, debt } = startingValues;

    const blocks = flatenedEvents.map(e => e.blockNumber);

    const events = flatenedEvents.map((e, i) => {
        const actionName = e.event;
        const isDebtCase = ['Borrow', 'Repay'].includes(actionName);
        const decimals = market.underlying.decimals;
        const tokenName = market.underlying.symbol
        const amount = getBnToNumber(e.args?.amount, isDebtCase ? 18 : decimals);
        let liquidatorReward, deficit;

        if (['Deposit', 'Withdraw'].includes(actionName)) {
            depositedByUser = depositedByUser + (actionName === 'Deposit' ? amount : -amount);
            unstakedCollateralBalance = unstakedCollateralBalance + (actionName === 'Deposit' ? amount : -amount);
        } else if (isDebtCase) {
            debt = debt + (actionName === 'Borrow' ? amount : -amount);
        } else if (actionName === 'ForceReplenish') {
            deficit = getBnToNumber(e.args.deficit);
            replenished += deficit;
            debt += getBnToNumber(e.args.replenishmentCost);
        } else if (actionName === 'Liquidate') {
            liquidatorReward = getBnToNumber(e.args.liquidatorReward, decimals);
            liquidated += liquidatorReward;
            debt -= getBnToNumber(e.args.repaidDebt);
            unstakedCollateralBalance -= liquidatorReward;
        } else if (actionName === 'Transfer') {
            claims += amount;
        }

        if (unstakedCollateralBalance < 0) {
            unstakedCollateralBalance = 0;
        }

        return {
            combinedKey: `${e.transactionHash}-${actionName}-${e.args?.account}`,
            actionName,
            claims,
            isClaim: actionName === 'Transfer',
            depositedByUser,
            unstakedCollateralBalance,
            timestamp: timestamps ? timestamps[i] : 0,
            blockNumber: e.blockNumber,
            txHash: e.transactionHash,
            amount,
            escrow: e.args?.escrow,
            repayer: e.args?.repayer,
            to: e.args?.to,
            replenisher: e.args?.replenisher,
            name: e.event,
            logIndex: e.logIndex,
            tokenName,
            liquidatorReward,
            deficit,
            liquidated,
            replenished,
            debt,
        }
    });
    return {
        events,
        debt,
        depositedByUser,
        unstakedCollateralBalance,
        liquidated,
        replenished,
        claims,
        lastBlock: blocks?.length ? Math.max(...blocks) : 0,
    }
}

const COMBINATIONS = {
    'Deposit': 'Borrow',
    'Borrow': 'Deposit',
    'Repay': 'Withdraw',
    'Withdraw': 'Repay',
}
const COMBINATIONS_NAMES = {
    'Deposit': 'DepositBorrow',
    'Borrow': 'DepositBorrow',
    'Repay': 'RepayWithdraw',
    'Withdraw': 'RepayWithdraw',
}
const COMBINATIONS_LEVERAGE = {
    'Deposit': 'LeverageUp',
    'Borrow': 'LeverageUp',
    'Withdraw': 'LeverageDown',
    'Repay': 'LeverageDown',
}

export const formatAndGroupFirmEvents = (
    market: F2Market,
    account: string,
    flatenedEvents: any[],
    depositsOnTopOfLeverageEvents: any[],
    repaysOnTopOfDeleverageEvents: any[],
) => {
    // can be different than current balance when staking
    let depositedByUser = 0;
    // originally deposited in the current "cycle" (new cycle = deposit goes from 0 to > 0)
    let currentCycleDepositedByUser = 0;
    let liquidated = 0;
    const events = flatenedEvents.map(e => {
        const name = e.event || e.name;
        const isCollateralEvent = ['Deposit', 'Withdraw', 'Liquidate'].includes(name);
        const isLeverageEvent = ['LeverageUp', 'LeverageDown'].includes(name);
        const decimals = isCollateralEvent ? market.underlying.decimals : 18;
        const txHash = e.transactionHash || e.txHash;

        // Deposit can be associated with Borrow, withdraw with repay
        let combinedEvent, leverageEvent;
        const combinedEventName = COMBINATIONS[name];
        const leverageCombinedEventName = COMBINATIONS_LEVERAGE[name];
        if (combinedEventName) {
            combinedEvent = flatenedEvents.find(e2 => {
                const e2TxHash = e2.transactionHash || e2.txHash;
                return e2TxHash === txHash && (e2.event || e2.name) === combinedEventName
            });
        }
        if (leverageCombinedEventName) {
            leverageEvent = flatenedEvents.find(e2 => {
                const e2TxHash = e2.transactionHash || e2.txHash;
                return e2TxHash === txHash && (e2.event === leverageCombinedEventName || e2.name === leverageCombinedEventName);
            });
        } else if (isLeverageEvent) {
            leverageEvent = e;
        }
        const tokenName = isCollateralEvent ? market.underlying.symbol : e.args?.replenisher || e.replenisher ? 'DBR' : 'DOLA';
        const actionName = !!leverageEvent ? (leverageEvent.event || leverageEvent.name) : !!combinedEvent ? COMBINATIONS_NAMES[name] : name;

        const amount = e.amount ? e.amount : e.args?.amount ? getBnToNumber(e.args?.amount, decimals) : undefined;
        const liquidatorReward = e.liquidatorReward ? e.liquidatorReward : e.args?.liquidatorReward ? getBnToNumber(e.args?.liquidatorReward, decimals) : undefined;

        const dolaFlashMinted = !!leverageEvent ? getBnToNumber(leverageEvent.args?.dolaFlashMinted) : 0;
        const collateralLeveragedAmount = !!leverageEvent ? getBnToNumber(leverageEvent.args?.[3], market.underlying.decimals) : 0;

        if (isCollateralEvent && !!amount) {
            const colDelta = (name === 'Deposit' ? amount : -amount)
            depositedByUser = depositedByUser + colDelta;
            currentCycleDepositedByUser = currentCycleDepositedByUser + colDelta;
            if (currentCycleDepositedByUser < 0) {
                currentCycleDepositedByUser = 0;
            }
            // console.log('depositedByUser', depositedByUser, 'amount', a)
        } else if (name === 'Liquidate' && !!liquidatorReward) {
            liquidated += liquidatorReward;
        }

        const depositOnTopOfLeverageEvent = actionName === 'LeverageUp' ? depositsOnTopOfLeverageEvents?.find(e2 => e2.transactionHash.toLowerCase() === txHash.toLowerCase()) : undefined;
        const depositOnTopOfLeverage = depositOnTopOfLeverageEvent ? getBnToNumber(depositOnTopOfLeverageEvent.args.amount, market.underlying.decimals) : 0;
        const repayOnTopOfDeleverageEvent = actionName === 'LeverageDown' ? repaysOnTopOfDeleverageEvents?.find(e2 => e2.transactionHash.toLowerCase() === txHash.toLowerCase()) : undefined;
        const repayOnTopOfDeleverage = repayOnTopOfDeleverageEvent ? getBnToNumber(repayOnTopOfDeleverageEvent.args.amount) : 0;

        return {
            combinedKey: `${txHash}-${actionName}-${e.args?.account || account}`,
            actionName,
            blockNumber: e.blockNumber,
            txHash,
            amount,
            isLeverage: !!leverageEvent,
            isCombined: !!combinedEvent || !!leverageEvent,
            amountCombined: combinedEvent?.amount ? combinedEvent?.amount : combinedEvent?.args?.amount ? getBnToNumber(combinedEvent.args.amount, decimals) : undefined,
            deficit: e.deficit ? e.deficit : e.args?.deficit ? getBnToNumber(e.args?.deficit, 18) : undefined,
            repaidDebt: e.repaidDebt ? e.repaidDebt : e.args?.repaidDebt ? getBnToNumber(e.args?.repaidDebt, 18) : undefined,
            liquidatorReward,
            repayer: e.args?.repayer || e.repayer,
            to: e.args?.to || e.to,
            escrow: e.args?.escrow || e.escrow,
            replenisher: e.args?.replenisher || e.replenisher,
            name,
            nameCombined: combinedEventName,
            logIndex: e.logIndex,
            isCollateralEvent,
            tokenName,
            isClaim: actionName === 'Transfer',
            tokenNameCombined: tokenName === 'DOLA' ? market.underlying.symbol : 'DOLA',
            dolaFlashMinted,
            collateralLeveragedAmount,
            timestamp: e.timestamp,
            depositOnTopOfLeverage,
            repayOnTopOfDeleverage,
        }
    });

    const grouped = uniqueBy(events.filter(e => !e.isClaim), (o1, o2) => o1.combinedKey === o2.combinedKey);
    grouped.sort((a, b) => a.blockNumber !== b.blockNumber ? (b.blockNumber - a.blockNumber) : b.logIndex - a.logIndex);
    return {
        grouped,
        depositedByUser,
        currentCycleDepositedByUser,
        liquidated,
    };
}

export const calculateNetApy = (supplyApy: number, collateralFactor: number, dbrPriceUsd: number, _multiplier?: number) => {
    const multiplier = _multiplier ? _multiplier : calculateMaxLeverage(collateralFactor);
    const mApy = supplyApy * multiplier;
    const mBorrowApr = dbrPriceUsd * 100 * multiplier * collateralFactor;
    return mApy - mBorrowApr;
}