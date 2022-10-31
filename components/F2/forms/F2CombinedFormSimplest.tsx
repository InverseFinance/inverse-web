import { Stack, VStack, Text, HStack, useMediaQuery } from '@chakra-ui/react'
import Container from '@app/components/common/Container'
import { shortenNumber } from '@app/util/markets'
import { parseEther } from '@ethersproject/units'
import { SimpleAmountForm } from '@app/components/common/SimpleAmountForm'
import { F2Market } from '@app/types'
import { JsonRpcSigner } from '@ethersproject/providers'
import { f2CalcNewHealth, f2deposit, f2withdraw, getRiskColor } from '@app/util/f2'
import { BigNumber } from 'ethers'
import { useBalances } from '@app/hooks/useBalances'
import { useAccountDBRMarket } from '@app/hooks/useDBR'
import { useEffect, useState } from 'react'
import { BigImageButton } from '@app/components/common/Button/BigImageButton'
import { AnimatedInfoTooltip } from '@app/components/common/Tooltip'
import { preciseCommify } from '@app/util/misc'
import { F2SettingsPopover } from './F2SettingsPopover'

const TextInfo = ({ message, children, color = 'secondaryTextColor' }) => {
    return <HStack>
        <AnimatedInfoTooltip
            message={message}
            iconProps={{ color, fontSize: '12px' }}
        />
        {children}
    </HStack>
}

export const F2CombinedFormSimplest = ({
    f2market,
    account,
    signer,
    isDepositDefault = true,
    onDepositChange,
    onDebtChange,
    onHealthOpen,
    onDbrOpen,
    ...props
}: {
    f2market: F2Market
    account: string | null | undefined
    signer: JsonRpcSigner | undefined
    isDepositDefault?: boolean
    onDepositChange?: (v: number) => void
    onDebtChange?: (v: number) => void
    onHealthOpen: () => void,
    onDbrOpen: () => void,
}) => {
    const colDecimals = f2market.underlying.decimals;
    const [duration, setDuration] = useState(365);
    const [collateralAmount, setCollateralAmount] = useState(0);
    const [debtAmount, setDebtAmount] = useState(0);
    const [isDeposit, setIsDeposit] = useState(isDepositDefault);
    const [isSmallerThan728] = useMediaQuery('(max-width: 728px)');

    const { deposits, bnDeposits, debt, bnWithdrawalLimit, perc, bnDolaLiquidity } = useAccountDBRMarket(f2market, account);
    const {
        newPerc, newLiquidationPrice, newCreditLimit, newDebt
    } = f2CalcNewHealth(f2market, deposits, debt, collateralAmount, debtAmount, perc);

    const { balances } = useBalances([f2market.collateral]);
    const bnCollateralBalance = balances ? balances[f2market.collateral] : BigNumber.from('0');

    const handleAction = (amount: BigNumber) => {
        if (!signer) { return }
        return isDeposit ?
            f2deposit(signer, f2market.address, amount)
            : f2withdraw(signer, f2market.address, amount)
    }

    const handleCollateralChange = (floatNumber: number) => {
        setCollateralAmount(floatNumber)
    }

    const handleDebtChange = (floatNumber: number) => {
        setDebtAmount(floatNumber)
    }

    useEffect(() => {
        if (!onDepositChange) { return };
        onDepositChange(isDeposit ? collateralAmount : -collateralAmount);
    }, [isDeposit, collateralAmount, onDepositChange]);

    useEffect(() => {
        if (!onDebtChange) { return };
        onDebtChange(isDeposit ? debtAmount : -debtAmount);
    }, [isDeposit, debtAmount, onDebtChange]);

    const btnLabel = isDeposit ? `Deposit & Borrow` : 'Withdraw';
    const btnMaxlabel = `${btnLabel} Max`;
    const isFormFilled = (!!collateralAmount && !!debtAmount) || debt > 0 || newDebt > 0;
    const riskColor = !isFormFilled ? 'secondaryTextColor' : getRiskColor(newPerc);
    
    return <Container
        noPadding
        p="0"
        label={isSmallerThan728 ? 'Deposit & Borrow' : `Deposit ${f2market.name} and Borrow DOLA`}
        description={`Quick and Easy Fixed-Rate Borrowing`}
        contentBgColor={'lightPrimaryAlpha'}
        image={isSmallerThan728 ? undefined : <BigImageButton bg={`url('/assets/v2/dola.png')`} h="50px" w="80px" /> }
        right={
            <F2SettingsPopover duration={duration} onDurationChange={(v) => setDuration(v)} />
            // <F2DurationSlider duration={duration} onChange={(v) => setDuration(v)} />
        }
        w='full'
        {...props}
    >
        <VStack w='full' spacing="6" minH="300px" justify="center">
            <VStack w='full' alignItems="flex-start">
                <Text>How much <b>Collateral</b> do you want to <b>Deposit</b>?</Text>
                <SimpleAmountForm
                    address={f2market.collateral}
                    destination={f2market.address}
                    signer={signer}
                    decimals={colDecimals}
                    maxAmountFrom={isDeposit ? [bnCollateralBalance] : [bnDeposits, bnWithdrawalLimit]}
                    onAction={({ bnAmount }) => handleAction(bnAmount)}
                    onMaxAction={({ bnAmount }) => handleAction(bnAmount)}
                    actionLabel={btnLabel}
                    maxActionLabel={btnMaxlabel}
                    onAmountChange={handleCollateralChange}
                    showMaxBtn={isDeposit || !debt}
                    hideInputIfNoAllowance={false}
                    hideButtons={true}
                />
            </VStack>
            <VStack w='full' alignItems="flex-start">
                <Text>How much <b>DOLA</b> do you want to <b>Borrow</b>?</Text>
                <SimpleAmountForm
                    address={f2market.collateral}
                    destination={f2market.address}
                    signer={signer}
                    decimals={colDecimals}
                    maxAmountFrom={isDeposit ? [bnDolaLiquidity, parseEther((newCreditLimit * 0.99).toFixed(0))] : []}
                    onAction={({ bnAmount }) => handleAction(bnAmount)}
                    onMaxAction={({ bnAmount }) => handleAction(bnAmount)}
                    actionLabel={btnLabel}
                    maxActionLabel={btnMaxlabel}
                    onAmountChange={handleDebtChange}
                    showMaxBtn={!isDeposit}
                    hideInputIfNoAllowance={false}
                    hideButtons={false}
                    isDisabled={newPerc < 1}
                />
                <VStack spacing="0" w='full'>
                    <Stack pt="2" w='full' justify="space-between" direction={{ base: 'column', lg: 'row' }}>
                        <TextInfo color={riskColor} message="Percentage of the loan covered by the collateral worth">
                            <Text cursor="pointer" onClick={() => onHealthOpen()} color={riskColor} fontWeight={newPerc <= 25 ? 'bold' : undefined}>
                                Collateral Health: {isFormFilled ? `${shortenNumber(newPerc, 2)}%` : '-'}
                            </Text>
                        </TextInfo>
                        <TextInfo color={riskColor} message="Minimum Collateral Price before liquidations can happen">
                            <Text cursor="pointer" onClick={() => onHealthOpen()} color={riskColor} fontWeight={newPerc <= 25 ? 'bold' : undefined}>
                                Liquidation Price: {isFormFilled ? `${preciseCommify(newLiquidationPrice, 2, true)}` : '-'}
                            </Text>
                        </TextInfo>
                    </Stack>
                    <Stack pt="2" w='full' justify="space-between" direction={{ base: 'column', lg: 'row' }}>
                        <TextInfo message="Fixed Rate borrowing is handled thanks to DBR tokens, don't sell them unless you know what you're doing!">
                            <Text cursor="pointer" onClick={() => onDbrOpen()} color="secondaryTextColor">
                                DBR to receive: {shortenNumber(debtAmount / (365 / duration), 2)}
                            </Text>
                        </TextInfo>
                        <TextInfo message="The Fixed Rate will be locked-in for a specific duration, you can change the duration by clicking the settings icon.">
                            <Text cursor="pointer" onClick={() => onDbrOpen()} color="secondaryTextColor">
                                Fixed Rate Duration: {duration} days
                            </Text>
                        </TextInfo>
                    </Stack>
                </VStack>
            </VStack>
        </VStack>
    </Container>
}