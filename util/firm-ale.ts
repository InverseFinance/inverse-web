import { BigNumber, Contract } from "ethers";
import { getNetworkConfigConstants } from "./networks";
import { JsonRpcSigner } from "@ethersproject/providers";
import { F2_ALE_ABI } from "@app/config/abis";
import { f2approxDbrAndDolaNeeded, getFirmSignature, getHelperDolaAndDbrParams } from "./f2";
import { F2Market } from "@app/types";
import { get0xSellQuote } from "./zero";
import { BURN_ADDRESS } from "@app/config/constants";
import { getBnToNumber, getNumberToBn } from "./markets";

const { F2_ALE, DOLA } = getNetworkConfigConstants();

export const getAleContract = (signer: JsonRpcSigner) => {
    return new Contract(F2_ALE, F2_ALE_ABI, signer);
}

export const prepareLeveragePosition = async (
    signer: JsonRpcSigner,
    market: F2Market,
    dolaToBorrowToBuyCollateral: BigNumber,
    initialDeposit?: BigNumber,
    slippagePerc?: string | number,
    dbrBuySlippage?: string | number,
    durationDays?: number,
) => {
    // return getAleContract(signer).setMarket(market.collateral, market.address, market.collateral, BURN_ADDRESS);
    let dbrApprox;
    let dbrInputs = { dolaParam: '0', dbrParam: '0' };
    if(durationDays && dbrBuySlippage) {
        dbrApprox = await f2approxDbrAndDolaNeeded(signer, dolaToBorrowToBuyCollateral, dbrBuySlippage, durationDays);
        dbrInputs = getHelperDolaAndDbrParams('curve-v2', durationDays, dbrApprox);
    }
    const totalDolaToBorrow = dbrApprox?.maxDola || dolaToBorrowToBuyCollateral;
    // in ALE totalDolaToBorrow will be minted and borrowed
    const signatureResult = await getFirmSignature(signer, market.address, totalDolaToBorrow, 'BorrowOnBehalf', F2_ALE);

    if (signatureResult) {
        const { deadline, r, s, v } = signatureResult;
        let get0xQuoteResult;
        try {
            // the dola swapped for collateral is dolaToBorrowToBuyCollateral not totalDolaToBorrow (a part is for dbr)
            get0xQuoteResult = await get0xSellQuote(market.collateral, DOLA, dolaToBorrowToBuyCollateral.toString(), slippagePerc);
            if (!get0xQuoteResult?.to) {
                const msg = get0xQuoteResult?.validationErrors?.length > 0 ?
                    `Swap validation failed with: ${get0xQuoteResult?.validationErrors[0].field} ${get0xQuoteResult?.validationErrors[0].reason}`
                    : "Getting a quote from 0x failed";
                return Promise.reject(msg);
            }
        } catch (e) {
            console.log(e);
            return Promise.reject("Getting a quote from 0x failed");
        }
        const { data: swapData, allowanceTarget, to: swapTarget, value, buyTokenAddress } = get0xQuoteResult;
        const permitData = [deadline, v, r, s];
        const helperTransformData = '0x';
        // dolaIn, minDbrOut
        const dbrData = [dbrInputs.dolaParam, dbrInputs.dbrParam, '0'];        
        if (initialDeposit && initialDeposit.gt(0)) {
            return depositAndLeveragePosition(
                signer,
                dolaToBorrowToBuyCollateral,
                market.address,
                allowanceTarget,
                swapData,
                permitData,
                helperTransformData,
                dbrData,
                initialDeposit,
                value,
            )
        }
        return leveragePosition(
            signer, dolaToBorrowToBuyCollateral, market.address, allowanceTarget, swapData, permitData, helperTransformData, dbrData, value,
        );
    }
    return Promise.reject("Signature failed or canceled");
}

export const leveragePosition = (
    signer: JsonRpcSigner,
    dolaToBorrow: BigNumber,
    marketAd: string,
    zeroXspender: string,
    swapData: string,
    permitTuple: any[],
    helperTransformData: string,
    dbrTuple: any[],
    ethValue?: string,
) => {
    return getAleContract(signer)
        .leveragePosition(dolaToBorrow, marketAd, zeroXspender, swapData, permitTuple, helperTransformData, dbrTuple, { value: ethValue });
}

export const depositAndLeveragePosition = (
    signer: JsonRpcSigner,
    dolaToBorrow: BigNumber,
    marketAd: string,
    zeroXspender: string,
    swapData: string,
    permitTuple: any[],
    helperTransformData: string,
    dbrTuple: any[],
    initialDeposit: BigNumber,
    ethValue?: string,
) => {
    return getAleContract(signer)
        .depositAndLeveragePosition(initialDeposit, dolaToBorrow, marketAd, zeroXspender, swapData, permitTuple, helperTransformData, dbrTuple, { value: ethValue });
}

export const prepareDeleveragePosition = async (
    signer: JsonRpcSigner,
    market: F2Market,
    extraDolaToRepay: BigNumber,
    collateralToWithdraw: BigNumber,
    currentUserDebt: BigNumber,
    slippagePerc?: string | number,
    dbrToSell?: BigNumber,
    minDolaOut?: BigNumber,    
) => {
    let get0xQuoteResult;
    // we need the quote first
    try {
        // the dola swapped for collateral is dolaToRepayToSellCollateral not totalDolaToBorrow (a part is for dbr)
        get0xQuoteResult = await get0xSellQuote(DOLA, market.collateral, collateralToWithdraw.toString(), slippagePerc);          
        if (!get0xQuoteResult?.to) {
            const msg = get0xQuoteResult?.validationErrors?.length > 0 ?
                `Swap validation failed with: ${get0xQuoteResult?.validationErrors[0].field} ${get0xQuoteResult?.validationErrors[0].reason}`
                : "Getting a quote from 0x failed";
            return Promise.reject(msg);
        }
    } catch (e) {
        console.log(e);
        return Promise.reject("Getting a quote from 0x failed");
    }

    const signatureResult = await getFirmSignature(signer, market.address, collateralToWithdraw, 'WithdrawOnBehalf', F2_ALE);

    if (signatureResult) {
        const { deadline, r, s, v } = signatureResult;
        
        const { data: swapData, allowanceTarget, to: swapTarget, value, sellTokenAddress, guaranteedPrice } = get0xQuoteResult;
        const permitData = [deadline, v, r, s];
        const helperTransformData = '0x';
        const nb = parseFloat(guaranteedPrice) * getBnToNumber(collateralToWithdraw, market.underlying.decimals);

        const minDolaAmountFromSwap = getNumberToBn(nb);
        const potentialTotalDolaToRepay = minDolaAmountFromSwap.add(extraDolaToRepay);
        const dolaToRepay = potentialTotalDolaToRepay?.gte(currentUserDebt) ? currentUserDebt : potentialTotalDolaToRepay;
        // dolaIn, minDbrOut, extraDolaToRepay
        const dbrData = [dbrToSell, minDolaOut, extraDolaToRepay];
        return deleveragePosition(
            signer,
            dolaToRepay,
            market.address,
            collateralToWithdraw,
            allowanceTarget,
            swapData,
            permitData,
            helperTransformData,
            dbrData,
            value,
        );
    }
    return Promise.reject("Signature failed or canceled");
}

export const deleveragePosition = async (
    signer: JsonRpcSigner,
    dolaToRepay: BigNumber,
    marketAd: string,
    amountToWithdraw: BigNumber,
    zeroXspender: string,
    swapData: string,
    permitTuple: any[],
    helperTransformData: string,
    dbrTuple: any[],
    value: string,
) => {
    return getAleContract(signer)
        .deleveragePosition(
            dolaToRepay,
            marketAd,
            amountToWithdraw,
            zeroXspender,
            swapData,
            permitTuple,
            helperTransformData,
            dbrTuple,
            { value },
        );
}