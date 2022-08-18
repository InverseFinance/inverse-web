import { VStack, Text, HStack } from '@chakra-ui/react'
import { UnderlyingItemBlock } from '@app/components/common/Assets/UnderlyingItemBlock'
import Container from '@app/components/common/Container'
import { getBnToNumber, shortenNumber } from '@app/util/markets'
import { commify } from '@ethersproject/units'
import { SimpleAmountForm } from '@app/components/common/SimpleAmountForm'
import { F2Market } from '@app/types'
import { JsonRpcSigner } from '@ethersproject/providers'
import { f2deposit } from '@app/util/f2'
import { BigNumber } from 'ethers'
import { useBalances } from '@app/hooks/useBalances'
import { useAccountDBRMarket } from '@app/hooks/useDBR'

export const F2CollateralForm = ({
    f2market,
    account,
    signer,
}: {
    f2market: F2Market
    account: string | null | undefined
    signer: JsonRpcSigner | undefined
}) => {
    const colDecimals = f2market.underlying.decimals;

    const { deposits } = useAccountDBRMarket(f2market, account);
    const { balances } = useBalances([f2market.collateral]);
    const collateralBalance = balances ? getBnToNumber(balances[f2market.collateral], colDecimals) : 0;

    const handleDeposit = (amount: BigNumber) => {
        if(!signer) { return }
        return f2deposit(signer, f2market.address, amount)
    }

    return <Container
        noPadding
        p="0"
        label="Deposit Collateral"
        description="To be able to Borrow"
        w={{ base: 'full', lg: '50%' }}
    >
        <VStack justifyContent='space-between' w='full' minH="270px">
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
                onAction={({ bnAmount }) => handleDeposit(bnAmount)}
                onMaxAction={({ bnAmount }) => handleDeposit(bnAmount)}
                actionLabel="Deposit"
                maxActionLabel="Deposit MAX"
            />
        </VStack>
    </Container>
}