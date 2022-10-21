import { Stack, VStack, Text, HStack, FlexProps, Divider, Switch, FormControl, FormLabel, Flex } from '@chakra-ui/react'
import Container from '@app/components/common/Container'
import { getNumberToBn, shortenNumber } from '@app/util/markets'
import { parseEther } from '@ethersproject/units'
import { SimpleAmountForm } from '@app/components/common/SimpleAmountForm'
import { f2borrow, f2CalcNewHealth, f2deposit, f2depositAndBorrow, f2repay, f2repayAndWithdraw, f2withdraw, getRiskColor } from '@app/util/f2'

import { useContext, useEffect, useState } from 'react'

import { F2DurationInput } from './F2DurationInput'
import { MarketImage } from '@app/components/common/Assets/MarketImage'
import { TOKENS } from '@app/variables/tokens'
import { getNetworkConfigConstants } from '@app/util/networks'
import { InfoMessage, WarningMessage } from '@app/components/common/Messages'
import { TextInfo } from '@app/components/common/Messages/TextInfo'
import { AmountInfos } from '@app/components/common/Messages/AmountInfos'
import { F2FormInfos } from './F2FormInfos'
import { NavButtons } from '@app/components/common/Button'
import Link from '@app/components/common/Link'
import { getDBRBuyLink } from '@app/util/f2'
import { F2MarketContext } from '../F2Contex'

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
    ...props
}: {
} & Partial<FlexProps>) => {
    const {
        colDecimals,
        market,
        handleDurationChange,
        handleDebtChange,
        handleCollateralChange,
        duration,
        durationType,
        durationTypedValue,
        collateralAmount,
        debtAmount,
        isDeposit,
        setIsDeposit,
        isAutoDBR,
        setIsAutoDBR,
        dbrPrice,
        maxBorrowable,
        signer,
        dbrCover,
        dbrCoverDebt,
        dbrBalance,
        newDailyDBRBurn,
        newDBRExpiryDate,
        mode,
        setMode,
        isWalkthrough,
        infoTab,
        deposits, bnDeposits, debt, bnWithdrawalLimit, perc, bnDolaLiquidity, bnCollateralBalance, collateralBalance, bnDebt,
        newPerc, newDeposits, newLiquidationPrice, newCreditLimit, newCreditLeft, newTotalDebt
    } = useContext(F2MarketContext);
    
    const [syncedMinH, setSyncedMinH] = useState('230px');    

    const deltaCollateral = isDeposit ? collateralAmount : -collateralAmount;
    const deltaDebt = isDeposit ? debtAmount : -debtAmount;

    const {
        newDebt
    } = f2CalcNewHealth(
        market,
        deposits,
        debt,
        deltaCollateral,
        deltaDebt,
        perc,
    );

    const hasCollateralChange = ['deposit', 'd&b', 'withdraw', 'r&w'].includes(MODES[mode]);
    const hasDebtChange = ['borrow', 'd&b', 'repay', 'r&w'].includes(MODES[mode]);
    const isBorrowCase = ['borrow', 'd&b'].includes(MODES[mode]);
    const isRepayCase = ['repay', 'r&w'].includes(MODES[mode]);

    const handleAction = () => {
        if (!signer) { return }
        const action = MODES[mode]
        if (['borrow'].includes(action) && isAutoDBR) {
            alert('AlphaPhase: auto-buying DBR is not supported yet, disable the option to proceed :)');
        }
        // else if (['withdraw', 'repay'].includes(action) && isAutoDBR) {
        //     alert('AlphaPhase: auto-selling DBR is not supported yet, disable the option to proceed :)');
        // } 
        else if (action === 'deposit') {
            return f2deposit(signer, market.address, getNumberToBn(collateralAmount, market.underlying.decimals));
        } else if (action === 'borrow') {
            return f2borrow(signer, market.address, getNumberToBn(debtAmount, market.underlying.decimals));
        } else if (action === 'withdraw') {
            return f2withdraw(signer, market.address, getNumberToBn(collateralAmount, market.underlying.decimals));
        } else if (action === 'repay') {
            return f2repay(signer, market.address, getNumberToBn(debtAmount, market.underlying.decimals));
        } else if(action === 'd&b' && !isAutoDBR && market.address !== '0xF80d8B7647E7CFd4E47B4C463cb8f2c3A9EfF710') {
            return f2depositAndBorrow(signer, market.address, getNumberToBn(collateralAmount, market.underlying.decimals), getNumberToBn(debtAmount));
        } else if(action === 'r&w' && market.address !== '0xF80d8B7647E7CFd4E47B4C463cb8f2c3A9EfF710') {
            return f2repayAndWithdraw(signer, market.address, getNumberToBn(debtAmount), getNumberToBn(collateralAmount, market.underlying.decimals));
        } else {
            alert('AlphaPhase: Contract is not implemented yet for this action');
        }
    }

    const handleDirectionChange = () => {
        const _isDeposit = !isDeposit;
        setIsDeposit(_isDeposit);
        setMode(_isDeposit ? inOptions[outOptions.indexOf(mode)] : outOptions[inOptions.indexOf(mode)]);
    }

    const resetForm = () => {
        handleDebtChange('');
        handleCollateralChange('');
    }

    useEffect(() => {
        const adapt = (reset = true) => {            
            if(reset && (infoTab === 'Summary' || !['Deposit & Borrow', 'Repay & Withdraw'].includes(mode))) {
                setSyncedMinH('230px');
            } else {
                const formHeight = document.getElementById('f2-combined-form')?.clientHeight;
                const recapHeight = document.getElementById('f2-recap-container')?.clientHeight;
                if(formHeight && recapHeight && Math.abs(formHeight - recapHeight) <= 50) {
                    setSyncedMinH(Math.max(formHeight, recapHeight));
                }
            }            
        }
        adapt(true);
        setTimeout(() => {
            adapt(false);
        }, 1)
    }, [market, mode, deposits, debt, dbrPrice, duration, collateralAmount, perc, isAutoDBR, isWalkthrough, infoTab]);

    const btnLabel = isDeposit ? `Deposit & Borrow` : 'Withdraw';
    const btnMaxlabel = `${btnLabel} Max`;
    const isFormFilled = true//(!!collateralAmount && !!debtAmount);
    const riskColor = !isFormFilled ? 'mainTextColor' : getRiskColor(newPerc);    

    const leftPart = <Stack direction={{ base: 'column' }} spacing="4" w='full' >
        {
            ['deposit', 'd&b', 'withdraw', 'r&w'].includes(MODES[mode]) && <VStack w='full' alignItems="flex-start">
                <TextInfo message="The more you deposit, the more you can borrow against">
                    <Text fontSize='18px' color="mainTextColor"><b>{isDeposit ? 'Deposit' : 'Withdraw'}</b> {market.underlying.symbol}:</Text>
                </TextInfo>
                {
                    deposits > 0 || isDeposit ? <>
                        <SimpleAmountForm
                            defaultAmount={collateralAmount}
                            address={market.collateral}
                            destination={market.address}
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
                            inputRight={<MarketImage pr="2" image={market.icon || market.underlying.image} size={25} />}
                            isError={isDeposit ? collateralAmount > collateralBalance : collateralAmount > deposits}
                        />
                        <AmountInfos label="Total Deposits" value={deposits} newValue={newDeposits} price={market.price} delta={deltaCollateral} textProps={{ fontSize: '14px' }} />
                    </>
                        : <Text>Nothing to withdraw</Text>
                }
            </VStack>
        }
        {['d&b', 'r&w'].includes(MODES[mode]) && <Divider borderColor="#cccccc66" />}
        {
            ['borrow', 'd&b', 'repay', 'r&w'].includes(MODES[mode]) && <VStack w='full' alignItems="flex-start">
                <TextInfo message="The amount of DOLA stablecoin you wish to borrow">
                    <Text fontSize='18px' color="mainTextColor"><b>{isDeposit ? 'Borrow' : 'Repay'}</b> DOLA:</Text>
                </TextInfo>
                {
                    debt > 0 || isDeposit ?
                        <>
                            <SimpleAmountForm
                                defaultAmount={debtAmount}
                                address={market.collateral}
                                destination={market.address}
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
                                isError={isDeposit ? debtAmount > 0 && newPerc < 1 : debtAmount > debt}
                            />
                            <AmountInfos
                                dbrCover={isAutoDBR ? isDeposit ? dbrCoverDebt : 0 : 0}
                                label="Total Debt"
                                value={debt}
                                newValue={newDebt}
                                delta={deltaDebt}
                                textProps={{ fontSize: '14px' }} />
                        </>
                        : <Text>Nothing to repay</Text>
                }
                {
                    isDeposit && <FormControl w='fit-content' display='flex' alignItems='center'>
                        <FormLabel fontWeight='normal' fontSize='14px' color='secondaryTextColor' htmlFor='auto-dbr' mb='0'>
                            Auto-{isDeposit ? 'buy' : 'sell'} DBR?
                        </FormLabel>
                        <Switch onChange={() => setIsAutoDBR(!isAutoDBR)} isChecked={isAutoDBR} id='auto-dbr' />
                    </FormControl>
                }
                {
                    isDeposit && !isAutoDBR && dbrBalance <= 0 &&
                    <InfoMessage
                        title="No DBRs in wallet"
                        alertProps={{ w: 'full' }}
                        description={
                            <Flex display="inline-block">
                                To borrow DOLA you need to <Link textDecoration="underline" color="accentTextColor" display="inline-block" href={getDBRBuyLink()} isExternal target="_blank">
                                    buy DBR tokens
                                </Link>
                                &nbsp;beforehand or use the auto-buy option
                            </Flex>
                        }
                    />
                }
            </VStack>
        }
    </Stack>

    const durationPart = <VStack spacing='4' w={{ base: '100%', lg: '100%' }}>
        <VStack w='full' alignItems="flex-start">
            <TextInfo message="This will lock-in a Borrow Rate for the desired duration by auto-buying DBR tokens, after the duration you can still keep the loan but at the expense of a higher debt and Borrow Rate.">
                <Text fontSize='18px' color="mainTextColor"><b>Duration</b> to cover:</Text>
            </TextInfo>
            <F2DurationInput
                onChange={handleDurationChange}
                defaultType={durationType}
                defaultValue={durationTypedValue}
            />
            <AmountInfos format={false} label="Duration in days" value={duration} textProps={{ fontSize: '14px' }} />
        </VStack>
    </VStack>

    const disabledConditions = {
        'deposit': collateralAmount <= 0,
        'borrow': duration <= 0 || debtAmount <= 0 || newPerc < 1 || (isDeposit && !isAutoDBR && dbrBalance <= 0) || !market.dolaLiquidity,
        'repay': debtAmount <= 0 || debtAmount > debt,
        'withdraw': collateralAmount <= 0 || collateralAmount > deposits || newPerc < 1,
    }
    disabledConditions['d&b'] = disabledConditions['deposit'] || disabledConditions['borrow']
    disabledConditions['r&w'] = disabledConditions['repay'] || disabledConditions['withdraw']

    const actionBtn = <HStack>
        <SimpleAmountForm
            defaultAmount={collateralAmount?.toString()}
            address={isRepayCase ? DOLA : market.collateral}
            destination={market.address}
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
        {actionBtn}
    </Stack>

    return <Stack
        direction={{ base: 'column', xl: 'row' }}
        w='full'
        spacing="4"
    >
        <Container
            noPadding
            p="0"
            w='full'
            contentProps={{ minH: syncedMinH, position: 'relative', id: 'f2-combined-form' }}
            {...props}
        >
            <FormControl boxShadow="0px 0px 2px 2px #ccccccaa" bg="primary.400" zIndex="1" borderRadius="10px" px="2" py="1" right="0" top="-20px" margin="auto" position="absolute" w='fit-content' display='flex' alignItems='center'>
                <FormLabel cursor="pointer" htmlFor='withdraw-mode' mb='0'>
                    Exit Mode?
                </FormLabel>
                <Switch isChecked={!isDeposit} onChange={handleDirectionChange} id='withdraw-mode' />
            </FormControl>
            <VStack position="relative" w='full' px='2%' py="2" alignItems="center" spacing="4">                
                <NavButtons
                    active={mode}
                    options={isDeposit ? inOptions : outOptions}
                    onClick={(v) => setMode(v)}
                />
                <Stack justify="space-between" w='full' spacing="4" direction={{ base: 'column' }}>
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
            </VStack>
        </Container>
        <Container
            noPadding
            w='full'
            contentProps={{ minH: syncedMinH, id: 'f2-recap-container' }}
            p="0"            
        >
            <VStack position="relative" w='full' px='2%' py="2" alignItems="center" justify="space-between" spacing="2">
                <F2FormInfos
                    mode={mode}
                    newPerc={newPerc}
                    riskColor={riskColor}
                    isFormFilled={isFormFilled}
                    newLiquidationPrice={newLiquidationPrice}
                    f2market={market}
                    dbrCoverDebt={dbrCoverDebt}
                    dbrCover={dbrCover}
                    duration={duration}
                    dbrPrice={dbrPrice}
                    newDailyDBRBurn={newDailyDBRBurn}
                    newDBRExpiryDate={newDBRExpiryDate}
                    // onHealthOpen={onHealthOpen}
                    // onDbrOpen={onDbrOpen}
                    collateralAmount={hasCollateralChange ? collateralAmount : 0}
                    debtAmount={hasDebtChange ? isDeposit ? debtAmount : Math.min(debtAmount, debt) : 0}
                    isDeposit={isDeposit}
                    deposits={deposits}
                    debt={debt}
                    newDeposits={newDeposits}
                    newTotalDebt={newTotalDebt}
                    newCreditLimit={newCreditLimit}
                    newCreditLeft={newCreditLeft}
                    dbrBalance={dbrBalance}
                    isAutoDBR={isAutoDBR}
                    maxBorrowable={maxBorrowable}
                    durationType={durationType}
                    durationTypedValue={durationTypedValue}
                />
                {
                    disabledConditions[MODES[mode]] && (!!debtAmount || !!collateralAmount) && newPerc < 1 &&
                    <WarningMessage
                        alertProps={{ w: 'full' }}
                        description="The resulting Collateral Health is too low to proceed"
                    />
                }
                {
                    !market.dolaLiquidity && isBorrowCase && <WarningMessage alertProps={{ w:'full' }} description="No DOLA liquidity at the moment" />
                }
                {
                    isBorrowCase && market.dolaLiquidity > 0 && deltaDebt > 0 && market.dolaLiquidity < deltaDebt && <WarningMessage alertProps={{ w:'full' }} description="Not enough DOLA liquidity" />
                }
                {bottomPart}
            </VStack>
        </Container>
    </Stack>
}