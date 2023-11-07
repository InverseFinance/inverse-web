import { AmountInfos } from "@app/components/common/Messages/AmountInfos"
import { TextInfo } from "@app/components/common/Messages/TextInfo"
import { F2Market } from "@app/types"
import { FormControl, FormLabel, HStack, Switch, Text } from "@chakra-ui/react"
import { formatUnits } from "@ethersproject/units"
import { BigNumber } from "ethers"

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
    handleDebtChange: (value: string) => void
}) => {
    return <HStack w='full' justify="space-between">
        <AmountInfos
            label="Available DOLA"
            value={leftToBorrow < 1 ? 0 : leftToBorrow}
            textProps={{
                fontSize: '14px',
                onClick: leftToBorrow > 1 ? () => handleDebtChange(formatUnits(bnLeftToBorrow, 18)) : undefined
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
}: {
    deposits: number
    price: number
    handleCollateralChange: (value: string) => void
    bnDeposits: BigNumber
    decimals: number
}) => {
    return <HStack w='full' justify="space-between">
        <AmountInfos
            label="Deposits"
            value={deposits}
            price={price}
            textProps={{
                cursor: 'pointer',
                fontSize: '14px',
                onClick: () => handleCollateralChange(formatUnits(bnDeposits, decimals))
            }}
        />
    </HStack>
}

export const FirmWethSwitch = ({
    onWethSwapModalOpen,
    useLeverage,
    setIsUseNativeCoin,
    isUseNativeCoin,
}: {
    onWethSwapModalOpen: () => void
    useLeverage: boolean
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
            !useLeverage && <FormControl w='fit-content' display='flex' alignItems='center'>
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
    <FormLabel fontWeight='normal' fontSize='14px' color='secondaryTextColor' htmlFor='leverage-switch' mb='0'>
        {isDeposit ? 'L' : 'Del'}everage (beta)?
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
}: {
    isDeposit: boolean
    market: F2Market
    isWethMarket: boolean
    isUseNativeCoin: boolean
    useLeverageInMode: boolean
    deposits: number
}) => {
    return <TextInfo message={
        isDeposit ?
            market.isInv ?
                "Staked INV can be withdrawn at any time"
                : "The more you deposit, the more you can borrow against"
            : "Withdrawing collateral will reduce borrowing power"
    }>
        <Text fontSize='18px' color="mainTextColor">
            <b>{isDeposit ? market.isInv ? 'Stake' : 'Deposit' : market.isInv ? 'Unstake' : 'Withdraw'}</b> {isWethMarket && isUseNativeCoin ? 'ETH' : market.underlying.symbol}{useLeverageInMode ? isDeposit && deposits > 0 ? ` (on top of leverage)` : ' (deleveraging)' : ''}:
        </Text>
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
            `The amount of DOLA stablecoin you wish to ${isDeposit ? 'borrow' : 'repay'}`
        }
    >
        <Text fontSize='18px' color="mainTextColor"><b>{isDeposit ? 'Borrow' : 'Repay'}</b> DOLA{useLeverageInMode ? isDeposit ? ' (to do leverage)' : ' (on top of leverage)' : ''}:</Text>
    </TextInfo>
}