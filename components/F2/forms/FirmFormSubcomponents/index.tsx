import { AmountInfos } from "@app/components/common/Messages/AmountInfos"
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