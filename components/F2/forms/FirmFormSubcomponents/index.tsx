import { Input } from "@app/components/common/Input"
import { InfoMessage } from "@app/components/common/Messages"
import { AmountInfos } from "@app/components/common/Messages/AmountInfos"
import { TextInfo } from "@app/components/common/Messages/TextInfo"
import { AnimatedInfoTooltip } from "@app/components/common/Tooltip"
import { BURN_ADDRESS } from "@app/config/constants"
import { F2Market } from "@app/types"
import { getBnToNumber } from "@app/util/markets"
import { ChevronDownIcon, ChevronRightIcon } from "@chakra-ui/icons"
import { Flex, FormControl, FormLabel, HStack, Switch, Text, VStack, Image } from "@chakra-ui/react"
import { formatUnits } from "@ethersproject/units"
import { BigNumber } from "ethers"
import { isAddress } from "ethers/lib/utils"
import { useState } from "react"

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
    handleDebtChange,
}: {
    leftToBorrow: number
    bnLeftToBorrow: BigNumber
    handleDebtChange: (value: string, num: number) => void
}) => {
    const numInt = parseInt(formatUnits(bnLeftToBorrow, 18));
    return <HStack w='full' justify="space-between">
        <AmountInfos
            label="Available DOLA"
            value={leftToBorrow < 1 ? 0 : leftToBorrow}
            textProps={{
                fontSize: '14px',
                onClick: leftToBorrow > 1 ? () => handleDebtChange(numInt.toString(), numInt) : undefined
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
            label={useLeverageInMode ? 'Sell all' : 'Deposits'}
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
    return <FormControl boxShadow="0px 0px 1px 0px #ccccccaa" bg="primary.400" zIndex="1" borderRadius="10px" px="2" py="1" right="0" top="-20px" margin="auto" position="absolute" w='fit-content' display='flex' alignItems='center'>
        <FormLabel cursor="pointer" htmlFor='withdraw-mode' mb='0'>
            {isInv ? 'Unstake?' : 'Repay / Withdraw?'}
        </FormLabel>
        <Switch isChecked={!isDeposit} onChange={handleDirectionChange} id='withdraw-mode' />
    </FormControl>
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
    onEnsoModalOpen,
}: {
    isDeposit: boolean
    market: F2Market
    isWethMarket: boolean
    isUseNativeCoin: boolean
    useLeverageInMode: boolean
    deposits: number
    isUnderlyingAsInputCase: boolean
    onEnsoModalOpen: () => void
}) => {
    const depositWording = market.isInv ? 'Stake' : 'Deposit';
    const withdrawWording = useLeverageInMode ? 'Sell' : market.isInv ? 'Unstake' : 'Withdraw';
    const wording = isDeposit ? depositWording : withdrawWording;
    const leverageExtraWording = useLeverageInMode ? isDeposit && deposits > 0 ? ` (on top of leverage)` : isDeposit && !deposits ? '' : ' (to deleverage)' : '';
    const assetName = isWethMarket && isUseNativeCoin ? 'ETH' : isUnderlyingAsInputCase ? market.underlyingSymbol : market.underlying.symbol;
    const ensoProps = isDeposit && !!onEnsoModalOpen ? { borderBottomWidth: '1px', borderColor: 'mainTextColor', cursor: 'pointer', onClick: onEnsoModalOpen } : {};
    return <TextInfo message={
        isDeposit ?
            market.isInv ?
                "Staked INV can be withdrawn at any time"
                : "The more you deposit, the more you can borrow against"
            : useLeverageInMode ? "When deleveraging, the collateral will be withdrawn and automatically sold for DOLA in order to repay some debt" : "Withdrawing collateral will reduce borrowing power"
    }>
        <Flex alignItems="center">
            <Text fontSize='18px' color="mainTextColor">
                <b>{wording}</b>&nbsp;
            </Text>
            <Flex {...ensoProps} alignItems="center">
                <Text fontSize='18px' color="mainTextColor" >
                    {assetName}{leverageExtraWording}
                </Text>
                <Image src="/assets/zap.png" h="20px" w="20px" />:
            </Flex>
        </Flex>
    </TextInfo>
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