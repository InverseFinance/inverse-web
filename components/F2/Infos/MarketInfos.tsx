import { VStack, Text, HStack } from '@chakra-ui/react'
import { UnderlyingItemBlock } from '@app/components/common/Assets/UnderlyingItemBlock'
import Container from '@app/components/common/Container'
import { getBnToNumber, shortenNumber } from '@app/util/markets'
import { commify } from '@ethersproject/units'
import { F2Market } from '@app/types'
import { BigNumber } from 'ethers'
import { useBalances } from '@app/hooks/useBalances'
import { useAccountDBRMarket, useDBRPrice } from '@app/hooks/useDBR'
import ScannerLink from '@app/components/common/ScannerLink'
import { BigImageButton } from '@app/components/common/Button/BigImageButton'

export const MarketInfos = ({
    market,
    account,
}: {
    market: F2Market
    account: string | null | undefined
}) => {
    const colDecimals = market.underlying.decimals;
    const { deposits, bnDeposits, debt, bnWithdrawalLimit, dola } = useAccountDBRMarket(market, account);
    const { balances } = useBalances([market.collateral]);
    const bnCollateralBalance = balances ? balances[market.collateral] : BigNumber.from('0');
    const collateralBalance = balances ? getBnToNumber(bnCollateralBalance, colDecimals) : 0;
    const { price: dbrPrice } = useDBRPrice();

    return <Container
        noPadding
        p="0"
        label={`${market.name}'s Market Infos`}
        description={<ScannerLink value={market.address} />}
        contentBgColor={'infoAlpha'}
        image={<BigImageButton bg={`url('/assets/f2/markets/${market.name}.png')`} h="50px" w="80px" />}
        w={{ base: 'full', lg: '50%' }}
    >
        <VStack justifyContent='space-between' w='full' minH="300px" justify="center">
            <HStack w='full' justifyContent="space-between">
                <Text color="secondaryTextColor">Collateral Name:</Text>
                <Text><UnderlyingItemBlock symbol={market?.underlying.symbol} /></Text>
            </HStack>
            <HStack w='full' justifyContent="space-between">
                <Text color="secondaryTextColor">Oracle Price:</Text>
                <Text>${commify(market.price.toFixed(2))}</Text>
            </HStack>
            <HStack w='full' justifyContent="space-between">
                <Text color="secondaryTextColor">Collateral Factor:</Text>
                <Text>{market.collateralFactor}%</Text>
            </HStack>
            <HStack w='full' justifyContent="space-between">
                <Text color="secondaryTextColor">Market's borrows:</Text>
                <Text>{shortenNumber(market.totalDebt, 2)} DOLAs</Text>
            </HStack>
            <HStack w='full' justifyContent="space-between">
                <Text color="secondaryTextColor">Market's DOLA liquidity:</Text>
                <Text>{shortenNumber(dola, 2)}</Text>
            </HStack>
            <HStack w='full' justifyContent="space-between">
                <Text color="secondaryTextColor">Your Balance:</Text>
                <Text>{shortenNumber(collateralBalance, 2)} ({shortenNumber(collateralBalance * market.price, 2, true)})</Text>
            </HStack>
            <HStack w='full' justifyContent="space-between">
                <Text color="secondaryTextColor">Your Deposits:</Text>
                <Text>{shortenNumber(deposits, 2)} ({shortenNumber(deposits * market.price, 2, true)})</Text>
            </HStack>
            <HStack w='full' justifyContent="space-between">
                <Text color="secondaryTextColor">Your Debt:</Text>
                <Text>{shortenNumber(debt, 2)} DOLAs</Text>
            </HStack>
            <HStack w='full' justifyContent="space-between">
                <Text fontWeight="bold" color="secondaryTextColor">Current Fixed Rate:</Text>
                <Text color="secondary" fontWeight="bold">{shortenNumber(dbrPrice * 100, 2)}%</Text>
            </HStack>
        </VStack>
    </Container>
}