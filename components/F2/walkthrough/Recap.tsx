import { SubmitButton } from "@app/components/common/Button"
import { SimpleAmountForm } from "@app/components/common/SimpleAmountForm"
import { ChevronLeftIcon } from "@chakra-ui/icons"
import { HStack } from "@chakra-ui/react"
import { useContext } from "react"
import { F2MarketContext } from "@app/components/F2/F2Contex"
import { RecapInfos } from "../Infos/RecapInfos"
import { StepNavBtn } from "./StepNavBtn"

export const F2WalkthroughRecap = ({
    onStepChange,
}: {
    onStepChange: (step: number) => void
}) => {
    const {
        step,
        market,
        signer,
        colDecimals,
        collateralAmount,
        duration,
        debtAmount,
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
        duration,
        newDBRExpiryDate,
    }

    return <>
        <RecapInfos {...recapData} />
        <HStack w='full' justify="space-between">
            <StepNavBtn onClick={() => onStepChange(step - 1)}>
                <ChevronLeftIcon fontSize="20px" /> Back
            </StepNavBtn>
            <HStack>
            <SimpleAmountForm
                defaultAmount={collateralAmount?.toString()}
                address={market.collateral}
                destination={market.address}
                signer={signer}
                decimals={colDecimals}
                maxAmountFrom={isDeposit ? [bnCollateralBalance] : [bnDeposits, bnWithdrawalLimit]}
                onAction={({ bnAmount }) => { alert('Contract not available yet for this action') }}
                onMaxAction={({ bnAmount }) => { alert('Contract not available yet for this action') }}
                actionLabel={isDeposit ? 'Deposit & Borrow' : 'Repay & Withdraw'}
                showMaxBtn={false}
                isDisabled={duration <= 0 || debtAmount <= 0 || collateralAmount <= 0 || !market.leftToBorrow}
                hideInputIfNoAllowance={false}
                hideInput={true}
                hideButtons={false}
                ButtonComp={StepNavBtn}
            />
            </HStack>
        </HStack>
    </>
}