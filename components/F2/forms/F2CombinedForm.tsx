import { Stack, VStack, Text, HStack, Slider, SliderTrack, SliderFilledTrack, SliderThumb, SliderMark, Popover, PopoverTrigger, PopoverArrow, PopoverContent, PopoverCloseButton, PopoverHeader, PopoverBody, TextProps } from '@chakra-ui/react'
import { UnderlyingItemBlock } from '@app/components/common/Assets/UnderlyingItemBlock'
import Container from '@app/components/common/Container'
import { getBnToNumber, shortenNumber } from '@app/util/markets'
import { commify, parseEther } from '@ethersproject/units'
import { SimpleAmountForm } from '@app/components/common/SimpleAmountForm'
import { F2Market } from '@app/types'
import { JsonRpcSigner } from '@ethersproject/providers'
import { f2CalcNewHealth, f2deposit, f2withdraw } from '@app/util/f2'
import { BigNumber } from 'ethers'
import { useBalances } from '@app/hooks/useBalances'
import { useAccountDBRMarket } from '@app/hooks/useDBR'
import { useEffect, useState } from 'react'
import { preciseCommify } from '@app/util/misc'
import { SettingsIcon } from '@chakra-ui/icons'
import { BigImageButton } from '@app/components/common/Button/BigImageButton'

const SliderTick = (props: Partial<TextProps>) => {
    return <Text
        _hover={{ color: 'mainTextColor' }}
        color="secondaryTextColor"
        transition="color 200ms"
        fontSize="sm"
        w="fit-content"
        whiteSpace="nowrap"
        transform="translateX(-50%)"
        cursor="pointer"
        position="absolute"
        {...props} />
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
    const [showOptions, setShowOptions] = useState(false);
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

    const switchMode = () => {
        setIsDeposit(!isDeposit);
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
    const mainColor = 'infoAlpha';
    const isFormFilled = !!collateralAmount && !!debtAmount;
    const riskColor = !isFormFilled ? 'secondaryTextColor' : (newPerc >= 75 ? 'success' : (newPerc >= 50 ? 'lightWarning' : (newPerc >= 25 ? 'warning' : 'error')));

    return <Container
        noPadding
        p="0"
        label={`Deposit Collateral and Borrow DOLA`}
        description={`Quick and Easy Fixed-Rate Borrowing`}
        contentBgColor={mainColor}
        image={<BigImageButton bg={`url('/assets/dola.png')`} h="50px" w="80px" />}
        right={
            <HStack>
                <Popover placement="bottom-start">
                    <PopoverTrigger>
                        <SettingsIcon />
                    </PopoverTrigger>
                    <PopoverContent minW="400px" maxW='98vw' className="blurred-container primary-bg" _focus={{}}>
                        <PopoverArrow bg="mainBackgroundColor" />
                        <PopoverCloseButton />
                        <PopoverHeader>Fixed-Rate loan Duration</PopoverHeader>
                        <PopoverBody >
                            <VStack w='full' alignItems="flex-start" spacing="40px">
                                <Text fontWeight="bold" fontSize="14px">For how long do you want to lock-in a Fixed Rate?</Text>
                                <VStack w='full' px="8">
                                    <Slider
                                        value={duration}
                                        onChange={(v: number) => setDuration(v)}
                                        min={1}
                                        max={730}
                                        step={1}
                                        aria-label='slider-ex-4'
                                        defaultValue={365}>
                                        <SliderMark
                                            value={duration}
                                            textAlign='center'
                                            bg='primary.500'
                                            color='white'
                                            mt='-45px'
                                            borderRadius="50px"
                                            transform="translateX(-50%)"
                                            w='100px'
                                        >
                                            {duration} days
                                        </SliderMark>
                                        <SliderTrack h="15px" bg='primary.100'>
                                            <SliderFilledTrack bg={'primary.200'} />
                                        </SliderTrack>
                                        <SliderThumb h="30px" />
                                    </Slider>
                                    <HStack py="2" w='full' position="relative">
                                        <SliderTick left="0%" onClick={() => setDuration(1)}>1 Day</SliderTick>
                                        {/* <SliderTick left="25%" onClick={() => setDuration(180)}>6 Months</SliderTick> */}
                                        <SliderTick left="50%" onClick={() => setDuration(365)}>12 Months</SliderTick>
                                        {/* <SliderTick left="75%" onClick={() => setDuration(545)}>18 Months</SliderTick> */}
                                        <SliderTick left="100%" onClick={() => setDuration(730)}>24 Months</SliderTick>
                                    </HStack>
                                </VStack>
                            </VStack>
                        </PopoverBody>
                    </PopoverContent>
                </Popover>
            </HStack>
        }
        w={{ base: 'full', lg: '50%' }}
    >
        <VStack w='full' spacing="8">
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
                    btnThemeColor={'blue.600'}
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
                    btnThemeColor={'blue.600'}
                    showMaxBtn={!isDeposit}
                    hideInputIfNoAllowance={false}
                    hideButtons={false}
                    isDisabled={newPerc < 1}
                />
                <Stack pt="2" w='full' justify="space-between" direction={{ base: 'column', lg: 'row' }}>
                    <Text color={riskColor} fontWeight={newPerc <= 25 ? 'bold' : undefined}>
                        Collateral Health: {isFormFilled ? `${shortenNumber(newPerc, 2)}%` : '-'}
                    </Text>
                    <Text color={riskColor} fontWeight={newPerc <= 25 ? 'bold' : undefined}>
                        Liquidation Price: {isFormFilled ? preciseCommify(newLiquidationPrice, 2, true) : '-'}
                    </Text>
                </Stack>
            </VStack>
        </VStack>
    </Container>
}