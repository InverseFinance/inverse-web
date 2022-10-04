import { MarketImage } from "@app/components/common/Assets/MarketImage"
import { SubmitButton } from "@app/components/common/Button"
import { InfoMessage } from "@app/components/common/Messages"
import { AmountInfos } from "@app/components/common/Messages/AmountInfos"
import { TextInfo } from "@app/components/common/Messages/TextInfo"
import { ChevronLeftIcon, ChevronRightIcon } from "@chakra-ui/icons"
import { VStack, Text, HStack } from "@chakra-ui/react"
import { useContext } from "react"
import { F2MarketContext } from "./WalkthroughContainer"
import { WalkthroughInput } from "./WalkthroughInput"

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

    const isNotEnoughBalance = collateralAmount > collateralBalance;

    return <>
        <VStack w='full' alignItems="flex-start" spacing="4">
            <TextInfo message="The more you deposit, the more you can borrow against">
                <Text fontSize="20px" color="mainTextColor"><b>Deposit</b> {market.name}:</Text>
            </TextInfo>
            <WalkthroughInput
                defaultAmount={collateralAmount}
                address={market.collateral}
                destination={market.address}
                signer={signer}
                decimals={colDecimals}
                maxAmountFrom={isDeposit ? [bnCollateralBalance] : [bnDeposits, bnWithdrawalLimit]}
                onAmountChange={onChange}
                inputRight={<MarketImage ml="10px" pr="20px" image={market.icon || market.underlying.image} size={40} />}
                isError={isNotEnoughBalance}
            />
            <AmountInfos label="Deposits" value={deposits} delta={collateralAmount} price={market.price} textProps={{ fontSize: '14px' }} />
            {
                isNotEnoughBalance && <InfoMessage
                    alertProps={{ w: 'full' }}
                    description="Not enough balance"
                />
            }
        </VStack>
        <HStack w='full' justify="flex-end" pt="4">
            <SubmitButton onClick={() => onStepChange(step - 1)}>
                <ChevronLeftIcon fontSize="20px" /> Back
            </SubmitButton>
            <SubmitButton onClick={() => onStepChange(step + 1)} disabled={collateralAmount <= 0 || collateralAmount > collateralBalance}>
                Continue <ChevronRightIcon fontSize="20px" />
            </SubmitButton>
        </HStack>
    </>
}