import { MarketImage } from "@app/components/common/Assets/MarketImage"
import { SubmitButton } from "@app/components/common/Button"
import { AmountInfos } from "@app/components/common/Messages/AmountInfos"
import { TextInfo } from "@app/components/common/Messages/TextInfo"
import { SimpleAmountForm } from "@app/components/common/SimpleAmountForm"
import { ChevronLeftIcon, ChevronRightIcon } from "@chakra-ui/icons"
import { VStack, Text, HStack, Divider } from "@chakra-ui/react"
import { parseEther } from "@ethersproject/units"
import { useContext, useEffect } from "react"
import { F2FormInfos } from "../forms/F2FormInfos"
import { F2MarketContext } from "./WalkthroughContainer"
import { InfoMessage } from "@app/components/common/Messages"
import { shortenNumber } from "@app/util/markets"
import { preciseCommify } from "@app/util/misc"

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
        dbrCoverDebt,
        duration,
        debtAmount,
        dbrCover,
        newLiquidationPrice,
        durationTypedValue,
        durationType,
        dbrPrice,
        isDeposit,
        bnCollateralBalance,
        bnDeposits,
        bnWithdrawalLimit,
    } = useContext(F2MarketContext);

    return <>
        <VStack w='full' alignItems="flex-start" spacing="2">
            <Text fontSize="20px" fontWeight="extrabold">Recap:</Text>
            <TextInfo message="The more you deposit the more you can borrow">
                <Text>You will deposit <b>{shortenNumber(collateralAmount, 2)} {market.underlying.symbol} ({shortenNumber(collateralAmount * market.price, 2, true)})</b></Text>
            </TextInfo>
            <TextInfo message="Loan Annual Percentage Rate and duration of the Fixed-Rate">
                <Text>You will lock-In a Borrow fixed rate of <b>{shortenNumber(dbrPrice * 100, 2)}% APR</b> for <b>{durationTypedValue} {durationTypedValue > 1 ? durationType : durationType.replace(/s$/, '')}{ durationType !== 'days' ? ` (${duration} days)` : '' }</b></Text>
            </TextInfo>
            <TextInfo message="The amount of DOLA you will receive">
                <Text>You will borrow <b>{shortenNumber(debtAmount, 2)} DOLA</b></Text>
            </TextInfo>
            {/* <TextInfo message="The APR is directly linked to the DBR price">
                <Text>Your fixed-rate fee will be equivalent to a <b>{shortenNumber(dbrPrice * 100, 2)}% APR</b></Text>
            </TextInfo> */}
            <TextInfo message="The borrow fee that will be paid over time using the DBR tokens, don't sell them unless you know what you're doing">
                <Text>You will purchase <b>{shortenNumber(dbrCover, 2)} DBRs ({shortenNumber(dbrCoverDebt, 2, true)})</b> to cover the cost of your loan duration</Text>
            </TextInfo>
            <TextInfo message="The debt to repay for this loan, total debt can increase if you exceed the chosen loan duration or run out of DBRs">
                <Text>Your debt for this loan will be <b>{shortenNumber(debtAmount + dbrCoverDebt, 2)} DOLA</b></Text>
            </TextInfo>
            <TextInfo message="If the collateral price reaches that price, your collateral can be liquidated entirely">
                <Text>Your liquidation price will be <b>{preciseCommify(newLiquidationPrice, 0, true)} (current price is {preciseCommify(market.price, 0, true)})</b></Text>
            </TextInfo>
            <TextInfo message="The duration value is only to calculate the amount of DBR needed">
                <Text>You can terminate the loan at any time and sell the remaining DBRs</Text>
            </TextInfo>
        </VStack>
        <HStack w='full' justify="flex-end" pt="4">
            <SubmitButton onClick={() => onStepChange(step - 1)}>
                <ChevronLeftIcon fontSize="20px" /> Back
            </SubmitButton>
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
                isDisabled={duration <= 0 || debtAmount <= 0 || collateralAmount <= 0}
                hideInputIfNoAllowance={false}
                hideInput={true}
                hideButtons={false}
            />
        </HStack>
    </>
}