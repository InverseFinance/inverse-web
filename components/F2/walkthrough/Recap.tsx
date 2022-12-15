import { SimpleAmountForm } from "@app/components/common/SimpleAmountForm"
import { ChevronLeftIcon } from "@chakra-ui/icons"
import { HStack, Stack } from "@chakra-ui/react"
import { useContext, useState } from "react"
import { F2MarketContext } from "@app/components/F2/F2Contex"
import { RecapInfos } from "../Infos/RecapInfos"
import { StepNavBtn } from "./StepNavBtn"
import { f2depositAndBorrow } from "@app/util/f2"
import { SuccessMessage } from "@app/components/common/Messages"
import { RSubmitButton } from "@app/components/common/Button/RSubmitButton"
import { useRouter } from "next/router"
import { parseUnits } from "@ethersproject/units"

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
    }

    const handleAction = () => {
        if (market.helper) {
            alert('Not implemented yet');
        } else {
            return f2depositAndBorrow(signer, market.address, parseUnits(collateralAmount, market.underlying.decimals), parseUnits(debtAmount));
        }
    }

    const handleSuccess = () => {
        setIsDone(true);
    }

    const gotoLoan = () => {
        setIsWalkthrough(false);
        handleDebtChange('');
        handleCollateralChange('');
    }

    if (isDone) {
        return <SuccessMessage
            title="Borrowing complete!"
            alertProps={{ w: 'full' }}
            iconProps={{ height: 50, width: 50 }}
            description={
                <Stack direction={{ base: 'column', sm: 'row' }} mt="4">
                    <RSubmitButton onClick={() => router.replace('/firm')}>
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
                    address={market.collateral}
                    destination={market.address}
                    signer={signer}
                    decimals={colDecimals}
                    maxAmountFrom={isDeposit ? [bnCollateralBalance] : [bnDeposits, bnWithdrawalLimit]}
                    onAction={({ bnAmount }) => handleAction()}
                    onMaxAction={({ bnAmount }) => { alert('Contract not available yet for this action') }}
                    actionLabel={isDeposit ? 'Deposit & Borrow' : 'Repay & Withdraw'}
                    showMaxBtn={false}
                    isDisabled={duration <= 0 || debtAmountNum <= 0 || collateralAmountNum <= 0 || !market.leftToBorrow}
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