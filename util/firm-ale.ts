import { BigNumber, Contract } from "ethers";
import { getNetworkConfigConstants } from "./networks";
import { JsonRpcSigner } from "@ethersproject/providers";
import { F2_ALE_ABI } from "@app/config/abis";
import { getFirmSignature } from "./f2";
import { F2Market } from "@app/types";
import { get0xSellQuote } from "./zero";

const { F2_ALE, DOLA } = getNetworkConfigConstants();

export const getAleContract = (signer: JsonRpcSigner) => {
    return new Contract(F2_ALE, F2_ALE_ABI, signer);
}

export const prepareLeveragePosition = async (
    signer: JsonRpcSigner,
    market: F2Market,
    dolaToBorrow: BigNumber,
    initialDeposit?: BigNumber,
    slippage?: number,
) => {
    const signatureResult = await getFirmSignature(signer, market.address, dolaToBorrow, 'BorrowOnBehalf', F2_ALE);
    if (signatureResult) {
        const { deadline, r, s, v } = signatureResult;
        let get0xQuoteResult;
        try {
            get0xQuoteResult = await get0xSellQuote(market.collateral, DOLA, dolaToBorrow.toString(), slippage);
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
        const dbrData = ['0', '0'];
        if (initialDeposit && initialDeposit.gt(0)) {
            return depositAndLeveragePosition(
                signer,
                dolaToBorrow,
                buyTokenAddress,
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
            signer, dolaToBorrow, buyTokenAddress, allowanceTarget, swapData, permitData, helperTransformData, dbrData, value,
        );
    }
    return Promise.reject("Signature failed or canceled");
}

export const leveragePosition = (
    signer: JsonRpcSigner,
    dolaToBorrow: BigNumber,
    buyAd: string,
    zeroXspender: string,
    swapData: string,
    permitTuple: any[],
    helperTransformData: string,
    dbrTuple: any[],
    ethValue?: string,
) => {
    return getAleContract(signer)
        .leveragePosition(dolaToBorrow, buyAd, zeroXspender, swapData, permitTuple, helperTransformData, dbrTuple, { value: ethValue });
}

export const depositAndLeveragePosition = (
    signer: JsonRpcSigner,
    dolaToBorrow: BigNumber,
    buyAd: string,
    zeroXspender: string,
    swapData: string,
    permitTuple: any[],
    helperTransformData: string,
    dbrTuple: any[],
    initialDeposit: BigNumber,
    ethValue?: string,
) => {
    return getAleContract(signer)
        .depositAndLeveragePosition(initialDeposit, dolaToBorrow, buyAd, zeroXspender, swapData, permitTuple, helperTransformData, dbrTuple, { value: ethValue });
}

export const prepareDeleveragePosition = async (
    signer: JsonRpcSigner,
    market: F2Market,
    dolaToRepay: BigNumber,
    collateralToWithdraw: BigNumber,
    slippage?: number,
) => {
    const signatureResult = await getFirmSignature(signer, market.address, collateralToWithdraw, 'WithdrawOnBehalf', F2_ALE);
    if (signatureResult) {
        const { deadline, r, s, v } = signatureResult;
        let get0xQuoteResult;
        try {
            get0xQuoteResult = await get0xSellQuote(DOLA, market.collateral, collateralToWithdraw.toString(), slippage);
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
        const { data: swapData, allowanceTarget, to: swapTarget, value, sellTokenAddress } = get0xQuoteResult;
        const permitData = [deadline, v, r, s];
        const helperTransformData = '0x';
        const dbrData = [];
        return deleveragePosition(
            signer,
            dolaToRepay,
            sellTokenAddress,
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
    sellAd: string,
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
            sellAd,
            amountToWithdraw,
            zeroXspender,
            swapData,
            permitTuple,
            helperTransformData,
            dbrTuple,
            { value },
        );
}