import { BigNumber, Contract, utils } from "ethers";
import { getNetworkConfigConstants } from "./networks";
import { JsonRpcSigner } from "@ethersproject/providers";
import { F2_ALE_ABI, F2_MARKET_ABI } from "@app/config/abis";
import { f2approxDbrAndDolaNeeded, getFirmSignature, getHelperDolaAndDbrParams } from "./f2";
import { F2Market } from "@app/types";
import { getBnToNumber, getNumberToBn } from "./markets";
import { callWithHigherGL } from "./contracts";
import { parseUnits } from "@ethersproject/units";
import { BURN_ADDRESS } from "@app/config/constants";
import { fetcher60sectimeout } from "./web3";

const { F2_ALE, DOLA } = getNetworkConfigConstants();

export const getAleContract = (signer: JsonRpcSigner) => {
    return new Contract(F2_ALE, F2_ALE_ABI, signer);
}

// by default 0x as transformerData, others listed below something else
const aleTransformers = {
    'marketAddress': (market: F2Market) => {
        const abi = new utils.AbiCoder();
        return abi.encode(['address'], [market.address]);
    },
    'marketAddressAndAmount': (market: F2Market, amount: BigNumber | string) => {
        const abi = new utils.AbiCoder();
        return abi.encode(['address', 'uint256'], [market.address, amount]);
    },
    'marketAddressAndAmountAndPendleData': (market: F2Market, amount: BigNumber | string, pendleData: string) => {
        const abi = new utils.AbiCoder();
        return abi.encode(['address', 'uint256', 'bytes'], [market.address, amount, pendleData]);
    },
}

const ANOMALY_PERC_FACTOR = 0.95;

export const prepareLeveragePosition = async (
    signer: JsonRpcSigner,
    market: F2Market,
    dolaToBorrowToBuyCollateral: BigNumber,
    initialDeposit?: BigNumber,
    slippagePerc?: string | number,
    dbrBuySlippage?: string | number,
    durationDays?: number,
    // can be collateral or buySellToken, eg sFRAX or FRAX
    isDepositCollateral = true,
    dolaPrice = 1,
    leverageMinAmountUp?: number,
    underlyingExRate?: number,
) => {
    let dbrApprox;
    let dbrInputs = { dolaParam: '0', dbrParam: '0' };

    if (durationDays && dbrBuySlippage) {
        dbrApprox = await f2approxDbrAndDolaNeeded(signer, dolaToBorrowToBuyCollateral, dbrBuySlippage, durationDays);
        dbrInputs = getHelperDolaAndDbrParams('curve-v2', durationDays, dbrApprox);
    }
    const totalDolaToBorrow = dbrApprox?.maxDola || dolaToBorrowToBuyCollateral;
    // in ALE totalDolaToBorrow will be minted and borrowed
    const signatureResult = await getFirmSignature(signer, market.address, totalDolaToBorrow, 'BorrowOnBehalf', F2_ALE);

    if (signatureResult) {
        const { deadline, r, s, v } = signatureResult;
        let aleQuoteResult;
        try {
            if (market.isAleWithoutSwap) {
                aleQuoteResult = { data: '0x', allowanceTarget: BURN_ADDRESS, exchangeProxy: BURN_ADDRESS, value: '0' }
            } else {
                // the dola swapped for collateral is dolaToBorrowToBuyCollateral not totalDolaToBorrow (a part is for dbr)
                const sellToken = market.isPendle ? market.collateral :  market.aleData?.buySellToken || market.collateral;
                aleQuoteResult = await getAleSellQuote(sellToken, DOLA, dolaToBorrowToBuyCollateral.toString(), slippagePerc, false);
                if (!aleQuoteResult?.data || !!aleQuoteResult.msg) {
                    const msg = aleQuoteResult?.validationErrors?.length > 0 ?
                        `Swap validation failed with: ${aleQuoteResult?.validationErrors[0].field} ${aleQuoteResult?.validationErrors[0].reason}`
                        : `Getting a quote failed`;
                    return Promise.reject(msg);
                }
            }
        } catch (e) {
            console.log(e);
            return Promise.reject(`Getting a quote failed`);
        }
        const { data: swapData, allowanceTarget, value, exchangeProxy, extraHelperData } = aleQuoteResult;
        const permitData = [deadline, v, r, s];
        let helperTransformData = '0x';
        if (market.aleData?.buySellToken && !!market.aleTransformerType && aleTransformers[market.aleTransformerType]) {
            const isInitialDepositDolaToConvert = !isDepositCollateral && initialDeposit?.gt(0) && market.aleData.isTransformToDola;
            const amountOfDolaConverted = isInitialDepositDolaToConvert ? getBnToNumber(dolaToBorrowToBuyCollateral.add(initialDeposit)) : getBnToNumber(dolaToBorrowToBuyCollateral);
            // should not happen in normal circumstances
            // if initialDeposit is DOLA the leverageMinAmountUp should be the minAmount for the total DOLA converted not only the part coming from borrowing
            if(leverageMinAmountUp < (amountOfDolaConverted / market.price * ANOMALY_PERC_FACTOR)){
                alert('Something went wrong');
                return;
            }
            // Note: if vault is set (eg yv-crvUSD-DOLA market) then minAmount is in underlying lp amount not in vault token amounts
            const minMint = market.aleData.useProxy || !underlyingExRate ? leverageMinAmountUp : leverageMinAmountUp * (underlyingExRate||1);
            helperTransformData = aleTransformers[market.aleTransformerType](market, minMint ? getNumberToBn(minMint) : undefined, extraHelperData);
        }        
        // dolaIn, minDbrOut
        const dbrData = [dbrInputs.dolaParam, dbrInputs.dbrParam, '0'];
        if (initialDeposit && initialDeposit.gt(0)) {
            return depositAndLeveragePosition(
                signer,
                dolaToBorrowToBuyCollateral,
                market.address,
                exchangeProxy,
                swapData,
                permitData,
                helperTransformData,
                dbrData,
                initialDeposit,
                value,
                isDepositCollateral,
            )
        }
        return leveragePosition(
            signer, dolaToBorrowToBuyCollateral, market.address, exchangeProxy, swapData, permitData, helperTransformData, dbrData, value,
        );
    }
    return Promise.reject("Signature failed or canceled");
}

export const leveragePosition = (
    signer: JsonRpcSigner,
    dolaToBorrow: BigNumber,
    marketAd: string,
    exchangeProxy: string,
    swapData: string,
    permitTuple: any[],
    helperTransformData: string,
    dbrTuple: any[],
    ethValue?: string,
) => { 
    return callWithHigherGL(
        getAleContract(signer),
        'leveragePosition',
        [dolaToBorrow, marketAd, exchangeProxy, swapData, permitTuple, helperTransformData, dbrTuple],
        200000,
        { value: ethValue },
    );
}

export const depositAndLeveragePosition = (
    signer: JsonRpcSigner,
    dolaToBorrow: BigNumber,
    marketAd: string,
    exchangeProxy: string,
    swapData: string,
    permitTuple: any[],
    helperTransformData: string,
    dbrTuple: any[],
    initialDeposit: BigNumber,
    ethValue?: string,
    depositCollateral = true,
) => {
    return callWithHigherGL(
        getAleContract(signer),
        'depositAndLeveragePosition',
        [initialDeposit, dolaToBorrow, marketAd, exchangeProxy, swapData, permitTuple, helperTransformData, dbrTuple, depositCollateral],
        200000,
        { value: ethValue },
    )
}

export const prepareDeleveragePosition = async (
    signer: JsonRpcSigner,
    market: F2Market,
    extraDolaToRepay: BigNumber,
    collateralToWithdraw: BigNumber,
    slippagePerc?: string | number,
    dbrToSell?: BigNumber,
    minDolaOut?: BigNumber,
    dolaPrice = 1,
    leverageMinAmountUp?: number,
    underlyingExRate?: number,
    sDolaExRate?: number,
) => {
    let aleQuoteResult;    
    // we need the quote first
    try {
        // lps
        if (market.isAleWithoutSwap) {
            aleQuoteResult = { data: '0x', allowanceTarget: BURN_ADDRESS, exchangeProxy: BURN_ADDRESS, value: '0', buyAmount: getNumberToBn(getBnToNumber(collateralToWithdraw, market.underlying.decimals) * market.price / dolaPrice).toString() }
        } else {
            // the dola swapped for collateral is dolaToRepayToSellCollateral not totalDolaToBorrow (a part is for dbr)
            const amountToSellString = !!market.aleTransformerType && market?.aleData?.buySellToken?.toLowerCase() !== market?.collateral?.toLowerCase() && underlyingExRate ? getNumberToBn(getBnToNumber(collateralToWithdraw, market.underlying.decimals) * underlyingExRate).toString() : collateralToWithdraw.toString();
            const sellToken = market.isPendle ? market.collateral :  market.aleData?.buySellToken || market.collateral;
            aleQuoteResult = await getAleSellQuote(DOLA, sellToken, amountToSellString, slippagePerc, false);
            if (!aleQuoteResult?.data || !!aleQuoteResult.msg) {
                const msg = aleQuoteResult?.validationErrors?.length > 0 ?
                    `Swap validation failed with: ${aleQuoteResult?.validationErrors[0].field} ${aleQuoteResult?.validationErrors[0].reason}`
                    : `Getting a quote failed`;
                return Promise.reject(msg);
            }
        }
    } catch (e) {
        console.log(e);
        return Promise.reject(`Getting a quote failed`);
    }

    const signatureResult = await getFirmSignature(signer, market.address, collateralToWithdraw, 'WithdrawOnBehalf', F2_ALE);
    // deleverage
    if (signatureResult) {
        const { deadline, r, s, v } = signatureResult;

        const { data: swapData, allowanceTarget, value, buyAmount, exchangeProxy, extraHelperData } = aleQuoteResult;
        const permitData = [deadline, v, r, s];
        let helperTransformData = '0x';
        const dolaBuyAmount = getBnToNumber(parseUnits(buyAmount, 0));
        const userDebt = await (new Contract(market.address, F2_MARKET_ABI, signer)).debts(await signer.getAddress());
        const minDolaAmountFromSwap = getNumberToBn(leverageMinAmountUp);
        const minDolaOrMaxRepayable = minDolaAmountFromSwap.gt(userDebt) ? userDebt : minDolaAmountFromSwap;       
        if (market.aleData?.buySellToken && !!market.aleTransformerType && aleTransformers[market.aleTransformerType]) {
            if(leverageMinAmountUp < (dolaBuyAmount * ANOMALY_PERC_FACTOR) || !sDolaExRate){
                alert('Something went wrong');
                return;
            }
            // withdraw from lp with sDOLA case: minOutAmount has to be in sDOLA instead of DOLA
            const minAmountForTransformer = market.nonProxySwapType?.includes('sDOLA') ? getNumberToBn(leverageMinAmountUp * 1 / sDolaExRate) : minDolaAmountFromSwap;
            helperTransformData = aleTransformers[market.aleTransformerType](market, minAmountForTransformer ? minAmountForTransformer : undefined, extraHelperData);
        }
        // dolaIn, minDbrOut, extraDolaToRepay
        const dbrData = [dbrToSell, minDolaOut, extraDolaToRepay];
        return deleveragePosition(
            signer,
            minDolaOrMaxRepayable,
            market.address,
            exchangeProxy,
            collateralToWithdraw,
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
    exchangeProxy: string,
    amountToWithdraw: BigNumber,
    swapData: string,
    permitTuple: any[],
    helperTransformData: string,
    dbrTuple: any[],
    value: string,
) => {
    return callWithHigherGL(
        getAleContract(signer),
        'deleveragePosition',
        [
            dolaToRepay,
            marketAd,
            exchangeProxy,
            amountToWithdraw,
            swapData,
            permitTuple,
            helperTransformData,
            dbrTuple,
        ],
        200000,
        { value },
    );
}

export const getAleSellQuote = async (
    buyAd: string,
    sellAd: string,
    sellAmount: string,
    slippagePercentage = '1',
    getPriceOnly = false,
) => {
    const method = getPriceOnly ? 'quote' : 'swap';
    let url = `/api/f2/ale-proxy?method=${method}&buyToken=${buyAd.toLowerCase()}&sellToken=${sellAd.toLowerCase()}&sellAmount=${sellAmount}&slippagePercentage=${slippagePercentage}`;
    return await fetcher60sectimeout(url);
}
// will do a binary search
export const getAleSellEnoughToRepayDebt = async (
    buyAd: string,
    sellAd: string,
    debt: string,
    deposits: string,
) => {
    let url = `/api/f2/ale-proxy?isFullDeleverage=true&method=quote&buyToken=${buyAd.toLowerCase()}&sellToken=${sellAd.toLowerCase()}&debt=${debt}&deposits=${deposits}`;
    return await fetcher60sectimeout(url);
}