import { Input } from "@app/components/common/Input"
import { InfoMessage, WarningMessage } from "@app/components/common/Messages"
import { AmountInfos } from "@app/components/common/Messages/AmountInfos"
import { TextInfo } from "@app/components/common/Messages/TextInfo"
import ConfirmModal from "@app/components/common/Modal/ConfirmModal"
import { AnimatedInfoTooltip } from "@app/components/common/Tooltip"
import { BURN_ADDRESS } from "@app/config/constants"
import { useDBRNeeded } from "@app/hooks/useDBR"
import { F2Market } from "@app/types"
import { f2CalcNewHealth, getDepletionDate } from "@app/util/f2"
import { getBnToNumber, shortenNumber } from "@app/util/markets"
import { ChevronDownIcon, ChevronRightIcon, RepeatClockIcon } from "@chakra-ui/icons"
import { Flex, FormControl, FormLabel, HStack, Switch, Text, VStack, Image, Stack, useDisclosure, Divider, Box, SimpleGrid } from "@chakra-ui/react"
import { formatUnits } from "@ethersproject/units"
import { BigNumber } from "ethers"
import { isAddress } from "ethers/lib/utils"
import { useContext, useState } from "react"
import { DbrBuyerTrigger } from "../../DbrEasyBuyer.tsx/DbrEasyBuyer"
import { F2MarketContext } from "../../F2Contex"
import { fromNow } from "@app/util/time"

export const FirmRepayInputSubline = ({
    isDeleverageCase,
    dolaBalance,
    debt,
    handleDebtChange,
    bnDolaBalance,
    bnDebt,
}: {
    isDeleverageCase: boolean
    dolaBalance: number
    debt: number
    handleDebtChange: (value: string) => void
    bnDolaBalance: BigNumber
    bnDebt: BigNumber
}) => {
    return <HStack w='full' justify="space-between">
        <AmountInfos
            label="DOLA balance"
            value={dolaBalance}
            textProps={{
                cursor: 'pointer',
                fontSize: '14px',
                onClick: () => isDeleverageCase ? null : handleDebtChange(formatUnits(bnDolaBalance, 18))
            }}
        />
        <AmountInfos
            label="Debt"
            value={debt}
            textProps={{
                fontSize: '14px',
                onClick: () => isDeleverageCase ? null : handleDebtChange(formatUnits(bnDebt, 18))
            }}
        />
    </HStack>
}

export const FirmBorroInputwSubline = ({
    leftToBorrow,
    bnLeftToBorrow,
    maxBorrowable,
    handleDebtChange,
    isLeverageOpen = false,
}: {
    leftToBorrow: number
    bnLeftToBorrow: BigNumber
    maxBorrowable: number
    handleDebtChange: (value: string, num: number) => void
    isLeverageOpen: boolean
}) => {
    const value = Math.floor(isLeverageOpen ? leftToBorrow : Math.min(leftToBorrow, maxBorrowable));
    return <HStack w='full' justify="space-between">
        <AmountInfos
            label={isLeverageOpen ? 'Available DOLA' : maxBorrowable < leftToBorrow ? 'Near-Max borrowable' : 'Max borrowable'}
            value={value < 1 ? 0 : value}
            textProps={{
                fontSize: '14px',
                onClick: value > 1 ? () => handleDebtChange(value.toString(), value) : undefined
            }}
        />
    </HStack>
}

export const FirmWithdrawInputSubline = ({
    deposits,
    price,
    handleCollateralChange,
    bnDeposits,
    decimals,
    useLeverageInMode = false
}: {
    deposits: number
    price: number
    handleCollateralChange: (value: string, num: number) => void
    bnDeposits: BigNumber
    decimals: number
    useLeverageInMode: boolean
}) => {
    return <HStack w='full' justify="space-between">
        <AmountInfos
            label={useLeverageInMode ? 'Fully deleverage and exit position' : 'Deposits'}
            value={deposits}
            price={price}
            textProps={{
                cursor: 'pointer',
                fontSize: '14px',
                onClick: () => handleCollateralChange(formatUnits(bnDeposits, decimals), getBnToNumber(bnDeposits, decimals))
            }}
        />
    </HStack>
}

export const FirmWethSwitch = ({
    onWethSwapModalOpen,
    hideUseNativeSwitch,
    setIsUseNativeCoin,
    isUseNativeCoin,
}: {
    onWethSwapModalOpen: () => void
    hideUseNativeSwitch: boolean
    setIsUseNativeCoin: (value: boolean) => void
    isUseNativeCoin: boolean
}) => {
    return <HStack w='full' justify="space-between">
        <Text
            color="secondaryTextColor"
            textDecoration="underline"
            cursor="pointer"
            onClick={onWethSwapModalOpen}
            fontSize="14px"
        >
            Easily convert between ETH to WETH
        </Text>
        {
            !hideUseNativeSwitch && <FormControl w='fit-content' display='flex' alignItems='center'>
                <FormLabel fontWeight='normal' fontSize='14px' color='secondaryTextColor' htmlFor='auto-eth' mb='0'>
                    Use ETH instead of WETH?
                </FormLabel>
                <Switch onChange={() => setIsUseNativeCoin(!isUseNativeCoin)} isChecked={isUseNativeCoin} id='auto-eth' />
            </FormControl>
        }
    </HStack>
}

export const FirmExitModeSwitch = ({
    isDeposit,
    handleDirectionChange,
    isInv,
}: {
    isDeposit: boolean
    handleDirectionChange: () => void
    isInv: boolean
}) => {
    return <FormControl boxShadow="0px 0px 1px 0px #ccccccaa" bg="primary.400" zIndex="1" borderRadius="10px" px="3" py="1" right="0" top="-14px" margin="auto" position="absolute" w='fit-content' display='flex' alignItems='center'>
        <FormLabel fontWeight="normal" fontSize="14px" cursor="pointer" htmlFor='withdraw-mode' mb='0'>
            {isInv ? 'Unstake?' : 'Repay / Withdraw?'}
        </FormLabel>
        <Switch isChecked={!isDeposit} onChange={handleDirectionChange} id='withdraw-mode' />
    </FormControl>
}

const ExtendMarketLoanContent = ({
    handleExtendMarketLoan,
    onClose,
    dbrDurationInputs,
    debt,
    totalDebt,
    duration,
    market,
    deposits,
    dolaPriceUsd,
    dbrBuySlippage,
}: {
    handleExtendMarketLoan: () => void
    onClose: () => void
    dbrDurationInputs: React.ReactNode
    debt: number
    totalDebt: number
    duration: number
    market: F2Market
    deposits: number
    dolaPriceUsd: number
    dbrBuySlippage: number | string
}) => {
    const { dbrBalance, dbrExpiryDate } = useContext(F2MarketContext);
    const [now, setNow] = useState(Date.now());
    const dbrApproxData = useDBRNeeded(debt.toFixed(0), duration, undefined, dbrBuySlippage);
    const {
        newPerc,
    } = f2CalcNewHealth(
        market,
        deposits,
        debt + dbrApproxData.dolaForDbrNum,
        0,
        0,
    );
    const percAcceptableDistance = (market.collateralFactor >= 0.9 ? 0.1 : 1)
    const isOkDisabled = newPerc < percAcceptableDistance;
    const maxBorrowLimit = 100 - percAcceptableDistance;
    const effectiveSwapPrice = dbrApproxData.dbrNeededNum ? dbrApproxData.dolaForDbrNum / dbrApproxData.dbrNeededNum * (dolaPriceUsd || 1) : 0;
    const hasDebtInOtherMarkets = totalDebt > (debt + 1);
    const newExpiryTimestamp = now + (dbrBalance + (dbrApproxData?.dbrNeededNum || 0)) / (totalDebt + (dbrApproxData?.dolaForDbrNum || 0)) * 31536000000;
    return <ConfirmModal
        title={`Extend market loan by auto-buying the right amount of DBR`}
        onClose={onClose}
        onCancel={onClose}
        onOk={() => {
            return handleExtendMarketLoan()
        }}
        isOpen={true}
        okLabel="Auto-buy DBR"
        okButtonProps={{
            w: '150px'
        }}
        cancelButtonProps={{
            w: '150px'
        }}
        modalProps={{ scrollBehavior: 'inside', minW: { base: '98vw', lg: '700px' } }}
        okDisabled={dbrApproxData?.isLoading || isOkDisabled}
    >
        <VStack p="6" alignItems="flex-start">
            {/* <InfoMessage
                alertProps={{ w: 'full' }}
                description="If you're using several markets we recommend to buy DBR on DEXes."
            /> */}
            {dbrDurationInputs}
            <Divider />
            <SimpleGrid columns={{ base: 1, md: 2 }} spacingX={{ base: 0, md: 8 }} w='full' alignItems="flex-start">
                <HStack w='full' justify="space-between">
                    <Text color="mainTextColorLight">
                        Est. DBR to receive:
                    </Text>
                    <Text>
                        {shortenNumber(dbrApproxData.dbrNeededNum, 2)} DBR
                    </Text>
                </HStack>
                <HStack w='full' justify="space-between">
                    <Text color="mainTextColorLight">
                        Cost to add as debt:
                    </Text>
                    <Text>
                        {shortenNumber(dbrApproxData.dolaForDbrNum, 2)} DOLA
                    </Text>
                </HStack>
                <HStack w='full' justify="space-between" alignItems="center">
                    <Text color="mainTextColorLight">
                        Est. DBR swap price:
                    </Text>
                    <Text>
                        {shortenNumber(effectiveSwapPrice, 6, true)}
                    </Text>
                </HStack>
                <HStack w='full' justify="space-between">
                    <Text color="mainTextColorLight">
                        New borrow limit:
                    </Text>
                    <Text>
                        {shortenNumber(100 - newPerc, 2)}%
                    </Text>
                </HStack>
            </SimpleGrid>
            <Divider />
            <SimpleGrid columns={{ base: 1, md: 2 }} spacingX={{ base: 0, md: 8 }} w='full' alignItems="flex-start">
                <VStack spacing="0" w='full' justify="space-between" alignItems="flex-start">
                    <Text color="mainTextColorLight">
                        Current depletion date:
                    </Text>
                    <Text>
                        {dbrExpiryDate ? `${getDepletionDate(dbrExpiryDate, now)} (${fromNow(dbrExpiryDate)})` : '-'}
                    </Text>
                </VStack>
                <VStack spacing="0" w='full' justify="space-between" alignItems="flex-start">
                    <Text color="mainTextColorLight">
                        New estimated depletion date:
                    </Text>
                    <Text>
                        {newExpiryTimestamp ? `${getDepletionDate(newExpiryTimestamp, now)} (${fromNow(newExpiryTimestamp)})` : '-'}
                    </Text>
                </VStack>
            </SimpleGrid>
            {
                hasDebtInOtherMarkets && <InfoMessage alertProps={{ w: 'full', fontSize: '14px' }} description={<Text><b>Note</b>: You also have debt in other markets, in that case we recommend to buy DBR on DEXes or buy using the <b style={{ display: 'inline-block', textDecoration: 'underline', cursor: 'pointer' }}><DbrBuyerTrigger><p>global calculator</p></DbrBuyerTrigger></b> instead of auto-buying on this market.</Text>} />
            }
            {
                isOkDisabled && <WarningMessage alertProps={{ w: 'full', fontSize: '14px' }} description={`The borrow limit should be under ${maxBorrowLimit}%, please consider extending for a shorter duration.`} />
            }
        </VStack>
    </ConfirmModal>
}

export const FirmExtendMarketLoanButton = ({
    handleExtendMarketLoan,
    dbrDurationInputs,
    debt,
    totalDebt,
    duration,
    market,
    deposits,
    dolaPriceUsd,
    dbrBuySlippage,
}: {
    handleExtendMarketLoan: () => void
    dbrDurationInputs: React.ReactNode
    debt: number
    totalDebt: number
    duration: number
    market: F2Market
    deposits: number
    dolaPriceUsd: number
    dbrBuySlippage: number | string
}) => {
    const { isOpen, onOpen, onClose } = useDisclosure();

    return <Box boxShadow="0px 0px 1px 0px #ccccccaa" bg="primary.400" zIndex="1" borderRadius="10px" px="3" py="1" right="0" top="-14px" margin="auto" position="absolute" w='fit-content' display='flex' alignItems='center'>
        <Text display="flex" alignItems="center" fontSize="14px" cursor="pointer" mb='0' onClick={onOpen}>
            Extend market loan by auto-buying DBR <RepeatClockIcon fontSize="14px" ml="1" />
        </Text>
        {
            isOpen && <ExtendMarketLoanContent dbrBuySlippage={dbrBuySlippage} dolaPriceUsd={dolaPriceUsd} handleExtendMarketLoan={handleExtendMarketLoan} onClose={onClose} dbrDurationInputs={dbrDurationInputs} debt={debt} totalDebt={totalDebt} duration={duration} market={market} deposits={deposits} />
        }
    </Box>
}

export const FirmLeverageSwitch = ({
    isDeposit,
    onChange,
    useLeverage,
}: {
    isDeposit: boolean
    onChange: (value: boolean) => void
    useLeverage: boolean
}) => {
    return <FormControl w='fit-content' display='flex' alignItems='center'>
        <AnimatedInfoTooltip
            iconProps={{ color: 'secondaryTextColor', fontSize: '12px', mr: '2' }}
            message="This feature allows you to easily do leverage / looping on your collateral in just one transaction"
        />
        <FormLabel cursor="pointer" fontWeight='normal' fontSize='14px' color='secondaryTextColor' htmlFor='leverage-switch' mb='0'>
            {isDeposit ? 'L' : 'Del'}everage / Looping 🔥
        </FormLabel>
        <Switch onChange={() => onChange(isDeposit)} isChecked={useLeverage} id='leverage-switch' />
    </FormControl>
}

export const FirmCollateralInputTitle = ({
    isDeposit,
    market,
    isWethMarket,
    isUseNativeCoin,
    useLeverageInMode,
    deposits,
    isUnderlyingAsInputCase,
    isDolaAsInputCase,
    noZap,
    onEnsoModalOpen,
}: {
    isDeposit: boolean
    market: F2Market
    isWethMarket: boolean
    isUseNativeCoin: boolean
    useLeverageInMode: boolean
    deposits: number
    isUnderlyingAsInputCase: boolean
    isDolaAsInputCase: boolean
    noZap: boolean
    onEnsoModalOpen: () => void
}) => {
    const depositWording = market.isInv ? 'Stake' : 'Deposit';
    const withdrawWording = useLeverageInMode ? 'Sell' : market.isInv ? 'Unstake' : 'Withdraw';
    const wording = isDeposit ? depositWording : withdrawWording;
    const leverageExtraWording = useLeverageInMode ? isDeposit && deposits > 0 ? ` (on top of leverage)` : isDeposit && !deposits ? '' : ' (to deleverage)' : '';
    const assetName = isWethMarket && isUseNativeCoin ? 'ETH' : isDolaAsInputCase ? 'DOLA' : isUnderlyingAsInputCase ? market.underlyingSymbol : market.underlying.symbol;
    const ensoProps = isDeposit && !!onEnsoModalOpen ? { borderBottomWidth: '1px', borderColor: 'mainTextColor', cursor: 'pointer', onClick: onEnsoModalOpen } : {};
    return <Stack spacing="0" direction={{ base: 'column', sm: 'row' }} w='full' justify="space-between" alignItems="flex-start">
        <TextInfo message={
            isDeposit ?
                market.isInv ?
                    "Staked INV can be withdrawn at any time"
                    : "The more you deposit, the more you can borrow against"
                : useLeverageInMode ? "When deleveraging, the collateral will be withdrawn and automatically sold for DOLA in order to repay some debt" : "Withdrawing collateral will reduce borrowing power"
        }>
            <Flex direction={{ base: 'column', sm: 'row' }} alignItems={{ base: 'flex-start', sm: 'center' }} w='full' justify={{ base: 'flex-start', md: 'space-between' }}>
                <Flex alignItems="center">
                    <Text fontSize='18px' color="mainTextColor">
                        <b>{wording}</b>&nbsp;
                    </Text>
                    <Text fontSize='18px' color="mainTextColor">
                        {assetName?.replace(/ lp$/, 'LP')}{leverageExtraWording}:
                    </Text>
                </Flex>
            </Flex>
        </TextInfo>
        {
            !noZap && isDeposit && <Flex alignItems="center">
                <TextInfo message="Zap-In allows you to get the market's collateral very easily">
                    <Flex {...ensoProps} alignItems="center">
                        Zap-In<Image src="/assets/zap.png" h="20px" w="20px" />
                    </Flex>
                </TextInfo>
            </Flex>
        }
    </Stack>
}

export const FirmDebtInputTitle = ({
    isDeposit,
    useLeverageInMode,
}: {
    isDeposit: boolean
    useLeverageInMode: boolean
}) => {
    return <TextInfo
        message={
            `The amount of DOLA stablecoin you wish to ${isDeposit ? 'borrow' : 'repay'}${useLeverageInMode ? isDeposit ? ' to do leverage' : ' while deleveraging' : ''}`
        }
    >
        <Text fontSize='18px' color="mainTextColor"><b>{isDeposit ? 'Borrow' : 'Repay'}</b> DOLA{useLeverageInMode ? isDeposit ? ' (to do leverage)' : ' (on top of deleverage)' : ''}:</Text>
    </TextInfo>
}

export const FirmDepositRecipient = ({
    setCustomRecipient,
    customRecipient,
    placeholder
}: {
    setCustomRecipient: (v: string) => void,
    customRecipient: string,
    placeholder: string
}) => {
    const [opened, setOpened] = useState(false);
    const isVisible = !!customRecipient || opened;
    const isWrongAddress = !!customRecipient ? !isAddress(customRecipient) || customRecipient === BURN_ADDRESS : false;
    return <VStack w='full' alignItems="flex-start">
        <TextInfo message="The deposit will be deposited to another account">
            <HStack spacing="1" cursor="pointer" onClick={v => !!customRecipient ? () => { } : setOpened(!opened)}>
                <Text>Recipient address (optional)</Text>
                {!customRecipient ? isVisible ? <ChevronDownIcon /> : <ChevronRightIcon /> : null}
            </HStack>
        </TextInfo>
        {
            isVisible && <Input isInvalid={isWrongAddress} w='full' placeholder={placeholder} value={customRecipient} onChange={e => setCustomRecipient(e.target.value)} />
        }
        {
            isVisible && !!customRecipient && <InfoMessage
                alertProps={{ w: 'full' }}
                description="You will deposit to another account than the current connected account, the position of your current connected account will not change."
            />
        }
    </VStack>
}