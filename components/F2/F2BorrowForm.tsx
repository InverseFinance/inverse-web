import { VStack, Text, HStack } from '@chakra-ui/react'
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

const { DOLA } = getNetworkConfigConstants();

export const F2BorrowForm = ({
    f2market,
    account,
    signer,
    isBorrowDefault,
    onAmountChange,
}: {
    f2market: F2Market
    account: string | null | undefined
    signer: JsonRpcSigner | undefined
    isBorrowDefault?: boolean
    onAmountChange?: (v: number) => void
}) => {
    const [isBorrow, setIsBorrow] = useState(isBorrowDefault);
    const [amount, setAmount] = useState(0);
    const colDecimals = f2market.underlying.decimals;

    const { balance: dbrBalance, debt, bnDebt } = useAccountDBR(account);
    const { withdrawalLimit } = useAccountDBRMarket(f2market, account);

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
        if(!onAmountChange) { return };
        onAmountChange(isBorrow ? amount : -amount);
    }, [isBorrow, amount, onAmountChange]);

    const btnlabel = isBorrow ? `Borrow` : 'Repay';
    const btnMaxlabel = `${btnlabel} Max`;
    const mainColor = !isBorrow ? 'infoAlpha' : 'lightPrimaryAlpha';

    return <Container
        noPadding
        p="0"
        label={isBorrow ? `Borrow DOLA stablecoin` : `Repay Borrowed DOLA debt`}
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
        <VStack justifyContent='space-between' w='full' minH="270px">
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
                    <Text>Your DOLA Debt:</Text>
                    <Text>{shortenNumber(debt, 2)}</Text>
                </HStack>
                <HStack w='full' justifyContent="space-between">
                    <Text>Your DOLA Borrow Rights:</Text>
                    <Text>{shortenNumber(dbrBalance, 2)}</Text>
                </HStack>
                <HStack w='full' justifyContent="space-between">
                    <Text>Available DOLA liquidity:</Text>
                    <Text>{shortenNumber(marketDolaLiquidity, 2)}</Text>
                </HStack>
            </VStack>
            <SimpleAmountForm
                address={isBorrow ? f2market.collateral : DOLA}
                destination={f2market.address}
                signer={signer}
                decimals={colDecimals}
                isDisabled={false}
                maxAmountFrom={isBorrow ? [bnMarketDolaLiquidity, bnMaxNewBorrow] : [bnDolaBalance, bnDebt]}
                onAction={({ bnAmount }) => handleAction(bnAmount)}
                onMaxAction={({ bnAmount }) => handleAction(bnAmount)}
                actionLabel={btnlabel}
                maxActionLabel={btnMaxlabel}
                onAmountChange={handleAmountChange}
            />
        </VStack>
    </Container>
}