import { VStack, Text, HStack } from '@chakra-ui/react'
import { UnderlyingItemBlock } from '@app/components/common/Assets/UnderlyingItemBlock'
import Container from '@app/components/common/Container'
import { getBnToNumber, shortenNumber } from '@app/util/markets'
import { commify } from '@ethersproject/units'
import { SimpleAmountForm } from '@app/components/common/SimpleAmountForm'
import { F2Market } from '@app/types'
import { JsonRpcSigner } from '@ethersproject/providers'
import { f2deposit, f2withdraw } from '@app/util/f2'
import { BigNumber } from 'ethers'
import { useBalances } from '@app/hooks/useBalances'
import { useAccountDBRMarket } from '@app/hooks/useDBR'
import { useEffect, useState } from 'react'

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
    const [collateralAmount, setCollateralAmount] = useState(0);
    const [isDeposit, setIsDeposit] = useState(isDepositDefault);

    const { deposits, bnDeposits, debt, bnWithdrawalLimit } = useAccountDBRMarket(f2market, account);
    const { balances } = useBalances([f2market.collateral]);
    const bnCollateralBalance = balances ? balances[f2market.collateral] : BigNumber.from('0');
    const collateralBalance = balances ? getBnToNumber(bnCollateralBalance, colDecimals) : 0;

    const handleAction = (amount: BigNumber) => {
        if (!signer) { return }
        return isDeposit ? 
            f2deposit(signer, f2market.address, amount)
            : f2withdraw(signer, f2market.address, amount)
    }

    const handleCollateralChange = (floatNumber: number) => {
        setCollateralAmount(floatNumber)
    }

    const switchMode = () => {
        setIsDeposit(!isDeposit);
    }

    useEffect(() => {
        if(!onDepositChange) { return };
        onDepositChange(isDeposit ? collateralAmount : -collateralAmount);
    }, [isDeposit, collateralAmount, onDepositChange]);

    useEffect(() => {
        if(!onDepositChange) { return };
        onDepositChange(isDeposit ? collateralAmount : -collateralAmount);
    }, [isDeposit, collateralAmount, onDepositChange]);

    const btnLabel = isDeposit ? `Deposit` : 'Withdraw';
    const btnMaxlabel = `${btnLabel} Max`;
    const mainColor = 'infoAlpha'

    return <Container
        noPadding
        p="0"
        label={`${btnLabel} Collateral and Borrow`}
        description={isDeposit ? `To be able to Borrow` : `This will reduce the Collateral Health`}
        contentBgColor={mainColor}
        right={
            (deposits > 0 || !isDeposit) && <Text
                onClick={() => switchMode()}
                fontSize="14px"
                cursor="pointer"
                textDecoration="underline"
                color="secondaryTextColor"
                w='fit-content'>
                Switch to {isDeposit ? 'Withdraw' : 'Deposit'}
            </Text>
        }
        w={{ base: 'full', lg: '50%' }}
    >
        <VStack justifyContent='space-between' w='full' minH="300px">
            <VStack alignItems='flex-start' w='full'>
                <HStack w='full' justifyContent="space-between">
                    <Text>Collateral Name:</Text>
                    <Text><UnderlyingItemBlock symbol={f2market?.underlying.symbol} /></Text>
                </HStack>

                <HStack w='full' justifyContent="space-between">
                    <Text>Oracle Price:</Text>
                    <Text>${commify(f2market.price.toFixed(2))}</Text>
                </HStack>
                <HStack w='full' justifyContent="space-between">
                    <Text>Your Balance:</Text>
                    <Text>{shortenNumber(collateralBalance, 2)} ({shortenNumber(collateralBalance * f2market.price, 2, true)})</Text>
                </HStack>
                <HStack w='full' justifyContent="space-between">
                    <Text>Your Deposits:</Text>
                    <Text>{shortenNumber(deposits, 2)} ({shortenNumber(deposits * f2market.price, 2, true)})</Text>
                </HStack>
                <HStack w='full' justifyContent="space-between">
                    <Text>Collateral Factor:</Text>
                    <Text>{f2market.collateralFactor}%</Text>
                </HStack>
            </VStack>
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
            />
        </VStack>
    </Container>
}