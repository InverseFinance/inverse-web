import { Stack, VStack, Text, HStack, useMediaQuery, FlexProps, Divider, useDisclosure, Switch, FormControl, FormLabel } from '@chakra-ui/react'
import Container from '@app/components/common/Container'
import { getNumberToBn, shortenNumber } from '@app/util/markets'
import { formatUnits, parseEther, parseUnits } from '@ethersproject/units'
import { SimpleAmountForm } from '@app/components/common/SimpleAmountForm'
import { F2Market } from '@app/types'
import { JsonRpcSigner } from '@ethersproject/providers'
import { f2borrow, f2CalcNewHealth, f2deposit, f2repay, f2withdraw, getRiskColor } from '@app/util/f2'
import { useAccountDBRMarket, useDBRPrice, useAccountDBR } from '@app/hooks/useDBR'
import { useEffect, useState } from 'react'
import { BigImageButton } from '@app/components/common/Button/BigImageButton'

import { F2DurationInput } from './F2DurationInput'
import { MarketImage } from '@app/components/common/Assets/MarketImage'
import { TOKENS } from '@app/variables/tokens'
import { getNetworkConfigConstants } from '@app/util/networks'
import { InfoMessage } from '@app/components/common/Messages'
import { TextInfo } from '@app/components/common/Messages/TextInfo'
import { AmountInfos } from '@app/components/common/Messages/AmountInfos'
import { F2FormInfos } from './F2FormInfos'
import { NavButtons } from '@app/components/common/Button'

const { DOLA } = getNetworkConfigConstants();

const dolaToken = TOKENS[DOLA];

const MODES = {
    'Deposit & Borrow': 'd&b',
    'Deposit': 'deposit',
    'Borrow': 'borrow',
    'Repay & Withdraw': 'r&w',
    'Repay': 'repay',
    'Withdraw': 'withdraw',
}

const inOptions = ['Deposit & Borrow', 'Deposit', 'Borrow'];
const outOptions = ['Repay & Withdraw', 'Withdraw', 'Repay'];

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
    const [duration, setDuration] = useState(360);
    const [durationType, setDurationType] = useState('months');
    const [durationTypedValue, setDurationTypedValue] = useState('12');
    const [collateralAmount, setCollateralAmount] = useState(0);
    const [debtAmount, setDebtAmount] = useState(0);
    const [isDeposit, setIsDeposit] = useState(isDepositDefault);
    const [isAutoDBR, setIsAutoDBR] = useState(true);
    const [isSmallerThan728] = useMediaQuery('(max-width: 728px)');
    const { price: dbrPrice } = useDBRPrice();
    const { isOpen, onOpen, onClose } = useDisclosure();
    const [mode, setMode] = useState('Deposit & Borrow');

    const { deposits, bnDeposits, debt, bnWithdrawalLimit, perc, bnDolaLiquidity, bnCollateralBalance, collateralBalance, bnDebt } = useAccountDBRMarket(f2market, account);

    const dbrCover = debtAmount / (365 / duration);
    const dbrCoverDebt = debtAmount * dbrPrice / (365 / duration);
    // const newTotalDebt = newDebt + dbrCover;

    const handleDurationChange = (duration: number, typedValue: number, type: string) => {
        setDurationTypedValue(typedValue);
        setDurationType(type);
        setDuration(duration);
    }

    const {
        newDebt, newDeposits
    } = f2CalcNewHealth(f2market, deposits, debt, isDeposit ? collateralAmount : -collateralAmount, isDeposit ? debtAmount : -debtAmount, perc);

    const hasCollateralChange = ['deposit', 'd&b', 'withdraw', 'r&w'].includes(MODES[mode]);
    const hasDebtChange = ['borrow', 'd&b', 'repay', 'r&w'].includes(MODES[mode]);

    const {
        newPerc, newLiquidationPrice, newCreditLimit, newDebt: newTotalDebt
    } = f2CalcNewHealth(
        f2market,
        deposits,
        debt + (isDeposit && isAutoDBR ? dbrCoverDebt : 0),
        hasCollateralChange ? isDeposit ? collateralAmount : -collateralAmount : 0,
        hasDebtChange? isDeposit ? debtAmount : -debtAmount : 0,
        perc,
    );

    const { dailyDebtAccrual: newDailyDBRBurn, dbrExpiryDate: newDBRExpiryDate } = useAccountDBR(account, newTotalDebt);

    const handleAction = () => {
        if (!signer) { return }
        const action = MODES[mode]
        if (action === 'deposit') {
            return f2deposit(signer, f2market.address, getNumberToBn(collateralAmount, f2market.underlying.decimals));
        } else if (action === 'borrow') {
            return f2borrow(signer, f2market.address, getNumberToBn(debtAmount, f2market.underlying.decimals));
        } else if (action === 'withdraw') {
            return f2withdraw(signer, f2market.address, getNumberToBn(collateralAmount, f2market.underlying.decimals));
        } else if (action === 'repay') {
            return f2repay(signer, f2market.address, getNumberToBn(debtAmount, f2market.underlying.decimals));
        } else {
            alert('Contract is not implemented yet for this action');
        }
    }

    const handleCollateralChange = (floatNumber: number) => {
        setCollateralAmount(floatNumber)
    }

    const handleDebtChange = (floatNumber: number) => {
        setDebtAmount(floatNumber)
    }

    const handleDirectionChange = () => {
        const _isDeposit = !isDeposit;
        setIsDeposit(_isDeposit);
        setMode(_isDeposit ? inOptions[outOptions.indexOf(mode)] : outOptions[inOptions.indexOf(mode)]);
    }

    const resetForm = () => {
        setDebtAmount('');
        setCollateralAmount('');
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
    const isFormFilled = true//(!!collateralAmount && !!debtAmount);
    const riskColor = !isFormFilled ? 'mainTextColor' : getRiskColor(newPerc);

    const leftPart = <Stack direction={{ base: 'column' }} spacing="4" w='full' >
        {
            ['deposit', 'd&b', 'withdraw', 'r&w'].includes(MODES[mode]) && <VStack w='full' alignItems="flex-start">
                <TextInfo message="The more you deposit, the more you can borrow against">
                    <Text fontSize='18px' color="mainTextColor"><b>{isDeposit ? 'Deposit' : 'Withdraw'}</b> {f2market.name}:</Text>
                </TextInfo>
                <SimpleAmountForm
                    defaultAmount={collateralAmount}
                    address={f2market.collateral}
                    destination={f2market.address}
                    signer={signer}
                    decimals={colDecimals}
                    maxAmountFrom={isDeposit ? [bnCollateralBalance] : [bnDeposits/*, bnWithdrawalLimit*/]}
                    onAction={handleAction}
                    onMaxAction={handleAction}
                    actionLabel={btnLabel}
                    maxActionLabel={btnMaxlabel}
                    onAmountChange={handleCollateralChange}
                    showMaxBtn={isDeposit || !debt}
                    hideInputIfNoAllowance={false}
                    hideButtons={true}
                    showBalance={isDeposit}
                    inputRight={<MarketImage pr="2" image={f2market.icon || f2market.underlying.image} size={25} />}
                    isError={isDeposit ? collateralAmount > collateralBalance : collateralAmount > deposits}
                />
                <AmountInfos label="Deposits" value={deposits} newValue={newDeposits} price={f2market.price} textProps={{ fontSize: '14px' }} />
            </VStack>
        }
        {['d&b', 'r&w'].includes(MODES[mode]) && <Divider borderColor="#cccccc66" />}
        {
            ['borrow', 'd&b', 'repay', 'r&w'].includes(MODES[mode]) && <VStack w='full' alignItems="flex-start">
                <TextInfo message="The amount of DOLA stablecoin you wish to borrow">
                    <Text fontSize='18px' color="mainTextColor"><b>{isDeposit ? 'Borrow' : 'Repay'}</b> DOLA:</Text>
                </TextInfo>
                <SimpleAmountForm
                    defaultAmount={debtAmount}
                    address={f2market.collateral}
                    destination={f2market.address}
                    signer={signer}
                    decimals={colDecimals}
                    maxAmountFrom={isDeposit ? [bnDolaLiquidity, parseEther((newCreditLimit * 0.99).toFixed(0))] : [bnDebt]}
                    onAction={({ bnAmount }) => handleAction(bnAmount)}
                    onMaxAction={({ bnAmount }) => handleAction(bnAmount)}
                    actionLabel={btnLabel}
                    maxActionLabel={btnMaxlabel}
                    onAmountChange={handleDebtChange}
                    showMax={!isDeposit}
                    showMaxBtn={!isDeposit}
                    hideInputIfNoAllowance={false}
                    hideButtons={true}
                    inputRight={<MarketImage pr="2" image={dolaToken.image} size={25} />}
                    isError={isDeposit ? newPerc < 1 : debtAmount > debt}
                />
                <AmountInfos
                    dbrCover={isAutoDBR ? isDeposit ? dbrCoverDebt : -dbrCoverDebt : 0}
                    label="Debt"
                    value={debt}
                    newValue={newDebt}
                    textProps={{ fontSize: '14px' }} />
                <FormControl w='fit-content' display='flex' alignItems='center'>
                    <FormLabel fontWeight='normal' fontSize='14px' color='secondaryTextColor' htmlFor='auto-dbr' mb='0'>
                        Auto-{isDeposit ? 'buy' : 'sell'} DBR?
                    </FormLabel>
                    <Switch onChange={() => setIsAutoDBR(!isAutoDBR)} isChecked={isAutoDBR} id='auto-dbr' />
                </FormControl>
            </VStack>
        }
    </Stack>

    const durationPart = <VStack spacing='4' w={{ base: '100%', lg: '100%' }}>
        <VStack w='full' alignItems="flex-start">
            <TextInfo message="This will lock-in a Borrow Rate for the desired duration, after the duration you can still keep the loan but at the expense of a higher debt and Borrow Rate.">
                <Text fontSize='18px' color="mainTextColor"><b>Duration</b> of the Fixed-Rate, Loan is Stoppable at any time:</Text>
            </TextInfo>
            <F2DurationInput
                onChange={handleDurationChange}
                defaultType={durationType}
                defaultValue={durationTypedValue}
            />
            <AmountInfos format={false} label="Duration in days" value={duration} textProps={{ fontSize: '14px' }} />
            {/* <F2DurationMultiInput
                onChange={(v) => setDuration(v)}                
            /> */}
        </VStack>
    </VStack>

    const disabledConditions = {
        'deposit': collateralAmount <= 0,
        'borrow': duration <= 0 || debtAmount <= 0 || newPerc < 1,
        'repay': debtAmount <= 0 || debtAmount > debt,
        'withdraw': collateralAmount <= 0 || collateralAmount > deposits || newPerc < 1,
    }
    disabledConditions['d&b'] = disabledConditions['deposit'] || disabledConditions['borrow']

    const actionBtn = <HStack>
        <SimpleAmountForm
            defaultAmount={collateralAmount?.toString()}
            address={f2market.collateral}
            destination={f2market.address}
            signer={signer}
            decimals={colDecimals}
            maxAmountFrom={isDeposit ? [bnCollateralBalance] : [bnDeposits, bnWithdrawalLimit]}
            onAction={({ bnAmount }) => handleAction(bnAmount)}
            onMaxAction={({ bnAmount }) => handleAction(bnAmount)}
            actionLabel={mode}
            maxActionLabel={btnMaxlabel}
            onAmountChange={handleCollateralChange}
            showMaxBtn={false}
            isDisabled={disabledConditions[MODES[mode]]}
            hideInputIfNoAllowance={false}
            hideInput={true}
            hideButtons={false}
            onSuccess={resetForm}
            btnProps={{
                h: '50px',
                w: 'fit-content',
                fontSize: '18px'
            }} />
    </HStack>

    const bottomPart = <Stack pt='4' position="relative" alignItems="center" justify="space-between" spacing="4" w='full' direction={{ base: 'column', sm: 'row' }}>
        <VStack alignItems={{ base: 'center', sm: 'flex-start' }}>
            <TextInfo color="accentTextColor" message="The Fixed Annual Borrowing Rate, directly linked to DBR price">
                <Text color="accentTextColor">Current Fixed APR:</Text>
            </TextInfo>
            <Text color="accentTextColor" fontWeight="extrabold" fontSize="24px">
                {shortenNumber(dbrPrice * 100, 2)}%
            </Text>
        </VStack>
        {/* <VStack alignItems={{ base: 'center', sm: 'flex-start' }}>
            <TextInfo color="accentTextColor" message="The Fixed Annual Borrowing Rate">
                <Text color="accentTextColor">DBR price:</Text>
            </TextInfo>
            <Text color="accentTextColor" fontWeight="extrabold" fontSize="24px">
                {shortenNumber(dbrPrice, 4, true)}
            </Text>
        </VStack> */}
        {actionBtn}
    </Stack>

    return <Stack
        direction={{ base: 'column', lg: 'row' }}
        w='full'
        spacing="4"
    >
        <Container
            noPadding
            p="0"
            label={`${f2market.name} Market`}
            description={`Quick and Easy Fixed-Rate Borrowing - Learn More`}
            href="https://docs.inverse.finance/inverse-finance/about-inverse"
            image={isSmallerThan728 ? undefined : <BigImageButton bg={`url('/assets/f2/markets/${f2market.name}.png')`} h="50px" w="80px" />}
            // right={
            //     <F2DurationSlider duration={duration} onChange={(v) => setDuration(v)} />
            // }
            w='full'
            contentProps={{ position: 'relative' }}
            {...props}
        >
            <FormControl bg="info" zIndex="1" borderRadius="10px" px="2" py="1" right="0" top="-20px" margin="auto" position="absolute" w='fit-content' display='flex' alignItems='center'>
                <FormLabel cursor="pointer" htmlFor='withdraw-mode' mb='0'>
                    Withdraw
                </FormLabel>
                <Switch onChange={handleDirectionChange} id='withdraw-mode' />
            </FormControl>
            <VStack position="relative" w='full' px='2%' py="2" alignItems="center" spacing="6">
                <NavButtons
                    active={mode}
                    options={isDeposit ? inOptions : outOptions}
                    onClick={(v) => setMode(v)}
                />
                <Stack justify="space-between" w='full' spacing="6" direction={{ base: 'column' }}>
                    {leftPart}
                    {['d&b', 'borrow'].includes(MODES[mode]) && isAutoDBR && <Divider borderColor="#cccccc66" />}
                    {['d&b', 'borrow'].includes(MODES[mode]) && isAutoDBR && durationPart}
                </Stack>
                {
                    parseFloat(collateralAmount) > collateralBalance && isDeposit &&
                    <InfoMessage
                        alertProps={{ w: 'full' }}
                        description="Not Enough collateral to deposit"
                    />
                }
                {/* <Divider borderColor="#cccccc66" />
            <F2FormInfos
                newPerc={newPerc}
                riskColor={riskColor}
                isFormFilled={isFormFilled}
                newLiquidationPrice={newLiquidationPrice}
                f2market={f2market}
                dbrCoverDebt={dbrCoverDebt}
                dbrCover={dbrCover}
                duration={duration}
                dbrPrice={dbrPrice}
                onHealthOpen={onHealthOpen}
                onDbrOpen={onDbrOpen}
            />
            <Divider borderColor="#cccccc66" />
            {bottomPart} */}
            </VStack>
        </Container>
        <Container
            noPadding
            w='full'
            // contentProps={{ minH: '430px' }}
            p="0"
            // pt="51px"
            label={'Infos & Recap'}
            description={`DBR's current price is the current Fixed APR - Learn More `}
            href="https://docs.inverse.finance/inverse-finance/about-inverse"
            image={isSmallerThan728 ? undefined : <BigImageButton bg={`url('/assets/dola.png')`} h="50px" w="80px" />}
        >
            <VStack position="relative" w='full' px='2%' py="2" alignItems="center" spacing="0">
                <F2FormInfos
                    newPerc={newPerc}
                    riskColor={riskColor}
                    isFormFilled={isFormFilled}
                    newLiquidationPrice={newLiquidationPrice}
                    f2market={f2market}
                    dbrCoverDebt={dbrCoverDebt}
                    dbrCover={dbrCover}
                    duration={duration}
                    dbrPrice={dbrPrice}
                    newDailyDBRBurn={newDailyDBRBurn}
                    newDBRExpiryDate={newDBRExpiryDate}
                    onHealthOpen={onHealthOpen}
                    onDbrOpen={onDbrOpen}
                />
                <Divider borderColor="#cccccc66" />
                {bottomPart}
            </VStack>
        </Container>
    </Stack>
}