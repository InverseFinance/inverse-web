import { MarketImage } from "@app/components/common/Assets/MarketImage"
import { SubmitButton } from "@app/components/common/Button"
import { InfoMessage, WarningMessage } from "@app/components/common/Messages"
import { AmountInfos } from "@app/components/common/Messages/AmountInfos"
import { TextInfo } from "@app/components/common/Messages/TextInfo"
import { useAppTheme } from "@app/hooks/useAppTheme"
import { ChevronLeftIcon, ChevronRightIcon } from "@chakra-ui/icons"
import { VStack, Text, HStack, Stack, useDisclosure, FormControl, FormLabel, Switch } from "@chakra-ui/react"
import { useContext } from "react"
import { F2MarketContext } from "@app/components/F2/F2Contex"
import { StepNavBtn } from "./StepNavBtn"
import { WalkthroughInput } from "./WalkthroughInput"
import { useRouter } from "next/router"
import { preciseCommify } from "@app/util/misc"
import WethModal from "@app/components/common/Modal/WethModal"

export const F2WalkthroughCollateral = ({
    onStepChange,
    onChange,
}: {
    onStepChange: (step: number) => void
    onChange: (amount: string) => void
}) => {
    const router = useRouter();
    const { themeStyles } = useAppTheme();
    const { isOpen, onOpen, onClose } = useDisclosure();
    const {
        step,
        market,
        signer,
        colDecimals,
        isDeposit,
        collateralAmount,
        collateralAmountNum,
        collateralBalance,
        bnDeposits,
        bnCollateralBalance,
        newDeposits,
        deposits,
        bnWithdrawalLimit,
        maxBorrowable,
        maxBorrow,
        isWethMarket,
        isUseNativeCoin,
        setIsUseNativeCoin,
    } = useContext(F2MarketContext);

    const isNotEnoughBalance = collateralAmountNum > collateralBalance;

    return <>
        <VStack w='full' alignItems="flex-start" spacing="4">
            <WethModal isOpen={isOpen} onClose={onClose} />
            <TextInfo color="accentTextColor" message="The more you deposit, the more you can borrow against">
                <Text fontWeight="bold" fontSize={{ base: '16px', sm: '20px', md: '30px' }} color="mainTextColor">
                    <b style={{ color: themeStyles.colors.accentTextColor }}>How much {isWethMarket && isUseNativeCoin ? 'ETH' : market.underlying.symbol}</b> do you want to deposit?
                </Text>
            </TextInfo>
            <WalkthroughInput
                defaultAmount={collateralAmount}
                address={isUseNativeCoin ? '' : market.collateral}
                destination={market.address}
                signer={signer}
                decimals={colDecimals}
                maxAmountFrom={isDeposit ? isUseNativeCoin ? undefined : [bnCollateralBalance] : [bnDeposits, bnWithdrawalLimit]}
                onAmountChange={onChange}
                inputRight={<MarketImage ml="10px" pr="20px" image={isWethMarket ? (isUseNativeCoin ? market.icon : market.underlying.image) : market.icon || market.underlying.image} size={40} />}
                isError={isNotEnoughBalance}
            />
            {
                isWethMarket && !!market.helper &&
                <HStack w='full' justify="space-between">
                    <Text
                        color="secondaryTextColor"
                        textDecoration="underline"
                        cursor="pointer"
                        onClick={onOpen}
                    >
                        Easily convert between ETH to WETH
                    </Text>
                    <FormControl w='fit-content' display='flex' alignItems='center'>
                        <FormLabel fontWeight='normal' color='secondaryTextColor' htmlFor='auto-eth' mb='0'>
                            Use ETH instead of WETH?
                        </FormLabel>
                        <Switch onChange={() => setIsUseNativeCoin(!isUseNativeCoin)} isChecked={isUseNativeCoin} id='auto-eth' />
                    </FormControl>
                </HStack>

            }
            {
                // (deposits > 0 || !!collateralAmount) && <AmountInfos label="Deposits" value={deposits} delta={collateralAmount} price={market.price} />
            }
            <Stack direction={{ base: 'column', sm: 'row' }} justify="space-between" w='full'>
                <Text color="secondaryTextColor">{market.underlying.symbol} Oracle Price: {preciseCommify(market.price, 2, true)}</Text>
                <Text color="secondaryTextColor">Deposit Worth: {preciseCommify(market.price * collateralAmountNum, 2, true)}</Text>
                {/* <Text color="secondaryTextColor">Collateral Factor: {preciseCommify(market.collateralFactor*100, 2)}%</Text> */}
            </Stack>
            {
                !market.leftToBorrow && <WarningMessage
                    alertProps={{ w: 'full' }}
                    description="No DOLA borrowable at the moment"
                />
            }
            {
                !market.helper && !!market.leftToBorrow &&
                <InfoMessage
                    alertProps={{ w: 'full' }}
                    description={
                        <VStack alignItems="flex-start">
                            <Text>Maximum Borrowing Power will be <b>~{preciseCommify(maxBorrow, 0)} DOLA</b></Text>
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
        </VStack>
        <HStack w='full' justify="space-between">
            <StepNavBtn onClick={() => router.push('/firm')}>
                <ChevronLeftIcon fontSize="20px" /> Back
            </StepNavBtn>
            <StepNavBtn
                gaAction="FiRM-walkthrough-next-btn-from-collateral"
                onClick={() => onStepChange(step + 1)}
                disabled={collateralAmountNum <= 0 || collateralAmountNum > collateralBalance || !market.leftToBorrow}>
                Next <ChevronRightIcon fontSize="20px" />
            </StepNavBtn>
        </HStack>
    </>
}