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

export const F2WalkthroughDebt = ({
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
        debt,
        newDebt,
        dbrCoverDebt,
        duration,
        riskColor,
        newCreditLimit,
        bnDolaLiquidity,
        newPerc,
        dolaToken,
        debtAmount,
        dbrCover,
        newLiquidationPrice,
        collateralAmount,
    } = useContext(F2MarketContext);

    return <>
        <VStack w='full' alignItems="flex-start" spacing="4">
            <TextInfo message="The amount of DOLA stablecoin you wish to borrow">
                <Text color="mainTextColor"><b>Borrow</b> DOLA:</Text>
            </TextInfo>
            <SimpleAmountForm
                defaultAmount={debtAmount}
                address={market.collateral}
                destination={market.address}
                signer={signer}
                decimals={colDecimals}
                maxAmountFrom={isDeposit ? [bnDolaLiquidity, parseEther((newCreditLimit * 0.99).toFixed(0))] : []}
                onAmountChange={onChange}
                showMax={false}
                showMaxBtn={false}
                hideInputIfNoAllowance={false}
                hideButtons={true}
                isDisabled={newPerc < 1}
                inputProps={{ autoFocus: true, fontSize: '50px', py: '40px', px: '20px' }}
                inputRight={<MarketImage ml="10px" pr="20px" image={dolaToken.image} size={40} />}
            />
            <AmountInfos dbrCover={dbrCoverDebt} label="Debt" value={debt} newValue={newDebt} textProps={{ fontSize: '14px' }} />
            {
                newPerc < 1 &&
                <InfoMessage
                    alertProps={{ w: 'full' }}
                    description={
                        <VStack w='full' alignItems="flex-start" spaing="0">
                            <Text>Collateral Health is less than 1%</Text>
                            <Text>Please borrow less or add more collateral</Text>
                        </VStack>
                    }
                />
            }
        </VStack>
        <HStack w='full' justify="flex-end" pt="4">
            <SubmitButton onClick={() => onStepChange(step - 1)}>
                <ChevronLeftIcon fontSize="20px" /> Back
            </SubmitButton>
            <SubmitButton onClick={() => onStepChange(step + 1)} disabled={newPerc < 1 || !debtAmount}>
                Continue <ChevronRightIcon fontSize="20px" />
            </SubmitButton>
        </HStack>
    </>
}