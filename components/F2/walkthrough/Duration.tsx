import { SubmitButton } from "@app/components/common/Button"
import { InfoMessage } from "@app/components/common/Messages"
import { AmountInfos } from "@app/components/common/Messages/AmountInfos"
import { TextInfo } from "@app/components/common/Messages/TextInfo"
import { useAppTheme } from "@app/hooks/useAppTheme"
import { preciseCommify } from "@app/util/misc"
import { ChevronLeftIcon, ChevronRightIcon } from "@chakra-ui/icons"
import { VStack, Text, HStack } from "@chakra-ui/react"
import { useContext } from "react"
import { F2DurationInput } from "../forms/F2DurationInput"
import { StepNavBtn } from "./StepNavBtn"
import { F2MarketContext } from "@app/components/F2/F2Contex"

export const F2WalkthroughDuration = ({
    onStepChange,
    onChange,
}: {
    onStepChange: (step: number) => void
    onChange: (duration: number, typedValue: number, type: string) => void
}) => {
    const { themeStyles } = useAppTheme();
    const {
        step,
        durationType,
        durationTypedValue,
        duration,
        newCreditLeft,
        maxBorrowable,
    } = useContext(F2MarketContext);

    return <>
        <VStack w='full' alignItems="flex-start" spacing="4">
            <TextInfo message="This will lock-in a Borrow Rate for the desired duration, after the duration you can still keep the loan but at the expense of a higher debt and Borrow Rate.">
                <Text fontWeight="bold" fontSize="30px" color="mainTextColor">
                    <b style={{ color: themeStyles.colors.accentTextColor }}>How long</b> do you intend to borrow?
                </Text>
            </TextInfo>
            <F2DurationInput
                defaultValue={durationTypedValue}
                defaultType={durationType}
                onChange={onChange}
                // columnMode={true}
                inputProps={{
                    autoFocus: true,
                    fontSize: { base: '30px', md: '40px', lg: '50px' },
                    py: { base: '20px', md: '30px', lg: '40px' }
                }}
            />
            {/* <AmountInfos format={false} label="Duration in days" value={duration} textProps={{ fontSize: '14px' }} /> */}
            <InfoMessage
                alertProps={{ w: 'full' }}
                description={
                    <VStack alignItems="flex-start">
                        <Text>Maximum Borrowing Power will be <b>{preciseCommify(maxBorrowable, 0)} DOLA</b> (depends on duration)</Text>
                        <Text>You can terminate the loan at any time</Text>
                    </VStack>
                }
            />
        </VStack>
        <HStack w='full' justify="space-between" pt="4">
            <StepNavBtn onClick={() => onStepChange(step - 1)}>
                <ChevronLeftIcon fontSize="20px" /> Back
            </StepNavBtn>
            <StepNavBtn onClick={() => onStepChange(step + 1)} disabled={duration <= 0}>
                Next <ChevronRightIcon fontSize="20px" />
            </StepNavBtn>
        </HStack>
    </>
}