import { SubmitButton } from "@app/components/common/Button"
import { InfoMessage } from "@app/components/common/Messages"
import { AmountInfos } from "@app/components/common/Messages/AmountInfos"
import { TextInfo } from "@app/components/common/Messages/TextInfo"
import { preciseCommify } from "@app/util/misc"
import { ChevronLeftIcon, ChevronRightIcon } from "@chakra-ui/icons"
import { VStack, Text, HStack } from "@chakra-ui/react"
import { useContext } from "react"
import { F2DurationInput } from "../forms/F2DurationInput"
import { F2MarketContext } from "./WalkthroughContainer"

export const F2WalkthroughDuration = ({
    onStepChange,
    onChange,
}: {
    onStepChange: (step: number) => void
    onChange: (duration: number, typedValue: number, type: string) => void
}) => {
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
                <Text fontSize="20px" color="mainTextColor">Choose an estimated <b>Duration</b> for the loan:</Text>
            </TextInfo>
            <F2DurationInput
                defaultValue={durationTypedValue}
                defaultType={durationType}
                onChange={onChange}
                isInPopover={true}
                inputProps={{
                    autoFocus: true,
                    fontSize: { base: '30px', md: '40px', lg: '50px' },
                    py: { base: '20px', md: '30px', lg: '40px' }
                }}
            />
            <AmountInfos label="Duration in days" value={duration} textProps={{ fontSize: '14px' }} />
            <InfoMessage
                alertProps={{ w: 'full' }}
                description={`Maximum Borrowing Power will be ${preciseCommify(maxBorrowable, 0)} DOLA`}
            />
        </VStack>
        <HStack w='full' justify="flex-end" pt="4">
            <SubmitButton onClick={() => onStepChange(step - 1)}>
                <ChevronLeftIcon fontSize="20px" /> Back
            </SubmitButton>
            <SubmitButton onClick={() => onStepChange(step + 1)} disabled={duration <= 0}>
                Continue <ChevronRightIcon fontSize="20px" />
            </SubmitButton>
        </HStack>
    </>
}