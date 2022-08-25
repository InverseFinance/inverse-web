import { VStack, Text, HStack, Slider, SliderTrack, SliderFilledTrack, SliderThumb, SliderMark, Divider, TextProps } from '@chakra-ui/react'
import { UnderlyingItemBlock } from '@app/components/common/Assets/UnderlyingItemBlock'
import Container from '@app/components/common/Container'
import { getBnToNumber, shortenNumber } from '@app/util/markets'
import { SimpleAmountForm } from '@app/components/common/SimpleAmountForm'
import { F2Market } from '@app/types'
import { JsonRpcSigner } from '@ethersproject/providers'
import { f2borrow, f2repay } from '@app/util/f2'
import { BigNumber } from 'ethers'
import { useBalances } from '@app/hooks/useBalances'
import { useAccountDBR, useAccountDBRMarket } from '@app/hooks/useDBR'
import { getNetworkConfigConstants } from '@app/util/networks'
import { roundFloorString } from '@app/util/misc'
import { parseEther } from '@ethersproject/units'
import { useEffect, useState } from 'react'
import { InfoMessage } from '@app/components/common/Messages'

const { DOLA } = getNetworkConfigConstants();

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

export const F2BorrowForm = ({
    f2market,
    account,
    signer,
    isBorrowDefault = true,
    isAdvancedMode = true,
    onAmountChange,
}: {
    f2market: F2Market
    account: string | null | undefined
    signer: JsonRpcSigner | undefined
    isBorrowDefault?: boolean
    isAdvancedMode?: boolean
    onAmountChange?: (v: number) => void
}) => {
    const [isBorrow, setIsBorrow] = useState(isBorrowDefault);
    const [amount, setAmount] = useState(0);
    const [duration, setDuration] = useState(365);
    const colDecimals = f2market.underlying.decimals;

    const { balance: dbrBalance, debt, bnDebt } = useAccountDBR(account);
    const { withdrawalLimit, deposits, debt: marketDebt } = useAccountDBRMarket(f2market, account);

    const { balances: marketBnBalances } = useBalances([DOLA], 'balanceOf', f2market.address);
    const { balances: dolaBalances } = useBalances([DOLA], 'balanceOf');
    const dolaBalance = dolaBalances ? getBnToNumber(dolaBalances[DOLA]) : 0;
    const bnDolaBalance = dolaBalances ? dolaBalances[DOLA] : BigNumber.from('0');

    const bnMarketDolaLiquidity = marketBnBalances ? marketBnBalances[DOLA] : BigNumber.from('0');
    const marketDolaLiquidity = marketBnBalances ? getBnToNumber(marketBnBalances[DOLA]) : 0;

    const creditLeft = withdrawalLimit * f2market?.price * f2market.collateralFactor / 100;
    const bnMaxNewBorrow = parseEther(roundFloorString(creditLeft || 0));

    const handleAction = (amount: BigNumber) => {
        if (!signer) { return }
        return isBorrow ?
            f2borrow(signer, f2market.address, amount)
            : f2repay(signer, f2market.address, amount)
    }

    const switchMode = () => {
        setIsBorrow(!isBorrow);
    }

    const handleAmountChange = (floatNumber: number) => {
        setAmount(floatNumber)
    }

    useEffect(() => {
        if (!onAmountChange) { return };
        onAmountChange(isBorrow ? amount : -amount);
    }, [isBorrow, amount, onAmountChange]);

    const btnlabel = !isAdvancedMode ? 'Deposit & Borrow' : isBorrow ? `Borrow` : 'Repay';
    const btnMaxlabel = `${btnlabel} Max`;
    const mainColor = 'lightPrimaryAlpha'//!isBorrow ? 'infoAlpha' : 'lightPrimaryAlpha';

    return <Container
        noPadding
        p="0"
        label={isBorrow ? `Borrow DOLA` : `Repay Borrowed DOLA debt`}
        description={isBorrow ? `Against your deposited collateral` : `This will improve the Collateral Health`}
        w={{ base: 'full', lg: '50%' }}
        contentBgColor={mainColor}
        right={
            (debt > 0 || !isBorrow) && <Text
                onClick={() => switchMode()}
                fontSize="14px"
                cursor="pointer"
                textDecoration="underline"
                color="secondaryTextColor"
                w='fit-content'>
                Switch to {isBorrow ? 'Repay' : 'Borrow'}
            </Text>
        }
    >
        <VStack justifyContent='space-between' w='full' minH={isAdvancedMode ? '300px' : 'fit-content'}>
            <VStack alignItems='flex-start' w='full'>
                <HStack w='full' justifyContent="space-between">
                    <Text>Borrow Asset:</Text>
                    <Text><UnderlyingItemBlock symbol={'DOLA'} /></Text>
                </HStack>
                <HStack w='full' justifyContent="space-between">
                    <Text>Your DOLA Balance:</Text>
                    <Text>{shortenNumber(dolaBalance, 2)}</Text>
                </HStack>
                <HStack w='full' justifyContent="space-between">
                    <Text>Your DOLA Debt in this Market:</Text>
                    <Text>{shortenNumber(marketDebt, 2)}</Text>
                </HStack>
                <HStack w='full' justifyContent="space-between">
                    <Text>Your Total DOLA debt:</Text>
                    <Text>{shortenNumber(debt, 2)}</Text>
                </HStack>
                {/* <HStack w='full' justifyContent="space-between">
                    <Text>Your DOLA Borrow Rights:</Text>
                    <Text>{shortenNumber(dbrBalance, 2)}</Text>
                </HStack> */}
                <HStack w='full' justifyContent="space-between">
                    <Text>Market's available DOLA liquidity:</Text>
                    <Text>{shortenNumber(marketDolaLiquidity, 2)}</Text>
                </HStack>
                {!isAdvancedMode && <Divider />}
                {
                    !isAdvancedMode &&
                    <VStack w='full' alignItems="flex-start" spacing="40px">
                        <Text fontWeight="bold">For how long do you want to lock-in a Fixed Rate?</Text>
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
                                <SliderTick left="25%" onClick={() => setDuration(180)}>6 Months</SliderTick>
                                <SliderTick left="50%" onClick={() => setDuration(365)}>12 Months</SliderTick>
                                <SliderTick left="75%" onClick={() => setDuration(545)}>18 Months</SliderTick>
                                <SliderTick left="100%" onClick={() => setDuration(730)}>24 Months</SliderTick>                             
                            </HStack>
                        </VStack>
                    </VStack>
                }
            </VStack>

            {
                (deposits > 0 && dbrBalance > 0) || !isAdvancedMode ?
                    <SimpleAmountForm
                        address={isBorrow ? f2market.collateral : DOLA}
                        destination={f2market.address}
                        signer={signer}
                        decimals={colDecimals}
                        maxAmountFrom={isBorrow ? [bnMarketDolaLiquidity, bnMaxNewBorrow] : [bnDolaBalance, bnDebt]}
                        onAction={({ bnAmount }) => handleAction(bnAmount)}
                        onMaxAction={({ bnAmount }) => handleAction(bnAmount)}
                        actionLabel={btnlabel}
                        maxActionLabel={btnMaxlabel}
                        onAmountChange={handleAmountChange}
                        // btnThemeColor={!isBorrow ? 'blue.600' : undefined}
                        showMaxBtn={!isBorrow}
                    />
                    : <>
                        {deposits === 0 && isAdvancedMode &&
                            <InfoMessage
                                alertProps={{ w: 'full' }}
                                title="No Collateral Deposited yet"
                                description={`Loans need to be covered by a collateral, please deposit some.`}
                            />
                        }
                        {dbrBalance === 0 && debt === 0 && isAdvancedMode &&
                            <InfoMessage
                                alertProps={{ w: 'full' }}
                                title="No DBR tokens"
                                description={`You need DBR tokens in your wallet to hold borrows over time`}
                            />
                        }
                    </>
            }
        </VStack>
    </Container>
}