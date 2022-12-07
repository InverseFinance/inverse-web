import { SimpleAmountForm } from "@app/components/common/SimpleAmountForm"
import { ChevronLeftIcon } from "@chakra-ui/icons"
import { HStack, Stack } from "@chakra-ui/react"
import { useContext, useState } from "react"
import { F2MarketContext } from "@app/components/F2/F2Contex"
import { RecapInfos } from "../Infos/RecapInfos"
import { StepNavBtn } from "./StepNavBtn"
import { f2depositAndBorrow } from "@app/util/f2"
import { getNumberToBn } from "@app/util/markets"
import { SuccessMessage } from "@app/components/common/Messages"
import { RSubmitButton } from "@app/components/common/Button/RSubmitButton"
import { useRouter } from "next/router"

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
        duration,
        newDBRExpiryDate,
    }

    const handleAction = () => {
        if(market.helper) {
            alert('Not implemented yet');
        } else {
            return f2depositAndBorrow(signer, market.address, getNumberToBn(collateralAmount, market.underlying.decimals), getNumberToBn(debtAmount));
        }        
    }

    const handleSuccess = () => {
        setIsDone(true);
        handleDebtChange('');
        handleCollateralChange(''); 
    }

    if(isDone) {
        return <SuccessMessage
            title="Borrowing complete!"
            alertProps={{ w: 'full' }}
            description={
                <Stack direction={{ base: 'column', sm: 'row' }} mt="4">
                    <RSubmitButton onClick={() => router.replace('/firm')}>
                        Go Back to Markets
                    </RSubmitButton>
                    <RSubmitButton onClick={() => setIsWalkthrough(false)}>
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
                defaultAmount={collateralAmount?.toString()}
                address={market.collateral}
                destination={market.address}
                signer={signer}
                decimals={colDecimals}
                maxAmountFrom={isDeposit ? [bnCollateralBalance] : [bnDeposits, bnWithdrawalLimit]}
                onAction={({ bnAmount }) => handleAction(bnAmount)}
                onMaxAction={({ bnAmount }) => { alert('Contract not available yet for this action') }}
                actionLabel={isDeposit ? 'Deposit & Borrow' : 'Repay & Withdraw'}
                showMaxBtn={false}
                isDisabled={duration <= 0 || debtAmount <= 0 || collateralAmount <= 0 || !market.leftToBorrow}
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