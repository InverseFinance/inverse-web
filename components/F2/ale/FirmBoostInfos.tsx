import { Slider, Text, VStack, SliderTrack, SliderFilledTrack, SliderThumb, HStack, Stack, InputGroup, InputRightElement, InputLeftElement, useDisclosure, SkeletonText } from '@chakra-ui/react'

import { useContext, useEffect, useMemo, useState } from 'react'
import { getBnToNumber, getNumberToBn, shortenNumber, smartShortNumber } from '@app/util/markets'
import { InfoMessage, WarningMessage } from '@app/components/common/Messages'
import { ArrowDownIcon, ArrowUpIcon, CheckCircleIcon } from '@chakra-ui/icons'
import { Input } from '@app/components/common/Input'
import { F2MarketContext } from '../F2Contex'
import { f2CalcNewHealth, getRiskColor } from '@app/util/f2'
import { useDebouncedEffect } from '@app/hooks/useDebouncedEffect'
import { F2Market } from '@app/types'
import { TextInfo, TextInfoSimple } from '@app/components/common/Messages/TextInfo'
import { getNetworkConfigConstants } from '@app/util/networks'
import { showToast } from '@app/util/notify'
import { INV_STAKERS_ONLY } from '@app/config/features'
import { InvPrime } from '@app/components/common/InvPrime'
import { AboutAleModal } from '../Modals/AboutAleModal'
import { getAleSellQuote } from '@app/util/firm-ale'
import { preciseCommify } from '@app/util/misc'
import { formatUnits, parseUnits } from '@ethersproject/units'
import { BigNumber, Contract } from 'ethers'
import { JsonRpcSigner } from '@ethersproject/providers'

const { DOLA } = getNetworkConfigConstants();

const roundDown = (v: number) => Math.floor(v * 100) / 100;
const roundUp = (v: number) => Math.ceil(v * 100) / 100;
let timeout = -1;

const getSteps = (
    market: F2Market,
    deposits: number,
    debt: number,
    perc: number,
    type: string,
    leverageLevel: number,
    aleSlippage: string,
    steps: number[] = [],
    doLastOne = false,
): number[] => {
    const isLeverageUp = type === 'up';
    const baseWorth = market.price ? deposits * market.price : 0;
    const _leverageLevel = leverageLevel + 0.01;
    const effectiveLeverage = isLeverageUp ? _leverageLevel : (1 / _leverageLevel);
    const desiredWorth = baseWorth * effectiveLeverage;

    const deltaBorrow = desiredWorth - baseWorth;
    const collateralPrice = market.price;
    const targetCollateralBalance = collateralPrice ? desiredWorth / collateralPrice : 0;

    const {
        newDebtSigned,
        newPerc,
    } = f2CalcNewHealth(
        market,
        deposits,
        debt,
        targetCollateralBalance - deposits,
        deltaBorrow,
        perc,
    );
    if ((newPerc <= 2) || _leverageLevel > 10 || doLastOne) {
        return steps;
    } else {
        return getSteps(market, deposits, debt, perc, type, _leverageLevel, aleSlippage, [...steps, _leverageLevel], newDebtSigned <= 0 && Math.abs(newDebtSigned) >= debt * (parseFloat(aleSlippage) / 100));
    }
}

const riskLevels = {
    'safer': { color: 'blue.500', text: 'Safer' },
    'low': { color: 'blue.500', text: 'Safer' },
    'lowMid': { color: 'yellow.500', text: 'Safer' },
    'mid': { color: 'orange.500', text: 'Riskier' },
    'midHigh': { color: 'tomato', text: 'Riskier' },
    'high': { color: 'red.500', text: 'Risky' },
    'riskier': { color: 'red.500', text: 'Riskier' },
}

const nonProxySwapGetters = {
    // TODO: scale & refacto
    'nonProxySwap': async (dolaAmountToDepositOrLpAmountToBurn: BigNumber | string, isDeposit: boolean, signer: JsonRpcSigner) => {
        const crvLpContract = new Contract('0x8272E1A3dBef607C04AA6e5BD3a1A134c8ac063B', [{"name":"Transfer","inputs":[{"name":"sender","type":"address","indexed":true},{"name":"receiver","type":"address","indexed":true},{"name":"value","type":"uint256","indexed":false}],"anonymous":false,"type":"event"},{"name":"Approval","inputs":[{"name":"owner","type":"address","indexed":true},{"name":"spender","type":"address","indexed":true},{"name":"value","type":"uint256","indexed":false}],"anonymous":false,"type":"event"},{"name":"TokenExchange","inputs":[{"name":"buyer","type":"address","indexed":true},{"name":"sold_id","type":"int128","indexed":false},{"name":"tokens_sold","type":"uint256","indexed":false},{"name":"bought_id","type":"int128","indexed":false},{"name":"tokens_bought","type":"uint256","indexed":false}],"anonymous":false,"type":"event"},{"name":"AddLiquidity","inputs":[{"name":"provider","type":"address","indexed":true},{"name":"token_amounts","type":"uint256[2]","indexed":false},{"name":"fees","type":"uint256[2]","indexed":false},{"name":"invariant","type":"uint256","indexed":false},{"name":"token_supply","type":"uint256","indexed":false}],"anonymous":false,"type":"event"},{"name":"RemoveLiquidity","inputs":[{"name":"provider","type":"address","indexed":true},{"name":"token_amounts","type":"uint256[2]","indexed":false},{"name":"fees","type":"uint256[2]","indexed":false},{"name":"token_supply","type":"uint256","indexed":false}],"anonymous":false,"type":"event"},{"name":"RemoveLiquidityOne","inputs":[{"name":"provider","type":"address","indexed":true},{"name":"token_amount","type":"uint256","indexed":false},{"name":"coin_amount","type":"uint256","indexed":false},{"name":"token_supply","type":"uint256","indexed":false}],"anonymous":false,"type":"event"},{"name":"RemoveLiquidityImbalance","inputs":[{"name":"provider","type":"address","indexed":true},{"name":"token_amounts","type":"uint256[2]","indexed":false},{"name":"fees","type":"uint256[2]","indexed":false},{"name":"invariant","type":"uint256","indexed":false},{"name":"token_supply","type":"uint256","indexed":false}],"anonymous":false,"type":"event"},{"name":"RampA","inputs":[{"name":"old_A","type":"uint256","indexed":false},{"name":"new_A","type":"uint256","indexed":false},{"name":"initial_time","type":"uint256","indexed":false},{"name":"future_time","type":"uint256","indexed":false}],"anonymous":false,"type":"event"},{"name":"StopRampA","inputs":[{"name":"A","type":"uint256","indexed":false},{"name":"t","type":"uint256","indexed":false}],"anonymous":false,"type":"event"},{"name":"CommitNewFee","inputs":[{"name":"new_fee","type":"uint256","indexed":false}],"anonymous":false,"type":"event"},{"name":"ApplyNewFee","inputs":[{"name":"fee","type":"uint256","indexed":false}],"anonymous":false,"type":"event"},{"stateMutability":"nonpayable","type":"constructor","inputs":[],"outputs":[]},{"stateMutability":"nonpayable","type":"function","name":"initialize","inputs":[{"name":"_name","type":"string"},{"name":"_symbol","type":"string"},{"name":"_coins","type":"address[4]"},{"name":"_rate_multipliers","type":"uint256[4]"},{"name":"_A","type":"uint256"},{"name":"_fee","type":"uint256"}],"outputs":[]},{"stateMutability":"view","type":"function","name":"decimals","inputs":[],"outputs":[{"name":"","type":"uint8"}]},{"stateMutability":"nonpayable","type":"function","name":"transfer","inputs":[{"name":"_to","type":"address"},{"name":"_value","type":"uint256"}],"outputs":[{"name":"","type":"bool"}]},{"stateMutability":"nonpayable","type":"function","name":"transferFrom","inputs":[{"name":"_from","type":"address"},{"name":"_to","type":"address"},{"name":"_value","type":"uint256"}],"outputs":[{"name":"","type":"bool"}]},{"stateMutability":"nonpayable","type":"function","name":"approve","inputs":[{"name":"_spender","type":"address"},{"name":"_value","type":"uint256"}],"outputs":[{"name":"","type":"bool"}]},{"stateMutability":"nonpayable","type":"function","name":"permit","inputs":[{"name":"_owner","type":"address"},{"name":"_spender","type":"address"},{"name":"_value","type":"uint256"},{"name":"_deadline","type":"uint256"},{"name":"_v","type":"uint8"},{"name":"_r","type":"bytes32"},{"name":"_s","type":"bytes32"}],"outputs":[{"name":"","type":"bool"}]},{"stateMutability":"view","type":"function","name":"last_price","inputs":[],"outputs":[{"name":"","type":"uint256"}]},{"stateMutability":"view","type":"function","name":"ema_price","inputs":[],"outputs":[{"name":"","type":"uint256"}]},{"stateMutability":"view","type":"function","name":"get_balances","inputs":[],"outputs":[{"name":"","type":"uint256[2]"}]},{"stateMutability":"view","type":"function","name":"admin_fee","inputs":[],"outputs":[{"name":"","type":"uint256"}]},{"stateMutability":"view","type":"function","name":"A","inputs":[],"outputs":[{"name":"","type":"uint256"}]},{"stateMutability":"view","type":"function","name":"A_precise","inputs":[],"outputs":[{"name":"","type":"uint256"}]},{"stateMutability":"view","type":"function","name":"get_p","inputs":[],"outputs":[{"name":"","type":"uint256"}]},{"stateMutability":"view","type":"function","name":"price_oracle","inputs":[],"outputs":[{"name":"","type":"uint256"}]},{"stateMutability":"view","type":"function","name":"get_virtual_price","inputs":[],"outputs":[{"name":"","type":"uint256"}]},{"stateMutability":"view","type":"function","name":"calc_token_amount","inputs":[{"name":"_amounts","type":"uint256[2]"},{"name":"_is_deposit","type":"bool"}],"outputs":[{"name":"","type":"uint256"}]},{"stateMutability":"nonpayable","type":"function","name":"add_liquidity","inputs":[{"name":"_amounts","type":"uint256[2]"},{"name":"_min_mint_amount","type":"uint256"}],"outputs":[{"name":"","type":"uint256"}]},{"stateMutability":"nonpayable","type":"function","name":"add_liquidity","inputs":[{"name":"_amounts","type":"uint256[2]"},{"name":"_min_mint_amount","type":"uint256"},{"name":"_receiver","type":"address"}],"outputs":[{"name":"","type":"uint256"}]},{"stateMutability":"view","type":"function","name":"get_dy","inputs":[{"name":"i","type":"int128"},{"name":"j","type":"int128"},{"name":"dx","type":"uint256"}],"outputs":[{"name":"","type":"uint256"}]},{"stateMutability":"view","type":"function","name":"get_dx","inputs":[{"name":"i","type":"int128"},{"name":"j","type":"int128"},{"name":"dy","type":"uint256"}],"outputs":[{"name":"","type":"uint256"}]},{"stateMutability":"nonpayable","type":"function","name":"exchange","inputs":[{"name":"i","type":"int128"},{"name":"j","type":"int128"},{"name":"_dx","type":"uint256"},{"name":"_min_dy","type":"uint256"}],"outputs":[{"name":"","type":"uint256"}]},{"stateMutability":"nonpayable","type":"function","name":"exchange","inputs":[{"name":"i","type":"int128"},{"name":"j","type":"int128"},{"name":"_dx","type":"uint256"},{"name":"_min_dy","type":"uint256"},{"name":"_receiver","type":"address"}],"outputs":[{"name":"","type":"uint256"}]},{"stateMutability":"nonpayable","type":"function","name":"remove_liquidity","inputs":[{"name":"_burn_amount","type":"uint256"},{"name":"_min_amounts","type":"uint256[2]"}],"outputs":[{"name":"","type":"uint256[2]"}]},{"stateMutability":"nonpayable","type":"function","name":"remove_liquidity","inputs":[{"name":"_burn_amount","type":"uint256"},{"name":"_min_amounts","type":"uint256[2]"},{"name":"_receiver","type":"address"}],"outputs":[{"name":"","type":"uint256[2]"}]},{"stateMutability":"nonpayable","type":"function","name":"remove_liquidity_imbalance","inputs":[{"name":"_amounts","type":"uint256[2]"},{"name":"_max_burn_amount","type":"uint256"}],"outputs":[{"name":"","type":"uint256"}]},{"stateMutability":"nonpayable","type":"function","name":"remove_liquidity_imbalance","inputs":[{"name":"_amounts","type":"uint256[2]"},{"name":"_max_burn_amount","type":"uint256"},{"name":"_receiver","type":"address"}],"outputs":[{"name":"","type":"uint256"}]},{"stateMutability":"view","type":"function","name":"calc_withdraw_one_coin","inputs":[{"name":"_burn_amount","type":"uint256"},{"name":"i","type":"int128"}],"outputs":[{"name":"","type":"uint256"}]},{"stateMutability":"nonpayable","type":"function","name":"remove_liquidity_one_coin","inputs":[{"name":"_burn_amount","type":"uint256"},{"name":"i","type":"int128"},{"name":"_min_received","type":"uint256"}],"outputs":[{"name":"","type":"uint256"}]},{"stateMutability":"nonpayable","type":"function","name":"remove_liquidity_one_coin","inputs":[{"name":"_burn_amount","type":"uint256"},{"name":"i","type":"int128"},{"name":"_min_received","type":"uint256"},{"name":"_receiver","type":"address"}],"outputs":[{"name":"","type":"uint256"}]},{"stateMutability":"nonpayable","type":"function","name":"ramp_A","inputs":[{"name":"_future_A","type":"uint256"},{"name":"_future_time","type":"uint256"}],"outputs":[]},{"stateMutability":"nonpayable","type":"function","name":"stop_ramp_A","inputs":[],"outputs":[]},{"stateMutability":"nonpayable","type":"function","name":"set_ma_exp_time","inputs":[{"name":"_ma_exp_time","type":"uint256"}],"outputs":[]},{"stateMutability":"view","type":"function","name":"admin_balances","inputs":[{"name":"i","type":"uint256"}],"outputs":[{"name":"","type":"uint256"}]},{"stateMutability":"nonpayable","type":"function","name":"commit_new_fee","inputs":[{"name":"_new_fee","type":"uint256"}],"outputs":[]},{"stateMutability":"nonpayable","type":"function","name":"apply_new_fee","inputs":[],"outputs":[]},{"stateMutability":"nonpayable","type":"function","name":"withdraw_admin_fees","inputs":[],"outputs":[]},{"stateMutability":"pure","type":"function","name":"version","inputs":[],"outputs":[{"name":"","type":"string"}]},{"stateMutability":"view","type":"function","name":"factory","inputs":[],"outputs":[{"name":"","type":"address"}]},{"stateMutability":"view","type":"function","name":"coins","inputs":[{"name":"arg0","type":"uint256"}],"outputs":[{"name":"","type":"address"}]},{"stateMutability":"view","type":"function","name":"balances","inputs":[{"name":"arg0","type":"uint256"}],"outputs":[{"name":"","type":"uint256"}]},{"stateMutability":"view","type":"function","name":"fee","inputs":[],"outputs":[{"name":"","type":"uint256"}]},{"stateMutability":"view","type":"function","name":"future_fee","inputs":[],"outputs":[{"name":"","type":"uint256"}]},{"stateMutability":"view","type":"function","name":"admin_action_deadline","inputs":[],"outputs":[{"name":"","type":"uint256"}]},{"stateMutability":"view","type":"function","name":"initial_A","inputs":[],"outputs":[{"name":"","type":"uint256"}]},{"stateMutability":"view","type":"function","name":"future_A","inputs":[],"outputs":[{"name":"","type":"uint256"}]},{"stateMutability":"view","type":"function","name":"initial_A_time","inputs":[],"outputs":[{"name":"","type":"uint256"}]},{"stateMutability":"view","type":"function","name":"future_A_time","inputs":[],"outputs":[{"name":"","type":"uint256"}]},{"stateMutability":"view","type":"function","name":"name","inputs":[],"outputs":[{"name":"","type":"string"}]},{"stateMutability":"view","type":"function","name":"symbol","inputs":[],"outputs":[{"name":"","type":"string"}]},{"stateMutability":"view","type":"function","name":"balanceOf","inputs":[{"name":"arg0","type":"address"}],"outputs":[{"name":"","type":"uint256"}]},{"stateMutability":"view","type":"function","name":"allowance","inputs":[{"name":"arg0","type":"address"},{"name":"arg1","type":"address"}],"outputs":[{"name":"","type":"uint256"}]},{"stateMutability":"view","type":"function","name":"totalSupply","inputs":[],"outputs":[{"name":"","type":"uint256"}]},{"stateMutability":"view","type":"function","name":"DOMAIN_SEPARATOR","inputs":[],"outputs":[{"name":"","type":"bytes32"}]},{"stateMutability":"view","type":"function","name":"nonces","inputs":[{"name":"arg0","type":"address"}],"outputs":[{"name":"","type":"uint256"}]},{"stateMutability":"view","type":"function","name":"ma_exp_time","inputs":[],"outputs":[{"name":"","type":"uint256"}]},{"stateMutability":"view","type":"function","name":"ma_last_time","inputs":[],"outputs":[{"name":"","type":"uint256"}]}], signer);
        // amount in lp, = change in lp supply when depositing or withdrawing dola
        if(isDeposit) {
            return (await crvLpContract.calc_token_amount([dolaAmountToDepositOrLpAmountToBurn.toString(), '0'], true));
        } else {
            return (await crvLpContract.calc_withdraw_one_coin(dolaAmountToDepositOrLpAmountToBurn.toString(), 0));
        }
    },
}

export const getLeverageImpact = async ({
    setLeverageLoading,
    leverageLevel,
    market,
    isUp,
    deposits,
    initialDeposit,
    dolaPrice = 1,
    aleSlippage,
    viaInput = false,
    dolaInput,
    underlyingExRate = 1,
    signer,
}) => {
    // only when there is a transformation needed and when using a proxy when using ALE, otherwise the underlyingExRate is just a ui info
    const exRate = market?.aleData?.useProxy && market?.aleData?.buySellToken?.toLowerCase() !== market?.collateral?.toLowerCase() ? underlyingExRate : 1;   
    const collateralPrice = market?.price;
    if (!collateralPrice || leverageLevel <= 1) {
        return
    }
    if (setLeverageLoading) {
        setLeverageLoading(true);
    }
    if (isUp) {
        // leverage up: dola amount is fixed, collateral amount is variable
        // if already has deposits, base is deposits, if not (=depositAndLeverage case), base is initialDeposit
        const baseColAmountForLeverage = deposits > 0 ? deposits + initialDeposit : initialDeposit;
        const baseWorth = baseColAmountForLeverage * collateralPrice;
        let borrowStringToSign, borrowNumToSign;
        // leverage level slider / input, result from 1inch
        if (!viaInput && !market.isAleWithoutSwap) {            
            const amountUp = baseColAmountForLeverage * leverageLevel - baseColAmountForLeverage;
            const { buyAmount } = await getAleSellQuote(DOLA, market.aleData.buySellToken || market.collateral, getNumberToBn(amountUp, market.underlying.decimals).toString(), aleSlippage, true);
            borrowStringToSign = buyAmount;
            borrowNumToSign = parseFloat(borrowStringToSign) / (1e18);
        }
        // leverage info by changing the dola input
        else if (!!dolaInput) {
            borrowNumToSign = parseFloat(dolaInput);
            borrowStringToSign = getNumberToBn(borrowNumToSign).toString();
        }
        // via leverage level slider or leverage level input
        else {            
            const targetWorth = baseWorth * leverageLevel;
            borrowNumToSign = (targetWorth - baseWorth) * dolaPrice;
            borrowStringToSign = getNumberToBn(borrowNumToSign).toString();
        }

        let collateralAdded, errorMsg;
        // classic case, using 1inch
        if(!market.isAleWithoutSwap) {
            // in the end the reference is always a number of dola sold (as it's what we need to sign, or part of it if with dbr)
            const { buyAmount, validationErrors, msg } = await getAleSellQuote(market.aleData.buySellToken || market.collateral, DOLA, borrowStringToSign, aleSlippage, true);
            errorMsg = validationErrors?.length > 0 ?
                `Swap validation failed with: ${validationErrors[0].field} ${validationErrors[0].reason}`
                : msg;
                collateralAdded = buyAmount;
        } 
        // DOLA LP case, result not from 1inch
        else { 
            if(signer) {
                const rootLpAddedBn = await nonProxySwapGetters.nonProxySwap(getNumberToBn(borrowNumToSign), true, signer);
                collateralAdded = underlyingExRate ? getNumberToBn(getBnToNumber(rootLpAddedBn) / underlyingExRate).toString() : rootLpAddedBn.toString();
            } else {
                collateralAdded = getNumberToBn((borrowNumToSign * dolaPrice) / market.price, market.underlying.decimals).toString();
            }     
        }
        if (setLeverageLoading) setLeverageLoading(false);
        return {
            errorMsg,
            dolaAmount: borrowNumToSign,
            collateralAmount: (parseFloat(collateralAdded) / exRate) / (10 ** market.underlying.decimals),
        }
    } else {
        // leverage down: dola amount is variable, collateral amount is fixed
        // when deleveraging base is always current deposits
        const baseColAmountForLeverage = deposits;
        const baseWorth = baseColAmountForLeverage * collateralPrice;
        const targetWorth = Math.max(0, baseWorth * (1 / leverageLevel));
        const targetCollateralBalance = targetWorth / collateralPrice;
        const withdrawAmountToSign = targetCollateralBalance - baseColAmountForLeverage;
        let buyAmount, errorMsg;
        // classic case
        if(!market.isAleWithoutSwap){
            const { buyAmount: _buyAmount, validationErrors, msg } = await getAleSellQuote(DOLA, market.aleData.buySellToken || market.collateral, getNumberToBn(Math.abs(withdrawAmountToSign) * exRate, market.underlying.decimals).toString(), aleSlippage, true);
            buyAmount = _buyAmount;
            errorMsg = validationErrors?.length > 0 ?
            `Swap validation failed with: ${validationErrors[0].field} ${validationErrors[0].reason}`
            : msg;
        } else {
            if(signer) {
                const lpAmountInUnderlying = underlyingExRate ? Math.abs(withdrawAmountToSign) * underlyingExRate : Math.abs(withdrawAmountToSign);
                buyAmount = (await nonProxySwapGetters.nonProxySwap(getNumberToBn(lpAmountInUnderlying), false, signer)).toString();
            } else {
                buyAmount = getNumberToBn(Math.abs(withdrawAmountToSign) * market.price / dolaPrice).toString();
            }            
        }                
        if (setLeverageLoading) setLeverageLoading(false);
        return {
            errorMsg,
            dolaAmount: parseFloat(buyAmount) / 1e18,
            collateralAmount: withdrawAmountToSign,
        }
    }
}

export const FirmBoostInfos = ({
    type = 'up',
    onLeverageChange,
    triggerCollateralAndOrLeverageChange,
}: {
    type?: 'up' | 'down',
    onLeverageChange: ({ }) => void
    triggerCollateralAndOrLeverageChange,
}) => {
    const {
        market,
        deposits,
        debt,
        perc,
        leverage: leverageLevel,
        setLeverage: setLeverageLevel,
        debtAmountNum,
        leverageDebtAmount,
        collateralAmountNum,
        leverageCollateralAmount,
        newPerc,
        aleSlippage,
        setAleSlippage,
        dolaPrice,
        leverageLoading,
        setLeverageLoading,
        isInvPrimeMember,
        isTriggerLeverageFetch,
        underlyingExRate,
        mode,
        setLeverageMinAmountUp,
        setLeverageMinDebtReduced,
        signer,
    } = useContext(F2MarketContext);
    
    const newBorrowLimit = 100 - newPerc;
    const showBorrowLimitTooHighMsg = newBorrowLimit >= 99 && !leverageLoading && !isTriggerLeverageFetch;
    const { isOpen, onOpen, onClose } = useDisclosure();
    const minLeverage = 1;
    // const [leverageLevel, setLeverageLevel] = useState(minLeverage || _leverageLevel);
    const [editLeverageLevel, setEditLeverageLevel] = useState(leverageLevel.toString());
    const [debounced, setDebounced] = useState(true);
    const [debouncedShowdBorrowLimitMsg, setDebouncedShowdBorrowLimitMsg] = useState(showBorrowLimitTooHighMsg);

    const isLeverageUp = type === 'up';

    const baseColAmountForLeverage = deposits > 0 ? deposits + collateralAmountNum : collateralAmountNum;
    const leverageSteps = useMemo(() => getSteps(market, baseColAmountForLeverage, debt, perc, type, 1, aleSlippage, []), [market, baseColAmountForLeverage, debt, perc, type, undefined, aleSlippage]);
    // when deleveraging we want the max to be higher what's required to repay all debt, the extra dola is sent to the wallet
    const maxLeverage = isLeverageUp ? roundDown(leverageSteps[leverageSteps.length - 1]) : roundUp(leverageSteps[leverageSteps.length - 1]);
    const leverageRelativeToMax = leverageLevel / maxLeverage;

    const risk = useMemo(() => {
        return leverageRelativeToMax <= 0.5 ?
        riskLevels.low : leverageRelativeToMax <= 0.60 ?
            riskLevels.lowMid : leverageRelativeToMax <= 0.70 ?
                riskLevels.mid : leverageRelativeToMax <= 0.80 ?
                    riskLevels.midHigh : riskLevels.high
    }, [leverageRelativeToMax]);

    const boostLabel = isLeverageUp ? 'Leverage' : 'Deleverage';

    useDebouncedEffect(() => {
        setDebounced(!!editLeverageLevel && (!editLeverageLevel.endsWith('.') || editLeverageLevel === '.') && !isNaN(parseFloat(editLeverageLevel)));
    }, [editLeverageLevel], 500);

    useDebouncedEffect(() => {
        setDebouncedShowdBorrowLimitMsg(showBorrowLimitTooHighMsg);
    }, [showBorrowLimitTooHighMsg], 500);

    useEffect(() => {
        setEditLeverageLevel(leverageLevel.toFixed(2));
    }, [leverageLevel])

    const isInvalidLeverage = (input: number, isLeverageUp: boolean) => {
        return !input || isNaN(input) || input < minLeverage || (isLeverageUp && input > maxLeverage);
    }

    const validatePendingLeverage = (v: string, isLeverageUp: boolean) => {
        const input = parseFloat(v);
        if (isInvalidLeverage(input, isLeverageUp)) {
            return;
        }
        handleLeverageChange(input);
    }

    const editLeverageIsInvalid = isInvalidLeverage(parseFloat(editLeverageLevel), isLeverageUp);
    const knownFixedAmount = isLeverageUp ? debtAmountNum : collateralAmountNum;
    const aleSlippageFactor = (1 - parseFloat(aleSlippage) / 100);
    const estimatedAmount = leverageLevel > 1 ? parseFloat(isLeverageUp ? leverageCollateralAmount : leverageDebtAmount) : 0;
    const minAmount = aleSlippage ? aleSlippageFactor * estimatedAmount : 0;
    // when leveraging down min amount (or debt) is always the amount repaid, the slippage impacts amount of dola received in wallet
    const amountOfDebtReduced = !isLeverageUp ? Math.min(minAmount, debt) : 0;
    const extraDolaReceivedInWallet = isLeverageUp ? 0 : estimatedAmount - amountOfDebtReduced;

    useEffect(() => {
        setLeverageMinAmountUp(minAmount);
    }, [minAmount]);

    useEffect(() => {
        setLeverageMinDebtReduced(amountOfDebtReduced);
    }, [amountOfDebtReduced, aleSlippageFactor]);

    if (!market?.underlying) {
        return <></>
    }

    const handleEditLeverage = (value: string) => {
        setDebounced(false);
        const stringAmount = value.replace(/[^0-9.]/, '').replace(/(\..*)\./g, '$1');
        setEditLeverageLevel(stringAmount);
    }

    const handleSliderLeverage = (value: string, isLeverageUp: boolean) => {
        setDebounced(false);
        setLeverageLevel(value);

        const debouncedAction = () => {
            validatePendingLeverage(value, isLeverageUp);
        }

        if (timeout !== -1) {
            clearTimeout(timeout);
        }
        timeout = setTimeout(() => {
            debouncedAction();
        }, 500);
    }

    const handleKeyPress = (e: any) => {
        if (e.key === 'Enter') {
            validatePendingLeverage(editLeverageLevel, isLeverageUp);
        }
    }

    const handleSellEnough = async () => {
        if (!market.price) return;
        setLeverageLoading(true);
        const estimatedDolaRequiredBeforeSlippage = debt * (1 + (parseFloat(aleSlippage) + 2) / 100);
        const estimatedResult = await getAleSellQuote(market.collateral, DOLA, getNumberToBn(estimatedDolaRequiredBeforeSlippage).toString(), aleSlippage, true);

        if (!estimatedResult?.buyAmount) {
            showToast({ status: 'warning', title: 'Could not estimate amount to sell to repay all' });
            return
        }
        const estimatedCollateralAmountToSell = formatUnits(parseUnits(estimatedResult?.buyAmount, '0'), market.underlying.decimals);
        triggerCollateralAndOrLeverageChange(estimatedCollateralAmountToSell, parseFloat(estimatedCollateralAmountToSell));
    }

    const handleLeverageChange = async (v: number) => {
        setDebounced(false);
        if (v <= 1 || isNaN(v)) return;
        setLeverageLevel(v);
        if (!market.price) return;
        const { dolaAmount, collateralAmount, errorMsg, estimatedPriceImpact } = await getLeverageImpact({
            setLeverageLoading,
            leverageLevel: parseFloat(v),
            market,
            deposits,
            initialDeposit: collateralAmountNum,
            isUp: isLeverageUp,
            aleSlippage,
            dolaPrice,
            underlyingExRate,
            signer,
        });

        if (!!errorMsg) {
            showToast({ status: 'warning', description: errorMsg, title: 'Could not fetch swap data' })
            return
        }
        onLeverageChange({
            dolaAmount,
            collateralAmount,
            isLeverageUp,
            estimatedPriceImpact,
        })
    }

    if (!isInvPrimeMember && INV_STAKERS_ONLY.firmLeverage) {
        return <InvPrime showLinks={false} />
    } else if (isLeverageUp && market.leftToBorrow < 1) {
        return <InfoMessage alertProps={{ w: 'full' }} description="Cannot use leverage when there is no DOLA liquidity" />
    }

    return <Stack borderRadius='5px' p='4' bgColor="infoAlpha" fontSize="14px" spacing="4" w='full' direction={{ base: 'column', lg: 'row' }} justify="space-between" alignItems="center">
        <VStack position="relative" w='full' alignItems="center" justify="center">            
            <HStack spacing="2" w='full' justify="space-between" alignItems="center">
                <InputGroup
                    w='fit-content'
                    alignItems="center"
                >
                    <InputLeftElement
                        children={<Text cursor="text" as="label" for="boostInput" color="secondaryTextColor" whiteSpace="nowrap" transform="translateX(60px)" fontSize={{ base: '20px', lg: '22px' }} fontWeight="extrabold">
                            {boostLabel}:
                        </Text>}
                    />
                    <Input shadow="0 0 0px 1px rgba(0, 0, 0, 0.25)" fontWeight="extrabold" fontSize={leverageLevel === Infinity ? '16px' : { base: '20px', lg: '24px' }} _focusVisible={false} isInvalid={editLeverageIsInvalid} autocomplete="off" onKeyPress={handleKeyPress} id="boostInput" color={risk.color} py="0" pl="60px" onChange={(e) => handleEditLeverage(e.target.value, minLeverage, maxLeverage)} width="225px" value={editLeverageLevel} min={minLeverage} max={maxLeverage} />
                    {
                        editLeverageLevel !== leverageLevel.toFixed(2) && debounced && !editLeverageIsInvalid &&
                        <InputRightElement cursor="pointer" transform="translateX(40px)" onClick={() => validatePendingLeverage(editLeverageLevel, isLeverageUp)}
                            children={<CheckCircleIcon transition="ease-in-out" transitionDuration="300ms" transitionProperty="color" _hover={{ color: 'success' }} />}
                        />
                    }
                </InputGroup>
                {
                    leverageLoading && <Text fontSize="16px" fontWeight="bold" color="secondaryTextColor">Fetching 1inch swap data...</Text>
                }
                {
                    !leverageLoading && leverageLevel > 1 && <TextInfoSimple direction="row-reverse" message={isLeverageUp ? `Collateral added thanks to leverage` : `Collateral reduced thanks to deleverage`}>
                        <HStack fontWeight="bold" spacing="1" alignItems="center">
                            {isLeverageUp ? <ArrowUpIcon color="success" fontSize="20px" /> : <ArrowDownIcon color="warning" fontSize="20px" />}
                            <VStack spacing="0">
                                <Text textDecoration="underline" cursor="default" w='fit-content' fontSize="15px" textAlign="center">
                                    {isLeverageUp ? '~' : ''}{smartShortNumber(isLeverageUp ? parseFloat(leverageCollateralAmount) : collateralAmountNum, 4)}
                                </Text>
                                <Text textDecoration="underline" cursor="default" fontSize="15px">
                                    {market.underlying.symbol}
                                </Text>
                            </VStack>
                        </HStack>
                    </TextInfoSimple>
                }
                {
                    !leverageLoading && leverageLevel > 1 && <TextInfoSimple direction="row-reverse" message={isLeverageUp ? `Debt added due to leverage` : `Debt reduced via deleveraging, if higher than the current debt the extra DOLA goes to the user wallet`}>
                        <HStack fontWeight="bold" spacing="1" alignItems="center">
                            {isLeverageUp ? <ArrowUpIcon color="warning" fontSize="20px" /> : <ArrowDownIcon color="success" fontSize="20px" />}
                            <VStack spacing="0">
                                <Text textDecoration="underline" cursor="default" w='fit-content' fontSize="15px" textAlign="center">
                                    {smartShortNumber(!isLeverageUp ? amountOfDebtReduced : debtAmountNum, 2)}
                                </Text>
                                <Text textDecoration="underline" cursor="default" fontSize="15px">DEBT</Text>
                            </VStack>
                        </HStack>
                    </TextInfoSimple>
                }
                {
                    !leverageLoading && leverageLevel > 1 && !isLeverageUp && extraDolaReceivedInWallet > 0 && <TextInfoSimple direction="row-reverse" message={"DOLA estimated to be sent to wallet directly, it depends on the difference between min amount to receive from sell and actual amount or amount and debt"}>
                        <HStack fontWeight="bold" spacing="1" alignItems="center">
                            <ArrowUpIcon color="success" fontSize="20px" />
                            <VStack spacing="0">
                                <Text textDecoration="underline" cursor="default" w='fit-content' fontSize="15px" textAlign="center">
                                    ~{smartShortNumber(extraDolaReceivedInWallet, 2)}
                                </Text>
                                <Text textDecoration="underline" cursor="default" fontSize="15px">DOLA</Text>
                            </VStack>
                        </HStack>
                    </TextInfoSimple>
                }
            </HStack>
            <Slider
                value={leverageLevel}
                onChange={(v: number) => handleSliderLeverage(v, isLeverageUp)}
                min={minLeverage}
                max={maxLeverage}
                step={0.01}
                aria-label='slider-ex-4'
                defaultValue={leverageLevel}
                focusThumbOnChange={false}
            >
                <SliderTrack borderRadius="50px" h="15px" bg='red.100'>
                    <SliderFilledTrack bg={risk.color} />
                </SliderTrack>
                <SliderThumb h="30px" w="20px" />
            </Slider>
            <HStack w='full' justify="space-between" alignItems="center">
                <Text fontWeight="bold" color={riskLevels.safer.color}>
                    No {isLeverageUp ? 'leverage' : 'deleverage'}
                </Text>
                <Text textDecoration="underline" fontWeight="bold" cursor="pointer" color={isLeverageUp ? riskLevels.riskier.color : riskLevels.safer.color} onClick={() => isLeverageUp ? handleLeverageChange(maxLeverage) : handleSellEnough()}>
                    {isLeverageUp ? `Near-max: x${shortenNumber(maxLeverage, 2)}` : 'Sell enough to repay all (estimate)'}
                </Text>
            </HStack>
            <HStack spacing="1" w='full' alignItems="flex-start">
                <TextInfo message="The quote on 1inch for the trade required to do leverage/deleverage">
                    <Text>Quote:</Text>
                    {
                        leverageLoading || isTriggerLeverageFetch ? <SkeletonText pt="2px" skeletonHeight={3} height={'16px'} width={'90px'} noOfLines={1} />
                            : <Text>{estimatedAmount > 0 && knownFixedAmount > 0 ? `~${preciseCommify(isLeverageUp ? knownFixedAmount / estimatedAmount : estimatedAmount / knownFixedAmount, 4)} DOLA per ${market.underlying.symbol}` : '-'}</Text>
                    }
                </TextInfo>
            </HStack>
            <HStack w='full' justify="space-between">
                <TextInfo
                    message="Collateral and DOLA market price can vary, the max. slippage % allows the swap required for leverage to be within a certain range, if out of range, the transaction will revert or fail">
                    <Text>
                        Max. swap slippage for leverage %:
                    </Text>
                </TextInfo>
                <Input shadow="0 0 0px 1px rgba(0, 0, 0, 0.25)" py="0" maxH="30px" w='90px' value={aleSlippage} onChange={(e) => {
                    setAleSlippage(e.target.value.replace(/[^0-9.]/, '').replace(/(\..*)\./g, '$1'));
                }} />
            </HStack>
            {
                leverageLevel > 1 && <HStack w='full' justify="space-between">
                    <TextInfo
                        message="This is the minimum amount that you're willing to accept for the trade, if the amount is not within the slippage range the transaction will fail or revert.">
                        <Text>
                            Min. amount swapped for {preciseCommify(knownFixedAmount, 8, false, true)} {!isLeverageUp ? market.underlying.symbol : 'DOLA'}: {preciseCommify(minAmount, isLeverageUp ? 6 : 2, false, true)} {isLeverageUp ? market.underlying.symbol : 'DOLA'}
                        </Text>
                    </TextInfo>
                </HStack>
            }
            {
                extraDolaReceivedInWallet > 10_000_0000 && <WarningMessage
                    alertProps={{ w: 'full' }}
                    description="Warning: there seems to be a routing issue with 1inch at the moment, we don't advise to continue, the transaction will likely fail."
                />
            }
            <AboutAleModal isOpen={isOpen} onClose={onClose} />
            <Text fontWeight="bold" cursor="pointer" w='full' textAlign="left" textDecoration="underline" onClick={onOpen}>
                About the Accelerated Leverage Engine
            </Text>
            {
                debouncedShowdBorrowLimitMsg && <WarningMessage description="New borrow limit would be too high" />
            }
        </VStack>
    </Stack>
}