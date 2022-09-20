import { MarketImage } from "@app/components/common/Assets/MarketImage"
import { SubmitButton } from "@app/components/common/Button"
import { AmountInfos } from "@app/components/common/Messages/AmountInfos"
import { TextInfo } from "@app/components/common/Messages/TextInfo"
import { SimpleAmountForm } from "@app/components/common/SimpleAmountForm"
import { ChevronLeftIcon, ChevronRightIcon } from "@chakra-ui/icons"
import { VStack, Text, HStack } from "@chakra-ui/react"
import { useContext } from "react"
import { F2MarketContext } from "."

export const F2WalkthroughCollateral = ({
    onStepChange,
    onChange,
}: {
    onStepChange: (step: number) => void
    onChange: (amount: number) => void
}) => {
    const {
        step,
        market,
        signer,
        colDecimals,
        isDeposit,
        collateralAmount,
        collateralBalance,
        bnDeposits,
        bnCollateralBalance,
        newDeposits,
        deposits,
        bnWithdrawalLimit,
    } = useContext(F2MarketContext);

    return <VStack w='full' alignItems="flex-start">
        <TextInfo message="The more you deposit, the more you can borrow against">
            <Text color="mainTextColor"><b>Deposit</b> {market.name}:</Text>
        </TextInfo>
        <SimpleAmountForm
            defaultAmount={collateralAmount}
            address={market.collateral}
            destination={market.address}
            signer={signer}
            decimals={colDecimals}
            maxAmountFrom={isDeposit ? [bnCollateralBalance] : [bnDeposits, bnWithdrawalLimit]}
            // onAction={({ bnAmount }) => handleAction(bnAmount)}
            // actionLabel={btnLabel}
            // maxActionLabel={btnMaxlabel}
            onAmountChange={onChange}
            showMaxBtn={false}
            hideInputIfNoAllowance={false}
            hideButtons={true}
            showBalance={true}
            inputRight={<MarketImage pr="2" image={market.icon || market.underlying.image} size={25} />}
            isError={collateralAmount > collateralBalance}
        />
        <AmountInfos label="Deposits" value={deposits} newValue={newDeposits} price={market.price} />
        <HStack w='full' justify="flex-end" pt="4">
            <SubmitButton onClick={() => onStepChange(step-1)}>
            <ChevronLeftIcon fontSize="20px" /> Back
            </SubmitButton>
            <SubmitButton onClick={() => onStepChange(step+1)} disabled={collateralAmount <= 0 || collateralAmount > collateralBalance }>
                Continue <ChevronRightIcon fontSize="20px" />
            </SubmitButton>
        </HStack>
    </VStack>
}