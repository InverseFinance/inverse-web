import { Stack, VStack, Text, HStack, FlexProps, Divider, Switch, FormControl, FormLabel, Flex, useMediaQuery, Badge, useDisclosure } from '@chakra-ui/react'
import Container from '@app/components/common/Container'
import { getBnToNumber, getNumberToBn, shortenNumber } from '@app/util/markets'
import { formatUnits, parseEther, parseUnits } from '@ethersproject/units'
import { SimpleAmountForm } from '@app/components/common/SimpleAmountForm'
import { f2repayAndWithdrawNative, f2borrow, f2deposit, f2depositAndBorrow, f2depositAndBorrowHelper, f2repay, f2repayAndWithdraw, f2sellAndRepayHelper, f2sellAndWithdrawHelper, f2withdraw, getRiskColor, f2approxDbrAndDolaNeeded } from '@app/util/f2'

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
import { F2MarketContext } from '../F2Contex'
import WethModal from '@app/components/common/Modal/WethModal'
import { roundFloorString } from '@app/util/misc'
import { BUY_LINKS } from '@app/config/constants'
import { Input } from '@app/components/common/Input'

const { DOLA, F2_HELPER, DBR } = getNetworkConfigConstants();

const dolaToken = TOKENS[DOLA];
const dbrToken = TOKENS[DBR];

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
        collateralAmountNum,
        debtAmountNum,
        deltaCollateral,
        deltaDebt,
        isDeposit,
        setIsDeposit,
        isAutoDBR,
        setIsAutoDBR,
        isUseNativeCoin,
        setIsUseNativeCoin,
        dbrPrice,
        maxBorrowable,
        signer,
        dbrCover,
        dbrCoverDebt,
        dbrBalance,
        bnDbrBalance,
        newDailyDBRBurn,
        newDBRExpiryDate,
        mode,
        setMode,
        isWalkthrough,
        infoTab,
        dolaBalance,
        bnDolaBalance,
        riskColor,
        isWethMarket,
        dbrSellAmount,
        setDbrSellAmount,
        dbrBuySlippage,
        setDbrBuySlippage,
        deposits, bnDeposits, debt, bnWithdrawalLimit, perc, bnDolaLiquidity, bnLeftToBorrow, bnCollateralBalance, collateralBalance, bnDebt,
        newPerc, newDeposits, newLiquidationPrice, newCreditLimit, newCreditLeft, newTotalDebt
    } = useContext(F2MarketContext);

    const [syncedMinH, setSyncedMinH] = useState('230px');
    const [isLargerThan] = useMediaQuery('(min-width: 1280px)');
    const { isOpen, onOpen, onClose } = useDisclosure();

    const hasCollateralChange = ['deposit', 'd&b', 'withdraw', 'r&w'].includes(MODES[mode]);
    const hasDebtChange = ['borrow', 'd&b', 'repay', 'r&w'].includes(MODES[mode]);
    const isBorrowCase = ['borrow', 'd&b'].includes(MODES[mode]);
    const isRepayCase = ['repay', 'r&w'].includes(MODES[mode]);
    const isBorrowOnlyCase = 'borrow' === MODES[mode];
    const isWithdrawOnlyCase = 'withdraw' === MODES[mode];

    const handleAction = async () => {
        if (!signer) { return }
        const action = MODES[mode]
        let dbrNeeded, dolaNeededForDbr, maxDolaIn;
        if (isAutoDBR || isUseNativeCoin) {
            const approx = await f2approxDbrAndDolaNeeded(signer, parseUnits(debtAmount), duration);
            dolaNeededForDbr = approx[0];
            dbrNeeded = approx[1];
            const slippage = parseFloat(dbrBuySlippage)+100;
            maxDolaIn = dolaNeededForDbr.mul(slippage).div(100)
        }
        if (action === 'deposit') {
            return f2deposit(signer, market.address, parseUnits(collateralAmount, market.underlying.decimals), isUseNativeCoin);
        } else if (action === 'borrow') {
            if (isAutoDBR) {
                return f2depositAndBorrowHelper(
                    signer,
                    market.address,
                    parseUnits('0', market.underlying.decimals),
                    parseUnits(debtAmount),
                    maxDolaIn,
                    duration,
                    false,
                    true,
                );
            }
            return f2borrow(signer, market.address, parseUnits(debtAmount));
        } else if (action === 'withdraw') {
            return f2withdraw(signer, market.address, parseUnits(collateralAmount, market.underlying.decimals), isUseNativeCoin);
        } else if (action === 'repay') {
            if (isAutoDBR) {
                const minDolaOut = getNumberToBn((parseFloat(dbrSellAmount) * dbrPrice) * 0.96);
                const dbrAmountToSell = parseUnits(dbrSellAmount);
                return f2sellAndRepayHelper(signer, market.address, parseUnits(debtAmount), minDolaOut, dbrAmountToSell);
            }
            return f2repay(signer, market.address, parseUnits(debtAmount));
        } else if (action === 'd&b') {
            if (isAutoDBR || isUseNativeCoin) {
                return f2depositAndBorrowHelper(
                    signer,
                    market.address,
                    parseUnits(collateralAmount, market.underlying.decimals),
                    parseUnits(debtAmount),
                    maxDolaIn,
                    isAutoDBR ? duration : 0,
                    isUseNativeCoin,
                );
            }
            return f2depositAndBorrow(signer, market.address, parseUnits(collateralAmount, market.underlying.decimals), parseUnits(debtAmount));
        } else if (action === 'r&w') {
            if (isAutoDBR || isUseNativeCoin) {
                if (!isAutoDBR) {
                    return f2repayAndWithdrawNative(signer, market.address, parseUnits(debtAmount), parseUnits(collateralAmount, market.underlying.decimals));
                }
                const minDolaOut = getNumberToBn((parseFloat(dbrSellAmount) * dbrPrice) * 0.96);
                const dbrAmountToSell = parseUnits(dbrSellAmount);
                return f2sellAndWithdrawHelper(signer, market.address, parseUnits(debtAmount), parseUnits(collateralAmount, market.underlying.decimals), minDolaOut, dbrAmountToSell, isUseNativeCoin);
            }
            return f2repayAndWithdraw(signer, market.address, parseUnits(debtAmount), parseUnits(collateralAmount, market.underlying.decimals));
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
        setDbrSellAmount('');
    }

    useEffect(() => {
        const adapt = (reset = true) => {
            if (reset && (infoTab === 'Summary' || !['Deposit & Borrow', 'Repay & Withdraw'].includes(mode))) {
                setSyncedMinH('230px');
            } else {
                const formHeight = document.getElementById('f2-combined-form')?.clientHeight;
                const recapHeight = document.getElementById('f2-recap-container')?.clientHeight;
                if (formHeight && recapHeight && Math.abs(formHeight - recapHeight) <= 50) {
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

    const leftPart = <Stack direction={{ base: 'column' }} spacing="4" w='full' >
        {
            ['deposit', 'd&b', 'withdraw', 'r&w'].includes(MODES[mode]) && <VStack w='full' alignItems="flex-start">
                <TextInfo message={
                    isDeposit ?
                        "The more you deposit, the more you can borrow against"
                        : "Withdrawing collateral will reduce borrowing power"
                }>
                    <Text fontSize='18px' color="mainTextColor"><b>{isDeposit ? 'Deposit' : 'Withdraw'}</b> {isWethMarket && isUseNativeCoin ? 'ETH' : market.underlying.symbol}:</Text>
                </TextInfo>
                {
                    deposits > 0 || isDeposit ? <>
                        <SimpleAmountForm
                            defaultAmount={collateralAmount}
                            address={isUseNativeCoin ? '' : market.collateral}
                            destination={isAutoDBR ? F2_HELPER : market.address}
                            signer={signer}
                            decimals={colDecimals}
                            maxAmountFrom={isDeposit ? isUseNativeCoin ? undefined : [bnCollateralBalance] : [bnDeposits].concat(isWithdrawOnlyCase ? [bnWithdrawalLimit] : [])}
                            onAction={handleAction}
                            onMaxAction={handleAction}
                            actionLabel={btnLabel}
                            maxActionLabel={btnMaxlabel}
                            onAmountChange={handleCollateralChange}
                            showMaxBtn={isDeposit || !debt}
                            hideInputIfNoAllowance={false}
                            hideButtons={true}
                            showBalance={isDeposit}
                            inputRight={<MarketImage pr="2" image={isWethMarket ? (isUseNativeCoin ? market.icon : market.underlying.image) : market.icon || market.underlying.image} size={25} />}
                            isError={isDeposit ? collateralAmountNum > collateralBalance : collateralAmountNum > deposits}
                        />
                        {
                            isWethMarket && !!market.helper && <HStack w='full' justify="space-between">
                                <Text
                                    color="secondaryTextColor"
                                    textDecoration="underline"
                                    cursor="pointer"
                                    onClick={onOpen}
                                    fontSize="14px"
                                >
                                    Easily convert between ETH to WETH
                                </Text>
                                <FormControl w='fit-content' display='flex' alignItems='center'>
                                    <FormLabel fontWeight='normal' fontSize='14px' color='secondaryTextColor' htmlFor='auto-eth' mb='0'>
                                        Use ETH instead of WETH?
                                    </FormLabel>
                                    <Switch onChange={() => setIsUseNativeCoin(!isUseNativeCoin)} isChecked={isUseNativeCoin} id='auto-eth' />
                                </FormControl>
                            </HStack>
                        }
                        {/* <AmountInfos label="Total Deposits" value={deposits} price={market.price} delta={deltaCollateral} textProps={{ fontSize: '14px' }} /> */}
                    </>
                        : <Text>Nothing to withdraw</Text>
                }
                {
                    dbrBalance < 0 && !isDeposit && <WarningMessage
                        alertProps={{ w: 'full' }}
                        description="Can not withdraw when there is a DBR deficit"
                    />
                }
                {
                    !isDeposit && deposits > 0 && <HStack w='full' justify="space-between">
                        <AmountInfos
                            label="Deposits"
                            value={deposits}
                            price={market.price}
                            textProps={{
                                cursor: 'pointer',
                                fontSize: '14px',
                                onClick: () => handleCollateralChange(formatUnits(bnDeposits, market.underlying.decimals))
                            }}
                        />
                    </HStack>
                }
            </VStack>
        }
        {['d&b', 'r&w'].includes(MODES[mode]) && <Divider borderColor="#cccccc66" />}
        {
            ['borrow', 'd&b', 'repay', 'r&w'].includes(MODES[mode]) && <VStack w='full' alignItems="flex-start">
                <TextInfo
                    message={
                        `The amount of DOLA stablecoin you wish to ${isDeposit ? 'borrow' : 'repay'}`
                    }
                >
                    <Text fontSize='18px' color="mainTextColor"><b>{isDeposit ? 'Borrow' : 'Repay'}</b> DOLA:</Text>
                </TextInfo>
                {
                    (debt > 0 || isDeposit) && ((deposits > 0 && isBorrowOnlyCase) || !isBorrowOnlyCase) ?
                        <>
                            <SimpleAmountForm
                                defaultAmount={debtAmount}
                                address={market.collateral}
                                destination={isAutoDBR ? F2_HELPER : market.address}
                                signer={signer}
                                decimals={18}
                                maxAmountFrom={isDeposit ? [bnLeftToBorrow, parseEther((newCreditLimit * 0.99).toFixed(0))] : [bnDebt, bnDolaBalance]}
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
                                isError={isDeposit ? debtAmountNum > 0 && newPerc < 1 : debtAmountNum > debt}
                            />
                            {
                                !isDeposit && <HStack w='full' justify="space-between">
                                    <AmountInfos
                                        label="Debt"
                                        value={debt}
                                        textProps={{
                                            cursor: 'pointer',
                                            fontSize: '14px',
                                            onClick: () => handleDebtChange(formatUnits(bnDebt, 18))
                                        }}
                                    />
                                    <AmountInfos
                                        label="DOLA balance"
                                        value={dolaBalance}
                                        textProps={{
                                            cursor: 'pointer',
                                            fontSize: '14px',
                                            onClick: () => handleDebtChange(formatUnits(bnDolaBalance, 18))
                                        }}
                                    />
                                </HStack>
                            }
                        </>
                        : isBorrowOnlyCase ? <Text>Please deposit collateral first</Text> : <Text>Nothing to repay</Text>
                }
                {
                    isBorrowCase && market.leftToBorrow > 0 && deltaDebt > 0 && market.leftToBorrow < deltaDebt
                    && <WarningMessage alertProps={{ w: 'full' }} description={
                        `Only ${shortenNumber(market.leftToBorrow, 2)} DOLA are available for borrowing at the moment`
                    } />
                }
                {
                    isDeposit && !isAutoDBR && dbrBalance <= 0 &&
                    <InfoMessage
                        title="No DBRs in wallet"
                        alertProps={{ w: 'full' }}
                        description={
                            <Flex display="inline-block">
                                To borrow DOLA you need to first <Link textDecoration="underline" color="accentTextColor" display="inline-block" href={BUY_LINKS.DBR} isExternal target="_blank">
                                    buy DBR tokens
                                </Link> OR use the auto-buy option which adds the DBR cost to your DOLA loan.
                            </Flex>
                        }
                    />
                }
                {
                    (hasDebtChange || hasCollateralChange) && <FormControl w='fit-content' display='flex' alignItems='center'>
                        <FormLabel fontWeight='normal' fontSize='14px' color='secondaryTextColor' htmlFor='auto-dbr' mb='0'>
                            Auto-{isDeposit ? 'buy' : 'sell'} DBR?
                        </FormLabel>
                        <Switch isDisabled={!market.helper} onChange={() => setIsAutoDBR(!isAutoDBR)} isChecked={isAutoDBR} id='auto-dbr' />
                        {
                            !market.helper && <Badge ml="2">
                                Coming soon
                            </Badge>
                        }
                    </FormControl>
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
            <HStack w='full' justify="space-between">
                <TextInfo
                    message="DBR price can vary while trying to buy, the max. slippage % allows to buy within a certain range, if out of range, tx will revert">
                    <Text>
                        DBR max. slippage %:
                    </Text>
                </TextInfo>
                <Input py="0" maxH="30px" w='90px' value={dbrBuySlippage} onChange={(e) => setDbrBuySlippage(e.target.value.replace(/[^0-9.]/, '').replace(/(?<=\..*)\./g, ''))} />
            </HStack>
            <InfoMessage
                alertProps={{ w: 'full', fontStyle: 'italic' }}
                description="NB: auto-buying DBR requires an additional signature step. The cost of DBR will be added to your DOLA debt."
            />
        </VStack>
    </VStack>

    const sellDbrAmountPart = <VStack spacing='4' w={{ base: '100%', lg: '100%' }}>
        <VStack w='full' alignItems="flex-start">
            <TextInfo message="Will auto-sell the specified amount of DBRs against DOLAs">
                <Text fontSize='18px' color="mainTextColor"><b>DBR</b> to sell:</Text>
            </TextInfo>
            <SimpleAmountForm
                defaultAmount={dbrSellAmount}
                address={DBR}
                destination={F2_HELPER}
                signer={signer}
                decimals={18}
                maxAmountFrom={[bnDbrBalance]}
                onAmountChange={setDbrSellAmount}
                approveLabel="Approve DBR for auto-selling"
                showMax={true}
                showMaxBtn={false}
                onlyShowApproveBtn={true}
                hideInputIfNoAllowance={true}
                inputRight={<MarketImage pr="2" image={dbrToken.image} size={25} />}
                // balance decreases if debt, calling with higher sell amount to contract is ok
                isError={dbrBalance < parseFloat(dbrSellAmount) * 1.01}
            />
            <InfoMessage
                alertProps={{ w: 'full', fontStyle: 'italic' }}
                description="NB: auto-selling DBR requires an additional signature step. The DOLA received from the swap will be sent to your wallet."
            />
        </VStack>
    </VStack>

    const disabledConditions = {
        'deposit': collateralAmountNum <= 0,
        'borrow': duration <= 0 || debtAmountNum <= 0 || newPerc < 1 || (isDeposit && !isAutoDBR && dbrBalance <= 0) || !market.leftToBorrow,
        'repay': debtAmountNum <= 0 || debtAmountNum > debt || debtAmountNum > dolaBalance || (isAutoDBR && !parseFloat(dbrSellAmount)),
        'withdraw': collateralAmountNum <= 0 || collateralAmountNum > deposits || newPerc < 1 || dbrBalance < 0,
    }
    disabledConditions['d&b'] = disabledConditions['deposit'] || disabledConditions['borrow'] || !parseFloat(dbrBuySlippage);
    disabledConditions['r&w'] = disabledConditions['repay'] || disabledConditions['withdraw']

    const actionBtn = <HStack>
        <SimpleAmountForm
            defaultAmount={collateralAmount}
            address={isRepayCase ? DOLA : isUseNativeCoin ? '' : market.collateral}
            destination={isAutoDBR || isUseNativeCoin ? F2_HELPER : market.address}
            signer={signer}
            decimals={colDecimals}
            maxAmountFrom={isDeposit ? [bnCollateralBalance] : [bnDeposits, bnWithdrawalLimit]}
            onAction={({ bnAmount }) => handleAction(bnAmount)}
            onMaxAction={({ bnAmount }) => handleAction(bnAmount)}
            actionLabel={(isAutoDBR && hasDebtChange) || (isUseNativeCoin && hasCollateralChange) ? `Sign + ${mode}` : mode}
            approveLabel={isAutoDBR && isDeposit ? 'Step 1/3 - Approve' : undefined}
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

    return <Stack
        direction={{ base: 'column', xl: 'row' }}
        w='full'
        spacing="4"
    >
        <WethModal isOpen={isOpen} onClose={onClose} />
        <Container
            noPadding
            p="0"
            w='full'
            contentProps={{ minH: syncedMinH, position: 'relative', id: 'f2-combined-form' }}
            {...props}
        >
            {
                (deposits > 0 || debt > 0 || !isDeposit) && <FormControl boxShadow="0px 0px 2px 2px #ccccccaa" bg="primary.400" zIndex="1" borderRadius="10px" px="2" py="1" right="0" top="-20px" margin="auto" position="absolute" w='fit-content' display='flex' alignItems='center'>
                    <FormLabel cursor="pointer" htmlFor='withdraw-mode' mb='0'>
                        Exit Mode?
                    </FormLabel>
                    <Switch isChecked={!isDeposit} onChange={handleDirectionChange} id='withdraw-mode' />
                </FormControl>
            }
            <VStack justify="space-between" position="relative" w='full' px='2%' py="2" alignItems="center" spacing="4">
                <NavButtons
                    active={mode}
                    options={isDeposit ? inOptions : outOptions}
                    onClick={(v) => setMode(v)}
                />
                <Stack justify="space-between" w='full' spacing="4" direction={{ base: 'column' }}>
                    {leftPart}
                    {['d&b', 'borrow'].includes(MODES[mode]) && isAutoDBR && <Divider borderColor="#cccccc66" />}
                    {['d&b', 'borrow'].includes(MODES[mode]) && isAutoDBR && durationPart}
                    {['r&w', 'repay'].includes(MODES[mode]) && isAutoDBR && sellDbrAmountPart}
                </Stack>
                {
                    collateralAmountNum > collateralBalance && isDeposit &&
                    <InfoMessage
                        alertProps={{ w: 'full' }}
                        description="Not Enough collateral to deposit"
                    />
                }
                <Divider />
                {actionBtn}
            </VStack>
        </Container>
        <Container
            noPadding
            w='full'
            contentProps={{ minH: syncedMinH, id: 'f2-recap-container', h: { base: 'auto', md: '100%' } }}
            p="0"
        >
            <VStack position="relative" w='full' px='2%' py="2" alignItems="center" justify="space-between" spacing="2">
                <F2FormInfos
                    collateralAmountNumInfo={hasCollateralChange ? collateralAmountNum : 0}
                    debtAmountNumInfo={hasDebtChange ? isDeposit ? debtAmountNum : Math.min(debtAmountNum, debt) : 0}
                />
                {
                    disabledConditions[MODES[mode]] && (!!debtAmountNum || !!collateralAmountNum) && newPerc < 1 &&
                    <WarningMessage
                        alertProps={{ w: 'full' }}
                        description="The resulting Borrow Limit is too high"
                    />
                }
                {
                    !market.leftToBorrow && isBorrowCase && <WarningMessage alertProps={{ w: 'full' }} description="No DOLA liquidity at the moment" />
                }
                {/* {bottomPart} */}
                {
                    !isLargerThan && actionBtn
                }
            </VStack>
        </Container>
    </Stack>
}