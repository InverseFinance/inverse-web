import { Flex, Stack, Text, VStack } from '@chakra-ui/react';
import { BONDS, RTOKEN_CG_ID } from '@app/variables/tokens';
import { SubmitButton } from '../common/Button';
import { UnderlyingItemBlock } from '@app/components/common/Assets/UnderlyingItemBlock';
import Link from '@app/components/common/Link';
import { useAnchorPricesUsd, usePrices } from '@app/hooks/usePrices';
import { getNetworkConfigConstants } from '@app/util/networks';
import { shortenNumber } from '@app/util/markets';
import Container from '@app/components/common/Container';
import { useBonds } from '@app/hooks/useBonds';

const { XINV } = getNetworkConfigConstants()

export const BondForm = () => {
    const { prices: oraclePrices } = useAnchorPricesUsd();
    const { prices: cgPrices } = usePrices();
    const { bondPrices, bondTerms } = useBonds();

    const invOraclePrice = oraclePrices && oraclePrices[XINV];
    const invCgPrice = cgPrices && cgPrices[RTOKEN_CG_ID]?.usd;

    return (
        <Stack w='full' color="white">
            <Container label="INV Market Price">
                <VStack w="full" justify="space-between">
                    <Flex w='full' pt="2" justify="space-between">
                        <Text>
                            Oracle Market Price: <b>{shortenNumber(invOraclePrice, 2, true)}</b>
                        </Text>
                        <Text>
                            Coingecko Market Price: <b>{shortenNumber(invCgPrice, 2, true)}</b>
                        </Text>
                    </Flex>
                    <Text fontWeight="bold">
                        The Oracle Price is used for the bonding calculations, the coingecko price is only shown for convenience.
                    </Text>
                </VStack>
            </Container>

            <Container
                noPadding
                label="Bonds"
            >
                <VStack w='full'>
                    {/* <Stack direction="row" w='full' alignItems="start" justify="space-between">
                        <Flex w="200px">Bond</Flex>
                        <Flex textAlign="left">Payout</Flex>
                        <Flex>ROI</Flex>
                        <Flex></Flex>
                    </Stack> */}
                    {
                        BONDS.map((bond, i) => {
                            return <Stack direction="row" key={bond.input} w='full' justify="space-between">
                                <Flex w="200px" alignItems="center">
                                    <Link fontWeight="bold" textTransform="uppercase" textDecoration="underline" isExternal href={bond.howToGetLink}>
                                        <UnderlyingItemBlock symbol={bond.underlying.symbol!} nameAttribute="name" imgSize={'15px'} />
                                    </Link>
                                </Flex>
                                <Flex  alignItems="center">{shortenNumber(bondPrices[i], 2, true)}</Flex>
                                <Flex  alignItems="center">{shortenNumber((invOraclePrice / bondPrices[i]-1)*100, 2, false)}%</Flex>
                                <SubmitButton w='80px'>Bond</SubmitButton>
                            </Stack>
                        })
                    }
                </VStack>
            </Container>
        </Stack>
    )
}