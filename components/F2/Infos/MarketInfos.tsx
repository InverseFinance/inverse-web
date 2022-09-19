import { VStack, Text, FlexProps, Stack } from '@chakra-ui/react'
import { UnderlyingItemBlock } from '@app/components/common/Assets/UnderlyingItemBlock'
import Container from '@app/components/common/Container'
import { getBnToNumber, shortenNumber } from '@app/util/markets'
import { commify } from '@ethersproject/units'
import { F2Market } from '@app/types'
import { BigNumber } from 'ethers'
import { useBalances } from '@app/hooks/useBalances'
import { useAccountDBRMarket, useDBRPrice } from '@app/hooks/useDBR'
import { BigImageButton } from '@app/components/common/Button/BigImageButton'
import { getScanner } from '@app/util/web3'
import { CHAIN_ID } from '@app/config/constants'

export const MarketInfos = ({
    market,
    account,
    ...props
}: {
    market: F2Market
    account: string | null | undefined
} & Partial<FlexProps>) => {
    const colDecimals = market.underlying.decimals;
    const { deposits, bnDeposits, debt, bnWithdrawalLimit, dolaLiquidity } = useAccountDBRMarket(market, account);
    const { balances } = useBalances([market.collateral]);
    const bnCollateralBalance = balances ? balances[market.collateral] : BigNumber.from('0');
    const collateralBalance = balances ? getBnToNumber(bnCollateralBalance, colDecimals) : 0;
    const { price: dbrPrice } = useDBRPrice();

    return <Container
        noPadding
        p="0"
        label={`${market.name}'s Market Infos`}
        description={'See Contract'}
        href={`${getScanner(CHAIN_ID)}/address/${market.address}`}
        contentBgColor={'infoAlpha'}
        image={<BigImageButton bg={`url('/assets/f2/markets/${market.name}.png')`} h="50px" w="80px" />}
        w='full'
        {...props}
    >
        <Stack spacing='4' p="2" px='4' direction={{ base: 'column', lg: 'row' }} justifyContent='space-between' w='full' justify="center">
            <Stack spacing='4' direction={{ base: 'column', sm: 'row', lg: 'column' }}>
                <Stack w='full' justifyContent="space-between">
                    <Text color="secondaryTextColor">Collateral Name:</Text>
                    <Text><UnderlyingItemBlock symbol={market?.underlying.symbol} /></Text>
                </Stack>
                <Stack w='full' justifyContent="space-between">
                    <Text color="secondaryTextColor">Oracle Price:</Text>
                    <Text>${commify(market.price.toFixed(2))}</Text>
                </Stack>
            </Stack>
            <Stack spacing='4' direction={{ base: 'column', sm: 'row', lg: 'column' }}>
                <Stack w='full' justifyContent="space-between">
                    <Text color="secondaryTextColor">Collateral Factor:</Text>
                    <Text>{market.collateralFactor * 100}%</Text>
                </Stack>
                <Stack w='full' justifyContent="space-between">
                    <Text color="secondaryTextColor">Liquidity:</Text>
                    <Text>{shortenNumber(dolaLiquidity, 2)} DOLA</Text>
                </Stack>
            </Stack>
            <Stack spacing='4' direction={{ base: 'column', sm: 'row', lg: 'column' }}>
                <Stack w='full' justifyContent="space-between">
                    <Text color="secondaryTextColor">Market's Borrows:</Text>
                    <Text>{shortenNumber(market.totalDebt, 2)} DOLAs</Text>
                </Stack>
                <Stack w='full' justifyContent="space-between">
                    <Text color="secondaryTextColor">Market's Deposits:</Text>
                    <Text>no contract func. yet</Text>
                </Stack>
            </Stack>
            <Stack spacing='4' direction={{ base: 'column', sm: 'row', lg: 'column' }}>
                <Stack w='full' justifyContent="space-between">
                    <Text color="secondaryTextColor">Your Deposits:</Text>
                    <Text>{shortenNumber(deposits, 2)} ({shortenNumber(deposits * market.price, 2, true)})</Text>
                </Stack>
                <Stack w='full' justifyContent="space-between">
                    <Text color="secondaryTextColor">Your Debt:</Text>
                    <Text>{shortenNumber(debt, 2)} DOLAs</Text>
                </Stack>
                {/* <Stack w='full' justifyContent="space-between">
                    <Text fontWeight="bold" color="secondaryTextColor">Current Fixed Rate:</Text>
                    <Text color="secondary" fontWeight="bold">{shortenNumber(dbrPrice * 100, 2)}%</Text>
                </Stack> */}
            </Stack>
        </Stack>
    </Container>
}