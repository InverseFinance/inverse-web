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
import { shortenNumber } from "@app/util/markets"
import Link from "@app/components/common/Link"
import { BUY_LINKS } from "@app/config/constants"

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
        market,
        durationType,
        durationTypedValue,
        duration,
        newCreditLeft,
        maxBorrowable,
        dbrCover,
        dbrCoverDebt,
        dbrPrice,
        dbrBalance,
    } = useContext(F2MarketContext);

    return <>
        <VStack w='full' alignItems="flex-start" spacing="4">
            <TextInfo message="This will lock-in a Borrow Rate for the desired duration, after the duration you can still keep the loan but at the expense of a higher debt and Borrow Rate.">
                <Text fontWeight="bold" fontSize={{ base: '16px', sm: '20px', md: '30px' }} color="mainTextColor">
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
                    color: 'mainTextColor',
                    fontSize: { base: '30px', md: '40px', lg: '50px' },
                    py: { base: '20px', md: '30px', lg: '40px' }
                }}
            />
            {/* <AmountInfos format={false} label="Duration in days" value={duration} textProps={{ fontSize: '14px' }} /> */}
            <InfoMessage
                alertProps={{ w: 'full' }}                
                description={
                    !!market.helper ?
                        <VStack alignItems="flex-start">
                            <Text>Maximum Borrowing Power will be <b>{preciseCommify(maxBorrowable, 0)} DOLA</b> (depends on duration)</Text>
                            <Text>You can terminate the loan at any time</Text>
                        </VStack>
                        :
                        <VStack alignItems="flex-start">
                            <Text><b>{shortenNumber(dbrCover, 2)} DBRs</b> will be spent over time from your wallet to cover the loan duration.</Text>
                            <Text>You can have the full amount up-front or top-up your DBRs regularly.</Text>
                            {
                                dbrBalance > 0 ? <Text>
                                    <b>Your current DBR balance is {shortenNumber(dbrBalance, 2)}</b>, {dbrBalance < dbrCover ? "which is lower than what's required for the chosen loan duration, you can continue but we recommend you to get more DBRs." : "which is enough to cover the loan duration."}
                                </Text>
                                    :
                                    <Text fontWeight="bold" color="warning">You don't have any DBRs in your wallet.<br />Please have at least part of the DBR cost in your wallet to start with.</Text>
                            }
                            {
                                (dbrBalance < dbrCover) && <Link textDecoration="underline" href={BUY_LINKS.DBR} isExternal target="_blank">Buy {dbrBalance > 0 ? ' more ' : ''} DBR</Link>
                            }
                        </VStack>
                }
            />
        </VStack>
        <HStack w='full' justify="space-between">
            <StepNavBtn onClick={() => onStepChange(step - 1)}>
                <ChevronLeftIcon fontSize="20px" /> Back
            </StepNavBtn>
            <StepNavBtn onClick={() => onStepChange(step + 1)} disabled={duration <= 0 || dbrBalance <= 0}>
                Next <ChevronRightIcon fontSize="20px" />
            </StepNavBtn>
        </HStack>
    </>
}