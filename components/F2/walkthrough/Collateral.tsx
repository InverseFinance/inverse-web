import { MarketImage } from "@app/components/common/Assets/MarketImage"
import { SubmitButton } from "@app/components/common/Button"
import { InfoMessage } from "@app/components/common/Messages"
import { AmountInfos } from "@app/components/common/Messages/AmountInfos"
import { TextInfo } from "@app/components/common/Messages/TextInfo"
import { useAppTheme } from "@app/hooks/useAppTheme"
import { ChevronLeftIcon, ChevronRightIcon } from "@chakra-ui/icons"
import { VStack, Text, HStack, Stack } from "@chakra-ui/react"
import { useContext } from "react"
import { F2MarketContext } from "@app/components/F2/F2Contex"
import { StepNavBtn } from "./StepNavBtn"
import { WalkthroughInput } from "./WalkthroughInput"
import { useRouter } from "next/router"
import { preciseCommify } from "@app/util/misc"

export const F2WalkthroughCollateral = ({
    onStepChange,
    onChange,
}: {
    onStepChange: (step: number) => void
    onChange: (amount: number) => void
}) => {
    const router = useRouter();
    const { themeStyles } = useAppTheme();
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
        maxBorrowable,
    } = useContext(F2MarketContext);

    const isNotEnoughBalance = collateralAmount > collateralBalance;

    return <>
        <VStack w='full' alignItems="flex-start" spacing="4">
            <TextInfo color="accentTextColor" message="The more you deposit, the more you can borrow against">
                <Text fontWeight="bold" fontSize={{ base: '16px', sm: '20px', md: '30px' }} color="mainTextColor">
                    <b style={{ color: themeStyles.colors.accentTextColor }}>How much {market.underlying.symbol}</b> do you want to deposit?
                </Text>
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
            {
                // (deposits > 0 || !!collateralAmount) && <AmountInfos label="Deposits" value={deposits} delta={collateralAmount} price={market.price} />
            }
            <Stack direction={{ base: 'column', sm: 'row' }} justify="space-between" w='full'>
                <Text color="secondaryTextColor">{market.underlying.symbol} Oracle Price: {preciseCommify(market.price, 2, true)}</Text>
                <Text color="secondaryTextColor">Collateral Factor: {preciseCommify(market.collateralFactor*100, 2)}%</Text>
            </Stack>
            {
                !market.helper &&
                <InfoMessage
                    alertProps={{ w: 'full' }}
                    description={
                        <VStack alignItems="flex-start">
                            <Text>Maximum Borrowing Power will be <b>{preciseCommify(maxBorrowable, 0)} DOLA</b></Text>
                        </VStack>
                    }
                />
            }
            {
                isNotEnoughBalance && <InfoMessage
                    alertProps={{ w: 'full' }}
                    description="Not enough balance"
                />
            }
            {
                !market.leftToBorrow && <InfoMessage
                    alertProps={{ w: 'full' }}
                    description="No DOLA borrowable at the moment"
                />
            }
        </VStack>
        <HStack w='full' justify="space-between">
            <StepNavBtn onClick={() => router.push('/firm')}>
                <ChevronLeftIcon fontSize="20px" /> Back
            </StepNavBtn>
            <StepNavBtn
                onClick={() => onStepChange(step + 1)}
                disabled={collateralAmount <= 0 || collateralAmount > collateralBalance || !market.leftToBorrow}>
                Next <ChevronRightIcon fontSize="20px" />
            </StepNavBtn>
        </HStack>
    </>
}