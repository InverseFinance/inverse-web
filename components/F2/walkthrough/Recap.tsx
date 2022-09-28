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
            <TextInfo message="Chosen duration for the Fixed-Rate, your borrow can last longer but it will increase your debt and your fees">
                <Text>You will lock-In a Borrow fixed rate for <b>{durationTypedValue} {durationType} ({duration} days)</b></Text>
            </TextInfo>
            <TextInfo message="The amount of DOLA you will receive">
                <Text>You will borrow <b>{shortenNumber(debtAmount, 2)} DOLA</b></Text>
            </TextInfo>
            <TextInfo message="The borrow fee that will be paid over time using the DBR tokens, don't sell them unless you know what you're doing">
                <Text>Your borrow fee over time will be <b>{shortenNumber(dbrCover, 2)} DBRs ({shortenNumber(dbrCoverDebt, 2, true)})</b></Text>
            </TextInfo>
            <TextInfo message="The borrow fee that will be paid over time using the DBR tokens, don't sell them unless you know what you're doing">
                <Text>Your fixed-rate fee will be equivalent to a <b>{shortenNumber(dbrPrice * 100, 2)}% APR</b></Text>
            </TextInfo>
            <TextInfo message="The debt that you will need to repay, can increase if you exceed the chosen loan duration or run out of DBRs">
                <Text>Your added debt will be <b>{shortenNumber(debtAmount + dbrCoverDebt, 2)} DOLA</b></Text>
            </TextInfo>
            <TextInfo message="If the collateral price reaches that price, your collateral can be liquidated">
                <Text>Your liquidation price will be <b>{shortenNumber(newLiquidationPrice, 2, true)} (current price is {shortenNumber(market.price, 2, true)})</b></Text>
            </TextInfo>
        </VStack>
        <HStack w='full' justify="flex-end" pt="4">
            <SubmitButton onClick={() => onStepChange(step - 1)}>
                <ChevronLeftIcon fontSize="20px" /> Back
            </SubmitButton>
            {/* <SubmitButton onClick={() => {}} disabled={newPerc < 1 || !debtAmount}>
                Deposit & Borrow
            </SubmitButton> */}
            <SimpleAmountForm
                defaultAmount={collateralAmount?.toString()}
                address={market.collateral}
                destination={market.address}
                signer={signer}
                decimals={colDecimals}
                maxAmountFrom={isDeposit ? [bnCollateralBalance] : [bnDeposits, bnWithdrawalLimit]}
                onAction={({ bnAmount }) => {}}
                onMaxAction={({ bnAmount }) => {}}
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