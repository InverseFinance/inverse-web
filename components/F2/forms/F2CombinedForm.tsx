import { Stack, VStack, Text, HStack } from '@chakra-ui/react'
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
import { F2DurationSlider } from './F2DurationSlider'

const TextInfo = ({ message, children }) => {
    return <HStack>
        <AnimatedInfoTooltip message={message} iconProps={{ color: 'secondaryTextColor', fontSize: '12px' }} />
        {children}
    </HStack>
}

export const F2CombinedForm = ({
    f2market,
    account,
    signer,
    isDepositDefault = true,
    onDepositChange,
    onDebtChange,
}: {
    f2market: F2Market
    account: string | null | undefined
    signer: JsonRpcSigner | undefined
    isDepositDefault?: boolean
    onDepositChange?: (v: number) => void
    onDebtChange?: (v: number) => void
}) => {
    const colDecimals = f2market.underlying.decimals;
    const [duration, setDuration] = useState(365);
    const [collateralAmount, setCollateralAmount] = useState(0);
    const [debtAmount, setDebtAmount] = useState(0);
    const [isDeposit, setIsDeposit] = useState(isDepositDefault);

    const { deposits, bnDeposits, debt, bnWithdrawalLimit, perc, bnDola } = useAccountDBRMarket(f2market, account);
    const {
        newPerc, newLiquidationPrice, newCreditLimit
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
        if (!onDepositChange) { return };
        onDepositChange(isDeposit ? collateralAmount : -collateralAmount);
    }, [isDeposit, collateralAmount, onDepositChange]);

    const btnLabel = isDeposit ? `Deposit & Borrow` : 'Withdraw';
    const btnMaxlabel = `${btnLabel} Max`;
    const isFormFilled = !!collateralAmount && !!debtAmount;
    const riskColor = !isFormFilled ? 'secondaryTextColor' : getRiskColor(newPerc);

    return <Container
        noPadding
        p="0"
        label={`Deposit ${f2market.name} and Borrow DOLA`}
        description={`Quick and Easy Fixed-Rate Borrowing`}
        contentBgColor={'lightPrimaryAlpha'}
        image={<BigImageButton bg={`url('/assets/dola.png')`} h="50px" w="80px" />}
        right={
            <F2DurationSlider duration={duration} onChange={(v) => setDuration(v)} />
        }
        w={{ base: 'full', lg: '50%' }}
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
                    maxAmountFrom={isDeposit ? [bnDola, parseEther((newCreditLimit * 0.99).toFixed(0))] : []}
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
                        <TextInfo message="Percentage of the loan covered by the collateral worth">
                            <Text color={riskColor} fontWeight={newPerc <= 25 ? 'bold' : undefined}>
                                Collateral Health: {isFormFilled ? `${shortenNumber(newPerc, 2)}%` : '-'}
                            </Text>
                        </TextInfo>
                        <TextInfo message="Minimum Collateral Price before liquidations can happen">
                            <Text color={riskColor} fontWeight={newPerc <= 25 ? 'bold' : undefined}>
                                Liquidation Price: {isFormFilled ? `${shortenNumber(newLiquidationPrice, 2)}%` : '-'}
                            </Text>
                        </TextInfo>
                    </Stack>
                    <Stack pt="2" w='full' justify="space-between" direction={{ base: 'column', lg: 'row' }}>
                        <TextInfo message="Fixed Rate borrowing is handled thanks to DBR tokens, don't sell them unless you know what you're doing!">
                            <Text color="secondaryTextColor">
                                DBR to receive: X
                            </Text>
                        </TextInfo>
                        <TextInfo message="The Fixed Rate will be locked-in for a specific duration, you can change the duration by clicking the settings icon.">
                            <Text color="secondaryTextColor">
                                Fixed Rate Validity: {duration} days
                            </Text>
                        </TextInfo>
                    </Stack>
                </VStack>
            </VStack>
        </VStack>
    </Container>
}