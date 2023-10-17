import { Stack, VStack, Text, HStack, FlexProps, Divider, Switch, FormControl, FormLabel, Flex, useMediaQuery, Badge, useDisclosure } from '@chakra-ui/react'
import Container from '@app/components/common/Container'
import { getNumberToBn, shortenNumber, smartShortNumber } from '@app/util/markets'
import { formatUnits, parseEther, parseUnits } from '@ethersproject/units'
import { SimpleAmountForm } from '@app/components/common/SimpleAmountForm'
import { f2repayAndWithdrawNative, f2borrow, f2deposit, f2depositAndBorrow, f2depositAndBorrowHelper, f2repay, f2repayAndWithdraw, f2sellAndRepayHelper, f2sellAndWithdrawHelper, f2withdraw, getRiskColor, f2approxDbrAndDolaNeeded, f2withdrawMax } from '@app/util/f2'

import { useContext, useState, useEffect } from 'react'

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
import { BUY_LINKS } from '@app/config/constants'
import { Input } from '@app/components/common/Input'
import { DBRAutoRepayCalculator } from '../DBRAutoRepayCalculator'

import { FirmLeverageModal } from '../Modals/FirmLeverageModal'
import { FEATURE_FLAGS } from '@app/config/features'
import { preciseCommify } from '@app/util/misc'
import { FirmBoostInfos, getLeverageImpact } from '../ale/FirmBoostInfos'
import { prepareDeleveragePosition, prepareLeveragePosition } from '@app/util/firm-ale'
import { removeTrailingZeros } from '@app/util/misc'
import { showToast } from '@app/util/notify'

const { DOLA, F2_HELPER, DBR, F2_ALE } = getNetworkConfigConstants();

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
        deltaDebt,
        isDeposit,
        setIsDeposit,
        isAutoDBR,
        setIsAutoDBR,
        isUseNativeCoin,
        setIsUseNativeCoin,
        dbrPrice,
        signer,
        dbrCoverDebt,
        dbrBalance,
        bnDbrBalance,
        mode,
        setMode,
        dolaBalance,
        bnDolaBalance,
        isWethMarket,
        dbrSellAmount,
        setDbrSellAmount,
        aleSlippage,
        setAleSlippage,
        dbrBuySlippage,
        setDbrBuySlippage,
        deposits, bnDeposits, debt, bnWithdrawalLimit, bnLeftToBorrow, bnCollateralBalance, collateralBalance, bnDebt,
        newPerc, newCreditLimit,
        notFirstTime, onFirstTimeModalOpen,
        hasDbrV1NewBorrowIssue, onDbrV1NewBorrowIssueModalOpen,
        firmActionIndex, setFirmActionIndex, setCachedFirmActionIndex,
        newTotalDebtInMarket,
        onFirmLeverageEngineOpen,
        setUseLeverage,
        useLeverage,
        useLeverageInMode,
        leverage,
        setLeverage,
        setLeverageCollateralAmount,
        leverageCollateralAmount,
        leverageCollateralAmountNum,
        setLeverageDebtAmount,
        leverageDebtAmount,
        leverageDebtAmountNum,
        dolaPrice,
        newTotalDebt,
        newDeposits,
    } = useContext(F2MarketContext);

    const [syncedMinH, setSyncedMinH] = useState('230px');
    const [isLargerThan] = useMediaQuery('(min-width: 1280px)');
    const { isOpen, onOpen, onClose } = useDisclosure();

    const hasCollateralChange = ['deposit', 'd&b', 'withdraw', 'r&w'].includes(MODES[mode]);
    const hasDebtChange = ['borrow', 'd&b', 'repay', 'r&w'].includes(MODES[mode]);
    const isDepositCase = ['deposit', 'd&b'].includes(MODES[mode]);
    const isBorrowCase = ['borrow', 'd&b'].includes(MODES[mode]);
    const isWithdrawCase = ['r&w', 'withdraw'].includes(MODES[mode]);
    const isRepayCase = ['repay', 'r&w'].includes(MODES[mode]);
    const isBorrowOnlyCase = 'borrow' === MODES[mode];
    const isWithdrawOnlyCase = 'withdraw' === MODES[mode];
    const isSigNeeded = useLeverageInMode || ((isBorrowCase || isWithdrawCase) && isAutoDBR) || ((isDepositCase || isWithdrawCase) && isUseNativeCoin);

    const handleWithdrawMax = () => {
        if (!signer) { return }
        return f2withdrawMax(signer, market.address);
    }

    const handleAction = async () => {
        if (!signer) { return }
        if (!notFirstTime && isBorrowCase) {
            const firstTimeAction = await onFirstTimeModalOpen();
            if (firstTimeAction !== 'continue') {
                return
            }
        }
        const action = MODES[mode]

        const minDolaOut = !isAutoDBR ? parseUnits('0') : getNumberToBn((parseFloat(dbrSellAmount || '0') * (dbrPrice * (1 - parseFloat(dbrBuySlippage) / 100))));
        const dbrAmountToSell = !isAutoDBR ? parseUnits('0') : parseUnits(dbrSellAmount || '0');

        if (action === 'deposit') {
            return f2deposit(signer, market.address, parseUnits(collateralAmount, market.underlying.decimals), isUseNativeCoin);
        } else if (action === 'borrow') {
            if (isAutoDBR) {
                return f2depositAndBorrowHelper(
                    signer,
                    market.address,
                    parseUnits('0', market.underlying.decimals),
                    parseUnits(debtAmount),
                    dbrBuySlippage,
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
                return f2sellAndRepayHelper(signer, market.address, parseUnits(debtAmount), minDolaOut, dbrAmountToSell);
            }
            return f2repay(signer, market.address, parseUnits(debtAmount));
        } else if (action === 'd&b') {
            if (useLeverageInMode) {
                return prepareLeveragePosition(
                    signer,
                    market,
                    parseUnits(debtAmount),
                    // deposit in addition to collateral increase due to leverage
                    parseUnits(collateralAmount || '0', market.underlying.decimals),
                    aleSlippage,
                    isAutoDBR ? dbrBuySlippage : undefined,
                    isAutoDBR ? duration : 0,
                );
            }
            else if (isAutoDBR || isUseNativeCoin) {
                return f2depositAndBorrowHelper(
                    signer,
                    market.address,
                    parseUnits(collateralAmount, market.underlying.decimals),
                    parseUnits(debtAmount),
                    dbrBuySlippage,
                    isAutoDBR ? duration : 0,
                    isUseNativeCoin,
                );
            }
            return f2depositAndBorrow(signer, market.address, parseUnits(collateralAmount, market.underlying.decimals), parseUnits(debtAmount));
        } else if (action === 'r&w') {
            if (useLeverageInMode) {
                return prepareDeleveragePosition(
                    signer,
                    market,
                    parseUnits(debtAmount || '0'),
                    // withdrawn by deleverage
                    parseUnits(collateralAmount || '0', market.underlying.decimals),
                    aleSlippage,
                    dbrAmountToSell,
                    minDolaOut,
                );
            }
            else if (isAutoDBR || isUseNativeCoin) {
                if (!isAutoDBR) {
                    return f2repayAndWithdrawNative(signer, market.address, parseUnits(debtAmount), parseUnits(collateralAmount, market.underlying.decimals));
                }
                return f2sellAndWithdrawHelper(signer, market.address, parseUnits(debtAmount), parseUnits(collateralAmount, market.underlying.decimals), minDolaOut, dbrAmountToSell, isUseNativeCoin);
            }
            return f2repayAndWithdraw(signer, market.address, parseUnits(debtAmount), parseUnits(collateralAmount, market.underlying.decimals));
        } else {
            alert('AlphaPhase: Contract is not implemented yet for this action');
        }
    }

    useEffect(() => {
        if (!useLeverage) return;
        if (!isDeposit) {
            triggerCollateralAndOrLeverageChange(leverageCollateralAmount, leverageCollateralAmountNum);
        } else {
            triggerDebtAndOrLeverageChange(leverageDebtAmount, leverageDebtAmountNum);
        }
    }, [isDeposit, useLeverage])

    const handleDirectionChange = () => {
        const _isDeposit = !isDeposit;
        setIsDeposit(_isDeposit);
        setMode(_isDeposit ? inOptions[outOptions.indexOf(mode)] : outOptions[inOptions.indexOf(mode)]);
    }

    const onSuccess = () => {
        resetForm();
        const newFirmActionIndex = firmActionIndex + 1;
        setCachedFirmActionIndex(newFirmActionIndex)
        setFirmActionIndex(newFirmActionIndex);
    }

    const resetForm = () => {
        handleDebtChange('');
        handleCollateralChange('');
        setDbrSellAmount('');
        setLeverageCollateralAmount('');
        setLeverageDebtAmount('');
        setUseLeverage(false);
        setLeverage(1);
    }

    const triggerCollateralAndOrLeverageChange = async (collateralString: string, collateralNum: number) => {
        handleCollateralChange(collateralString);
        if (useLeverageInMode && isDeleverageCase) {
            const desiredWorth = (deposits - collateralNum) * market.price;
            const leverage = (deposits * market.price) / desiredWorth;
            setLeverage(leverage);
            if (!market.price || leverage <= 1) return
            const { dolaAmount, errorMsg } = await getLeverageImpact({
                deposits, debt, leverageLevel: leverage, market, isUp: false, dolaPrice
            });
            if (!!errorMsg) {
                showToast({ status: 'warning', description: errorMsg, title: 'ZeroX api error' })
                return
            }
            setLeverageDebtAmount(Math.abs(dolaAmount).toFixed(2));
            // setLeverageCollateralAmount('');
        }
    }

    const triggerDebtAndOrLeverageChange = async (debtString: string, debtNum: number) => {
        handleDebtChange(debtString);
        if (useLeverageInMode && !isDeleverageCase && !!debtNum && debtNum > 0) {
            const baseColAmountForLeverage = deposits > 0 ? deposits : collateralAmountNum;
            const baseWorth = baseColAmountForLeverage * market.price;
            const leverage = (debtNum + baseWorth) / baseWorth;
            if (!market.price || leverage <= 1) return
            const { collateralAmount, errorMsg } = await getLeverageImpact({
                deposits, debt, leverageLevel: leverage, market, isUp: true, dolaPrice
            });
            if (!!errorMsg) {
                showToast({ status: 'warning', description: errorMsg, title: 'ZeroX api error' })
                return
            }
            setLeverageCollateralAmount(removeTrailingZeros(collateralAmount.toFixed(8)));
            setLeverage(leverage);
        }
    }

    const btnLabel = isDeposit ? `Deposit & Borrow` : 'Withdraw';
    const btnMaxlabel = `${btnLabel} Max`;
    const notEnoughToBorrowWithAutobuy = isBorrowCase && market.leftToBorrow > 1 && deltaDebt > 0 && market.leftToBorrow < (isAutoDBR ? deltaDebt + (dbrCoverDebt * (1 + parseFloat(dbrBuySlippage || 0) / 100)) : deltaDebt);
    const minDebtDisabledCondition = FEATURE_FLAGS.firmMinDebt && newTotalDebtInMarket > 0 && newTotalDebtInMarket < market.minDebt;
    const isDeleverageCase = useLeverageInMode && !isDeposit;
    const canUseLeverage = FEATURE_FLAGS.firmLeverage && !isUseNativeCoin && ((mode === 'Deposit & Borrow' && (deposits > 0 || collateralAmountNum > 0)) || (mode === 'Repay & Withdraw' && debt > 1));

    const leftPart = <Stack direction={{ base: 'column' }} spacing="4" w='full' >
        {
            ['deposit', 'd&b', 'withdraw', 'r&w'].includes(MODES[mode]) && <VStack w='full' alignItems="flex-start">
                <TextInfo message={
                    isDeposit ?
                        market.isInv ?
                            "Staked INV can be withdrawn at any time"
                            : "The more you deposit, the more you can borrow against"
                        : "Withdrawing collateral will reduce borrowing power"
                }>
                    <Text fontSize='18px' color="mainTextColor">
                        <b>{isDeposit ? market.isInv ? 'Stake' : 'Deposit' : market.isInv ? 'Unstake' : 'Withdraw'}</b> {isWethMarket && isUseNativeCoin ? 'ETH' : market.underlying.symbol}{useLeverageInMode ? isDeposit && deposits > 0 ? ` (on top of leverage)` : ' (with leverage)' : ''}:
                    </Text>
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
                            onAmountChange={(v, s) => {
                                triggerCollateralAndOrLeverageChange(v, s);
                            }}
                            showMaxBtn={isDeposit || !debt}
                            hideInputIfNoAllowance={false}
                            hideButtons={true}
                            showMax={!isDeleverageCase}
                            showBalance={isDeposit}
                            inputProps={isDeleverageCase ? { disabled: false } : undefined}
                            inputRight={<MarketImage pr="2" image={isWethMarket ? (isUseNativeCoin ? market.icon : market.underlying.image) : market.icon || market.underlying.image} size={25} />}
                            isError={isDeposit ? collateralAmountNum > collateralBalance : collateralAmountNum > deposits}
                        />
                        {
                            isWethMarket && !!market.helper && !isDeleverageCase && <HStack w='full' justify="space-between">
                                <Text
                                    color="secondaryTextColor"
                                    textDecoration="underline"
                                    cursor="pointer"
                                    onClick={onOpen}
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
                    !isDeposit && deposits > 0 && !isDeleverageCase && <HStack w='full' justify="space-between">
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
        <FirmLeverageModal />
        {
            ['borrow', 'd&b', 'repay', 'r&w'].includes(MODES[mode]) && <VStack w='full' alignItems="flex-start">
                <TextInfo
                    message={
                        `The amount of DOLA stablecoin you wish to ${isDeposit ? 'borrow' : 'repay'}`
                    }
                >
                    <Text fontSize='18px' color="mainTextColor"><b>{isDeposit ? 'Borrow' : 'Repay'}</b> DOLA{useLeverageInMode ? isDeposit ? ' (with leverage)' : ' (on top of leverage)' : ''}:</Text>
                </TextInfo>
                {
                    (debt > 0 || isDeposit) && ((deposits > 0 && isBorrowOnlyCase) || !isBorrowOnlyCase) ?
                        <>
                            <SimpleAmountForm
                                defaultAmount={isDeleverageCase ? '' : debtAmount}
                                address={market.collateral}
                                destination={isAutoDBR ? F2_HELPER : market.address}
                                signer={signer}
                                decimals={18}
                                maxAmountFrom={isDeposit ? [bnLeftToBorrow, parseEther((newCreditLimit * 0.99).toFixed(0))] : [bnDebt, bnDolaBalance]}
                                onAction={({ bnAmount }) => handleAction()}
                                onMaxAction={({ bnAmount }) => handleAction()}
                                actionLabel={btnLabel}
                                maxActionLabel={btnMaxlabel}
                                onAmountChange={(v, s) => {
                                    triggerDebtAndOrLeverageChange(v, s);
                                }}
                                showMax={!isDeleverageCase && !isDeposit}
                                showMaxBtn={!isDeposit}
                                hideInputIfNoAllowance={false}
                                hideButtons={true}
                                inputRight={<MarketImage pr="2" image={dolaToken.image} size={25} />}
                                isError={isDeposit ? debtAmountNum > 0 && newPerc < 1 : debtAmountNum > debt}
                            // inputProps={isDeleverageCase ? { disabled: true, placeholder: `Repay via deleverage: ~${debtAmount}` } : undefined}
                            />
                            {
                                isRepayCase ? <HStack w='full' justify="space-between">
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
                                    :
                                    <HStack w='full' justify="space-between">
                                        <AmountInfos
                                            label="Available DOLA"                                            
                                            value={market.leftToBorrow < 1 ? 0 : market.leftToBorrow}                                            
                                            textProps={{                                                
                                                fontSize: '14px',
                                                onClick: market.leftToBorrow > 1 ? () => handleDebtChange(formatUnits(bnLeftToBorrow, 18)) : undefined
                                            }}
                                        />                                       
                                    </HStack>
                            }
                        </>
                        : isBorrowOnlyCase ? <Text>Please deposit collateral first</Text> : <Text>Nothing to repay</Text>
                }
                {
                    notEnoughToBorrowWithAutobuy
                    && <WarningMessage alertProps={{ w: 'full' }} description={
                        `Only ${shortenNumber(market.leftToBorrow, 2)} DOLA are available for borrowing at the moment${isAutoDBR ? ` but around ${shortenNumber(dbrCoverDebt + deltaDebt, 2)} DOLA are needed to cover the debt (borrow amount+DBR auto-buy cost)` : ''}.`
                    } />
                }
                {
                    !notEnoughToBorrowWithAutobuy && minDebtDisabledCondition && debtAmountNum > 0
                    && <WarningMessage alertProps={{ w: 'full' }} description={
                        !debt ? `You need to borrow at least ${preciseCommify(market.minDebt, 0)} DOLA`
                            : `When borrowing the resulting debt should be at least ${shortenNumber(market.minDebt, 2)} DOLA`
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
                <HStack justify="space-between" alignItems="space-between" w='full'>
                    {
                        (hasDebtChange || hasCollateralChange) && <FormControl w='fit-content' display='flex' alignItems='center'>
                            <FormLabel w='110px' fontWeight='normal' fontSize='14px' color='secondaryTextColor' htmlFor='auto-dbr' mb='0'>
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
                    {
                        canUseLeverage && <FormControl w='fit-content' display='flex' alignItems='center'>
                            <FormLabel fontWeight='normal' fontSize='14px' color='secondaryTextColor' htmlFor='leverage-switch' mb='0'>
                                {isDeposit ? 'L' : 'Del'}everage?
                            </FormLabel>
                            <Switch onChange={() => setUseLeverage(!useLeverage)} isChecked={useLeverage} id='leverage-switch' />
                        </FormControl>
                    }
                </HStack>
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
                    message="DBR price can vary while trying to buy, the max. slippage % allows the resulting total DOLA debt created to be within a certain range, if out of range, tx will revert or fail">
                    <Text>
                        Max. slippage %:
                    </Text>
                </TextInfo>
                <Input py="0" maxH="30px" w='90px' value={dbrBuySlippage} onChange={(e) => setDbrBuySlippage(e.target.value.replace(/[^0-9.]/, '').replace(/(\..*)\./g, '$1'))} />
            </HStack>
            <InfoMessage
                alertProps={{ w: 'full', fontStyle: 'italic' }}
                description="Note: The cost of the auto-bought DBR will be added to your DOLA debt. Actual duration may vary a little bit due to DBR price fluctuations."
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
                destination={useLeverageInMode ? F2_ALE : F2_HELPER}
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
            <HStack w='full' justify="space-between">
                <TextInfo
                    message="DBR price can vary while trying to sell, the max. slippage % allows the resulting total DOLA received to be within a certain range, if out of range, tx will revert or fail">
                    <Text>
                        Max. slippage %:
                    </Text>
                </TextInfo>
                <Input py="0" maxH="30px" w='90px' value={dbrBuySlippage} onChange={(e) => setDbrBuySlippage(e.target.value.replace(/[^0-9.]/, '').replace(/(\..*)\./g, '$1'))} />
            </HStack>
            <InfoMessage
                alertProps={{ w: 'full', fontStyle: 'italic' }}
                description="Note: The DOLA received from the DBR swap will be sent to your wallet."
            />
        </VStack>
    </VStack>

    const disabledConditions = {
        'deposit': ((collateralAmountNum <= 0 && !useLeverageInMode) || collateralBalance < collateralAmountNum),
        'borrow': duration <= 0 || debtAmountNum <= 0 || newPerc < 1 || (isDeposit && !isAutoDBR && dbrBalance <= 0) || market.leftToBorrow < 1 || debtAmountNum > market.leftToBorrow || notEnoughToBorrowWithAutobuy || minDebtDisabledCondition,
        'repay': (debtAmountNum <= 0 && !useLeverageInMode) || debtAmountNum > debt || (debtAmountNum > dolaBalance && !useLeverageInMode) || (isAutoDBR && !parseFloat(dbrSellAmount)),
        'withdraw': ((collateralAmountNum <= 0 && !useLeverageInMode) || collateralAmountNum > deposits || newPerc < 1 || dbrBalance < 0),
    }
    disabledConditions['d&b'] = disabledConditions['deposit'] || disabledConditions['borrow'] || !parseFloat(dbrBuySlippage) || (useLeverageInMode && leverage <= 1);
    disabledConditions['r&w'] = disabledConditions['repay'] || disabledConditions['withdraw'] || (useLeverageInMode && leverage <= 1);

    const modeLabel = market.isInv ? mode.replace(/deposit/i, 'Stake').replace(/withdraw/i, 'Unstake') : mode;
    const actionBtnLabel = useLeverageInMode ? `Sign + ${collateralAmountNum > 0 && !isDeleverageCase ? 'Deposit & ' : ''}Leverage ${isDeposit ? 'up' : 'down'}` : isSigNeeded ? `Sign + ${modeLabel}` : modeLabel;

    const actionBtn = <HStack>
        <SimpleAmountForm
            defaultAmount={isRepayCase ? debtAmount : collateralAmount}
            address={isWithdrawOnlyCase || isBorrowOnlyCase ? '' : isRepayCase ? DOLA : isUseNativeCoin ? '' : market.collateral}
            destination={useLeverageInMode ? F2_ALE : isAutoDBR || isUseNativeCoin ? F2_HELPER : market.address}
            needApprove={!isDeleverageCase && !(useLeverageInMode && isDeposit && !collateralAmountNum)}
            signer={signer}
            decimals={colDecimals}
            maxAmountFrom={isDeposit ? [bnCollateralBalance] : [bnDeposits, bnWithdrawalLimit]}
            onAction={({ bnAmount }) => handleAction()}
            onMaxAction={({ bnAmount }) => handleWithdrawMax()}
            actionLabel={actionBtnLabel}
            approveLabel={(isAutoDBR || useLeverage) && isDeposit ? 'Step 1/3 - Approve' : undefined}
            maxActionLabel={'Unstake all'}
            onAmountChange={handleCollateralChange}
            showMaxBtn={market.isInv && isWithdrawCase && !debt}
            isDisabled={disabledConditions[MODES[mode]]}
            hideInputIfNoAllowance={false}
            hideInput={true}
            hideButtons={false}
            onSuccess={onSuccess}
            enableCustomApprove={true}
            inputProps={isDeleverageCase ? { disabled: true, placeholder: `Repay via deleverage: ~${debtAmount}` } : undefined}
            btnProps={{
                h: '50px',
                w: 'fit-content',
                fontSize: '18px',
                gaAction: 'FiRM-action-btn-standard',
                needPoaFirst: isDeposit,
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
                (deposits > 0 || debt > 0 || !isDeposit) && <FormControl boxShadow="0px 0px 1px 0px #ccccccaa" bg="primary.400" zIndex="1" borderRadius="10px" px="2" py="1" right="0" top="-20px" margin="auto" position="absolute" w='fit-content' display='flex' alignItems='center'>
                    <FormLabel cursor="pointer" htmlFor='withdraw-mode' mb='0'>
                        {market.isInv ? 'Unstake?' : 'Repay / Withdraw?'}
                    </FormLabel>
                    <Switch isChecked={!isDeposit} onChange={handleDirectionChange} id='withdraw-mode' />
                </FormControl>
            }
            <VStack justify="space-between" position="relative" w='full' px='2%' py="2" alignItems="center" spacing="4">
                <NavButtons
                    active={mode}
                    options={isDeposit ? inOptions : outOptions}
                    onClick={(v) => setMode(v)}
                    isStaking={market.isInv}
                />
                <Stack justify="space-between" w='full' spacing="4" direction={{ base: 'column' }}>
                    {leftPart}
                    {
                        useLeverageInMode && <FirmBoostInfos
                            type={isDeposit ? 'up' : 'down'}
                            onLeverageChange={({
                                dolaAmount, collateralAmount, isLeverageUp
                            }) => {
                                if (isLeverageUp) {
                                    handleDebtChange(Math.abs(dolaAmount).toFixed(2));
                                    setLeverageCollateralAmount(Math.abs(collateralAmount).toFixed(8));
                                } else {
                                    handleCollateralChange(Math.abs(collateralAmount).toFixed(8));
                                    setLeverageDebtAmount(Math.abs(dolaAmount).toFixed(2));
                                }
                            }}
                        />
                    }
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
                {
                    market.isInv && <>
                        <Divider />
                        <DBRAutoRepayCalculator
                            invStakedViaDistributor={market?.invStakedViaDistributor}
                            dbrYearlyRewardRate={market?.dbrYearlyRewardRate}
                            newTotalDebt={newTotalDebt}
                            newDeposits={newDeposits}
                            deposits={deposits}
                            handleCollateralChange={handleCollateralChange}
                        />
                    </>
                }
                <Divider />
                <HStack>
                    {actionBtn}
                </HStack>
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
                    market.borrowPaused ? <WarningMessage alertProps={{ w: 'full' }} description="Borrowing is paused" />
                        : market.leftToBorrow < 1 && isBorrowCase
                        && <WarningMessage alertProps={{ w: 'full' }} description="No DOLA liquidity at the moment" />
                }
                {/* {bottomPart} */}
                {
                    !isLargerThan && actionBtn
                }
            </VStack>
        </Container>
    </Stack>
}