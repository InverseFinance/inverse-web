import { Stack, VStack, Text, HStack, useMediaQuery, FlexProps, Divider, Flex, Box, useDisclosure } from '@chakra-ui/react'
import Container from '@app/components/common/Container'
import { shortenNumber } from '@app/util/markets'
import { parseEther } from '@ethersproject/units'
import { SimpleAmountForm } from '@app/components/common/SimpleAmountForm'
import { F2Market } from '@app/types'
import { JsonRpcSigner } from '@ethersproject/providers'
import { f2CalcNewHealth, getRiskColor } from '@app/util/f2'
import { BigNumber } from 'ethers'
import { useBalances } from '@app/hooks/useBalances'
import { useAccountDBRMarket } from '@app/hooks/useDBR'
import { useEffect, useState } from 'react'
import { BigImageButton } from '@app/components/common/Button/BigImageButton'
import { AnimatedInfoTooltip } from '@app/components/common/Tooltip'
import { preciseCommify } from '@app/util/misc'
import { F2DurationInput } from './F2DurationInput'
import InfoModal from '@app/components/common/Modal/InfoModal'

const TextInfo = ({ message, children, color = 'secondaryTextColor' }) => {
    return <HStack>
        <AnimatedInfoTooltip
            message={message}
            iconProps={{ color, fontSize: '12px' }}
        />
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
} & Partial<FlexProps>) => {
    const colDecimals = f2market.underlying.decimals;
    const [duration, setDuration] = useState(365);
    const [collateralAmount, setCollateralAmount] = useState(0);
    const [debtAmount, setDebtAmount] = useState(0);
    const [isDeposit, setIsDeposit] = useState(isDepositDefault);
    const [isSmallerThan728] = useMediaQuery('(max-width: 728px)');
    const { isOpen, onOpen, onClose } = useDisclosure();

    const { deposits, bnDeposits, debt, bnWithdrawalLimit, perc, bnDolaLiquidity } = useAccountDBRMarket(f2market, account);
    const {
        newPerc, newLiquidationPrice, newCreditLimit, newDebt
    } = f2CalcNewHealth(f2market, deposits, debt, collateralAmount, debtAmount, perc);

    const { balances } = useBalances([f2market.collateral]);
    const bnCollateralBalance = balances ? balances[f2market.collateral] : BigNumber.from('0');

    const handleAction = (amount: BigNumber) => {
        if (!signer) { return }
        alert('Contract not implemented for this yet');
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

    const leftPart = <Stack direction={{ base: 'column', lg: 'row' }} spacing="4" w={{ base: '100%', lg: '100%' }} >
        <VStack w='full' alignItems="flex-start">
            <TextInfo message="The more you deposit, the more you can borrow against">
                <Text><b>Collateral</b> to <b>Deposit</b>:</Text>
            </TextInfo>
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
                showBalance={true}
            />
        </VStack>
        <VStack w='full' alignItems="flex-start">
            <TextInfo message="The amount of DOLA stablecoin you wish to borrow">
                <Text><b>DOLA stablecoin</b> to <b>Borrow</b>:</Text>
            </TextInfo>
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
                hideButtons={true}
                isDisabled={newPerc < 1}
            />
        </VStack>
    </Stack>

    const rightPart = <VStack spacing='4' w={{ base: '100%', lg: '100%' }}>
        <VStack w='full' alignItems="flex-start">
            <TextInfo message="This will lock-in a Borrow Rate for the desired duration, after the duration you can still keep the loan but at the expense of a higher debt and Borrow Rate.">
                <Text>Fixed Rate <b>Duration</b>:</Text>
            </TextInfo>
            <F2DurationInput
                onChange={v => setDuration(v)}
                showText={false}
            />
        </VStack>
    </VStack>

    const actionBtn = <HStack w='250px'>
        <SimpleAmountForm
            defaultAmount={collateralAmount?.toString()}
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
            showMaxBtn={false}
            hideInputIfNoAllowance={false}
            hideInput={true}
            hideButtons={false}
            btnProps={{
                h: '50px',
                w: 'full',
                fontSize: '18px'
            }}
        />

    </HStack>

    const bottomPart = <Stack position="relative" alignItems="center" justify="space-between" spacing="4" w='full' direction={{ base: 'column' }}>
        {actionBtn}

        <HStack w='full' justify="space-between" top={{ md: '-4' }} position={{ base: 'relative', md: 'absolute' }}>
            <VStack  alignItems="flex-start">
                <TextInfo color={riskColor} message="Percentage of the loan covered by the collateral worth">
                    <Text cursor="pointer" onClick={() => onHealthOpen()} color={riskColor} fontWeight={newPerc <= 25 ? 'bold' : undefined}>
                        Collateral Health: {isFormFilled ? `${shortenNumber(newPerc, 2)}%` : '-'}
                    </Text>
                </TextInfo>
                <TextInfo color={riskColor} message="Minimum Collateral Price before liquidations can happen">
                    <Text cursor="pointer" onClick={() => onHealthOpen()} color={riskColor} fontWeight={newPerc <= 25 ? 'bold' : undefined}>
                        Liq. Price: {isFormFilled ? `${preciseCommify(newLiquidationPrice, 2, true)}` : '-'}
                    </Text>
                </TextInfo>
            </VStack>

            <VStack  alignItems={{ base: 'flex-end', md: 'flex-end' }}>
                <TextInfo message="DBR tokens you will receive, they will be automatically used to cover borrowing interests over time. Don't sell them unless you know what you're doing!">
                    <Text cursor="pointer" onClick={() => onDbrOpen()} color="secondaryTextColor">
                        DBR cover: {shortenNumber(debtAmount / (365 / duration), 2)}
                    </Text>
                </TextInfo>
                <TextInfo message="The Fixed Rate will be locked-in for a specific duration, you can change the duration by clicking the settings icon.">
                    <Text cursor="pointer" onClick={() => onDbrOpen()} color="secondaryTextColor">
                        Fixed-Rate: {duration} days
                    </Text>
                </TextInfo>
            </VStack>
        </HStack>

    </Stack>

    return <Container
        noPadding
        p="0"
        label={isSmallerThan728 ? 'Deposit & Borrow' : `Deposit ${f2market.name} and Borrow DOLA`}
        description={`Quick and Easy Fixed-Rate Borrowing`}
        contentBgColor={'lightPrimaryAlpha'}
        image={isSmallerThan728 ? undefined : <BigImageButton bg={`url('/assets/dola.png')`} h="50px" w="80px" />}
        // right={
        //     <F2DurationSlider duration={duration} onChange={(v) => setDuration(v)} />
        // }
        w='full'
        {...props}
    >
        <InfoModal title="Loan Breakdown" isOpen={isOpen} onClose={onClose} onOk={onClose}>
            <VStack>
                <Text>Breakdown here</Text>
            </VStack>
        </InfoModal>
        <VStack w='full' px='2%' alignItems="center" spacing="8">
            <Stack justify="space-between" w='full' spacing="4" direction={{ base: 'column' }}>
                {leftPart}
                {rightPart}
            </Stack>
            <Divider borderColor="#cccccc66" />
            <VStack w='full' spacing="4" alignItems="center">
                {bottomPart}
                <Text onClick={() => onOpen()} cursor="pointer" _hover={{ color: 'mainTextColor' }} fontSize="12px" color="secondaryTextColor">
                    See Breakdown
                </Text>
            </VStack>
        </VStack>
    </Container>
}