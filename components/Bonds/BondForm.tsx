import { Flex, Stack, Text, VStack } from '@chakra-ui/react';
import { RTOKEN_CG_ID } from '@app/variables/tokens';
import { SubmitButton } from '@app/components/common/Button';
import { UnderlyingItemBlock } from '@app/components/common/Assets/UnderlyingItemBlock';
import Link from '@app/components/common/Link';
import { useAnchorPricesUsd, usePrices } from '@app/hooks/usePrices';
import { getNetworkConfigConstants } from '@app/util/networks';
import { shortenNumber } from '@app/util/markets';
import Container from '@app/components/common/Container';
import { useBonds } from '@app/hooks/useBonds';
import { AnimatedInfoTooltip } from '@app/components/common/Tooltip';

const { XINV } = getNetworkConfigConstants();

const formatBondPrice = (bondPrice: number) => {
    return shortenNumber(bondPrice, 2, true);
}

const formatROI = (bondPrice: number, invOraclePrice: number) => {
    return `${shortenNumber((invOraclePrice / (bondPrice) - 1) * 100, 2, false)}%`;
}

const LocalTooltip = ({ children }) => <AnimatedInfoTooltip
    iconProps={{ ml: '2', fontSize: '12px' }}
    message={<>{children}</>}
/>

export const BondForm = () => {
    const { prices: oraclePrices } = useAnchorPricesUsd();
    const { prices: cgPrices } = usePrices();
    const { bonds } = useBonds();

    const invOraclePrice = oraclePrices && oraclePrices[XINV];
    const invCgPrice = cgPrices && cgPrices[RTOKEN_CG_ID]?.usd;

    return (
        <Stack w='full' color="white">
            <Container label="INV Market Price">
                <VStack w="full" justify="space-between">
                    <Text fontWeight="bold">
                        The Oracle Price is used for the bonding calculations, the coingecko price is only shown for convenience.
                    </Text>
                    <Flex w='full' pt="2" justify="space-between">
                        <Text>
                            Oracle Market Price: <b>{shortenNumber(invOraclePrice, 2, true)}</b>
                        </Text>
                        <Text>
                            Coingecko Market Price: <b>{shortenNumber(invCgPrice, 2, true)}</b>
                        </Text>
                    </Flex>
                </VStack>
            </Container>

            <Container
                noPadding
                label="Bonds"
                description="Get INV at a discount thanks to our partner Olympus Pro - Learn More about bonds"
                href="https://docs.inverse.finance/inverse-finance/providing-liquidity/olympus-pro-bonds"
            >
                <VStack w='full'>
                    <Stack direction="row" w='full' justify="space-between" fontWeight="bold">
                        <Flex w="200px" alignItems="center">
                            Asset to Bond With
                            <LocalTooltip>
                                This is the asset you give to get INV in exchange
                            </LocalTooltip>
                        </Flex>
                        <Flex w="80px" alignItems="center" textAlign="left">
                            Price
                            <LocalTooltip>
                                If the Bond Price is lower than INV's market price then there is a positive ROI allowing you to get INV at a discount
                            </LocalTooltip>
                        </Flex>
                        <Flex w="80px" justify="flex-end" alignItems="center">
                            ROI
                            <LocalTooltip>
                                A positive <b>Return On Investment</b> means you get INV at a
                                <Text display="inline-block" mx="1" fontWeight="bold" color="secondary">discount</Text>
                                compared to INV market price !
                            </LocalTooltip>
                        </Flex>
                        <Flex w='80px'></Flex>
                    </Stack>
                    {
                        bonds.map(bond => {
                            return <Stack direction="row" key={bond.input} w='full' justify="space-between" fontWeight="bold">
                                <Flex w="200px" alignItems="center">
                                    <Link textTransform="uppercase" textDecoration="underline" isExternal href={bond.howToGetLink}>
                                        <UnderlyingItemBlock symbol={bond.underlying.symbol!} nameAttribute="name" imgSize={'15px'} />
                                    </Link>
                                </Flex>
                                <Flex w="80px" alignItems="center">
                                    {formatBondPrice(bond.usdPrice)}
                                </Flex>
                                <Flex w="80px" justify="flex-end" alignItems="center" color={bond.positiveRoi ? 'secondary' : 'error'}>
                                    {formatROI(bond.usdPrice, invOraclePrice)}
                                </Flex>
                                <SubmitButton w='80px'>
                                    Bond
                                </SubmitButton>
                            </Stack>
                        })
                    }
                </VStack>
            </Container>
        </Stack>
    )
}