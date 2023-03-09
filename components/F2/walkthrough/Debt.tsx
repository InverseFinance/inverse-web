import { MarketImage } from "@app/components/common/Assets/MarketImage"
import { TextInfo } from "@app/components/common/Messages/TextInfo"
import { SimpleAmountForm } from "@app/components/common/SimpleAmountForm"
import { ChevronLeftIcon, ChevronRightIcon } from "@chakra-ui/icons"
import { VStack, Text, HStack } from "@chakra-ui/react"
import { parseEther } from "@ethersproject/units"
import { useContext } from "react"
import { F2MarketContext } from "@app/components/F2/F2Contex"
import { InfoMessage } from "@app/components/common/Messages"
import { preciseCommify } from "@app/util/misc"
import { StepNavBtn } from "./StepNavBtn"
import { useAppTheme } from "@app/hooks/useAppTheme"
import { shortenNumber } from "@app/util/markets"
import { AmountInfos } from "@app/components/common/Messages/AmountInfos"
import { PercentagesOfMax } from "../forms/PercentagesOfMax"

export const F2WalkthroughDebt = ({
    onStepChange,
    onChange,
}: {
    onStepChange: (step: number) => void
    onChange: (amount: string) => void
}) => {
    const { themeStyles } = useAppTheme();
    const {
        step,
        market,
        signer,    
        isDeposit,
        dolaLiquidity,
        newCreditLimit,
        bnDolaLiquidity,
        newPerc,
        dolaToken,
        debtAmount,
        debtAmountNum,
        dbrCover,
        newLiquidationPrice,
        collateralAmount,
        newCreditLeft,
        // 99%
        maxBorrowable,
        // 100%
        maxBorrow,
        leftToBorrow,
        isSmallerThan728,
    } = useContext(F2MarketContext);

    const notEnoughLiq = debtAmountNum > leftToBorrow && leftToBorrow > 0;
    const isDisabled = notEnoughLiq || (leftToBorrow === 0)

    return <>
        <VStack w='full' alignItems="flex-start" spacing="4">
            <TextInfo message="The amount of DOLA stablecoin you wish to borrow">
                <Text fontWeight="bold" fontSize={{ base: '16px', sm: '20px', md: '30px' }} color="mainTextColor">
                    <b style={{ color: themeStyles.colors.accentTextColor }}>How much DOLA</b> do you want to borrow?
                </Text>
            </TextInfo>
            <SimpleAmountForm
                defaultAmount={debtAmount}
                address={market.collateral}
                destination={market.address}
                signer={signer}
                decimals={18}
                maxAmountFrom={isDeposit ? [bnDolaLiquidity, parseEther((newCreditLimit * 0.99).toFixed(0))] : []}
                onAmountChange={onChange}
                showMax={false}
                showMaxBtn={false}
                hideInputIfNoAllowance={false}
                hideButtons={true}
                isDisabled={newPerc < 1}
                inputProps={{ autoFocus: true, fontSize: '50px', py: '40px', px: '20px', color: 'mainTextColor' }}
                inputRight={<MarketImage ml="10px" pr="20px" image={dolaToken.image} size={40} />}
                isError={debtAmountNum > maxBorrowable}
            />
            {/* <AmountInfos dbrCover={dbrCoverDebt} label="Debt" value={debt} delta={debtAmount} textProps={{ fontSize: '14px' }} /> */}
            <PercentagesOfMax max={maxBorrow} usableMax={maxBorrowable} isSmallerThan728={isSmallerThan728} onChange={onChange} />
            <InfoMessage
                alertProps={{ w: 'full' }}
                description={<Text>Maximum Borrowing Power is <b>~{preciseCommify(maxBorrowable, 0)} DOLA</b> with current parameters.</Text>}
            />
            {
                debtAmountNum > maxBorrowable &&
                <InfoMessage
                    alertProps={{ w: 'full' }}
                    description={
                        <VStack w='full' alignItems="flex-start" spaing="0">
                            <Text>Borrow Limit is higher than 99%</Text>
                            <Text>Please borrow less or add more collateral</Text>
                        </VStack>
                    }
                />
            }
            {
                notEnoughLiq &&
                <InfoMessage
                    alertProps={{ w: 'full' }}
                    description={
                        <VStack w='full' alignItems="flex-start" spaing="0">
                            <Text>There's only {shortenNumber(leftToBorrow, 2)} DOLA liquidity available</Text>
                        </VStack>
                    }
                />
            }
        </VStack>
        <HStack w='full' justify="space-between">
            <StepNavBtn onClick={() => onStepChange(step - 1)}>
                <ChevronLeftIcon fontSize="20px" /> Back
            </StepNavBtn>
            <StepNavBtn
                onClick={() => onStepChange(step + 1)}
                disabled={newPerc < 1 || !debtAmountNum || isDisabled || !market.leftToBorrow}>
                Next <ChevronRightIcon fontSize="20px" />
            </StepNavBtn>
        </HStack>
    </>
}