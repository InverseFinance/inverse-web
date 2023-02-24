import { SimpleAmountForm } from "@app/components/common/SimpleAmountForm"
import { ChevronLeftIcon } from "@chakra-ui/icons"
import { HStack, Stack } from "@chakra-ui/react"
import { useContext, useState } from "react"
import { F2MarketContext } from "@app/components/F2/F2Contex"
import { RecapInfos } from "../Infos/RecapInfos"
import { StepNavBtn } from "./StepNavBtn"
import { f2approxDbrAndDolaNeeded, f2depositAndBorrow, f2depositAndBorrowHelper } from "@app/util/f2"
import { SuccessMessage } from "@app/components/common/Messages"
import { RSubmitButton } from "@app/components/common/Button/RSubmitButton"
import { useRouter } from "next/router"
import { parseUnits } from "@ethersproject/units"
import { getNetworkConfigConstants } from "@app/util/networks"

const { F2_HELPER } = getNetworkConfigConstants();

export const F2WalkthroughRecap = ({
    onStepChange,
}: {
    onStepChange: (step: number) => void
}) => {
    const [isDone, setIsDone] = useState(false);
    const router = useRouter();

    const {
        step,
        market,
        signer,
        colDecimals,
        collateralAmount,
        collateralAmountNum,
        duration,
        debtAmount,
        debtAmountNum,
        isDeposit,
        bnCollateralBalance,
        bnDeposits,
        bnWithdrawalLimit,
        dbrCover,
        newLiquidationPrice,
        durationTypedValue,
        durationType,
        dbrPrice,
        riskColor,
        newPerc,
        dbrCoverDebt,
        newDBRExpiryDate,
        handleDebtChange,
        handleCollateralChange,
        setIsWalkthrough,
        isAutoDBR,
        isWethMarket,
        isUseNativeCoin,
        dbrBuySlippage,
        setDbrBuySlippage,
    } = useContext(F2MarketContext);

    const recapData = {
        market,
        dbrCover,
        newLiquidationPrice,
        durationTypedValue,
        durationType,
        dbrPrice,
        riskColor,
        newPerc,
        dbrCoverDebt,
        collateralAmount,
        debtAmount,
        collateralAmountNum,
        debtAmountNum,
        duration,
        newDBRExpiryDate,
        isWethMarket,
        isUseNativeCoin,
        dbrBuySlippage,
        setDbrBuySlippage,
    }

    const handleAction = async () => {
        if (market.helper) {
            let dolaNeededForDbr, maxDolaIn;            
            const approx = await f2approxDbrAndDolaNeeded(signer, parseUnits(debtAmount), duration);
            dolaNeededForDbr = approx[0];
            const slippage = parseFloat(dbrBuySlippage)+100;
            maxDolaIn = dolaNeededForDbr.mul(slippage).div(100);   
            return f2depositAndBorrowHelper(
                signer,
                market.address,
                parseUnits(collateralAmount, market.underlying.decimals),
                parseUnits(debtAmount),
                maxDolaIn,
                duration,
                isUseNativeCoin,
                false,
            );
        } else {
            return f2depositAndBorrow(signer, market.address, parseUnits(collateralAmount, market.underlying.decimals), parseUnits(debtAmount));
        }
    }

    const handleSuccess = () => {
        setIsDone(true);
    }

    const gotoLoan = () => {
        window.location.href = `/firm/${market.name}`;
    }

    if (isDone) {
        return <SuccessMessage
            title="Borrowing complete!"
            alertProps={{ w: 'full' }}
            iconProps={{ height: 50, width: 50 }}
            description={
                <Stack direction={{ base: 'column', sm: 'row' }} mt="4">
                    <RSubmitButton onClick={() => router.push(router.asPath.replace(`/${market.name}`, '').replace(/#step[0-9]/i, ''))}>
                        Go Back to Markets
                    </RSubmitButton>
                    <RSubmitButton onClick={() => gotoLoan()}>
                        Go to Loan
                    </RSubmitButton>
                </Stack>
            }
        />
    }

    return <>
        <RecapInfos {...recapData} />
        <HStack w='full' justify="space-between">
            <StepNavBtn onClick={() => onStepChange(step - 1)}>
                <ChevronLeftIcon fontSize="20px" /> Back
            </StepNavBtn>
            <HStack>
                <SimpleAmountForm
                    defaultAmount={collateralAmount}
                    address={isUseNativeCoin ? '' : market.collateral}
                    destination={isAutoDBR || isUseNativeCoin ? F2_HELPER : market.address}
                    signer={signer}
                    decimals={colDecimals}
                    maxAmountFrom={isDeposit ? [bnCollateralBalance] : [bnDeposits, bnWithdrawalLimit]}
                    onAction={({ bnAmount }) => handleAction()}
                    onMaxAction={({ bnAmount }) => { alert('Contract not available yet for this action') }}
                    actionLabel={(isAutoDBR && market.helper ? 'Sign + ' : '') + (isDeposit ? 'Deposit & Borrow' : 'Repay & Withdraw')}
                    approveLabel={isAutoDBR && market.helper ? 'Step 1/3 - Approve' : undefined}
                    showMaxBtn={false}
                    isDisabled={duration <= 0 || debtAmountNum <= 0 || collateralAmountNum <= 0 || !market.leftToBorrow || !parseFloat(dbrBuySlippage)}
                    hideInputIfNoAllowance={false}
                    hideInput={true}
                    hideButtons={false}
                    ButtonComp={StepNavBtn}
                    onSuccess={() => handleSuccess()}
                />
            </HStack>
        </HStack>
    </>
}