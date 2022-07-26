
import { useOppys } from '@app/hooks/useMarkets'
import { YieldOppy } from '@app/types';
import { shortenNumber } from '@app/util/markets';
import { HStack, Image, SimpleGrid, Text, VStack } from '@chakra-ui/react';
import Container from '@app/components/common/Container';

const templateColumns = "50px repeat(5, 1fr)"

export const OppysTable = ({ oppys }: { oppys: YieldOppy[] }) => {

    return <Container
        noPadding
        contentProps={{ p: { base: '2', sm: '8' } }}
        label="Yield Opportunities"
        contentBgColor="gradient3"
        description="Powered by Defi Llama"
    >
        <VStack w='full'>
            <SimpleGrid columns={6} w='full' fontSize="20px" fontWeight="extrabold" templateColumns={templateColumns}>
                <Text>#</Text>
                <Text>Pool</Text>
                <Text>Project</Text>
                <Text>Chain</Text>
                <Text>APY</Text>
                <Text>TVL</Text>
            </SimpleGrid>
            {
                oppys?.map((o, i) => {
                    return <SimpleGrid
                        templateColumns={templateColumns}
                        w='full'
                        fontSize="16px"
                        key={o.pool}
                        borderTop={{ base: i > 0 ? `1px solid #cccccc33` : 'none', sm: `1px solid #cccccc33` }}
                        pt={{ base: i > 0 ? '2' : '0', sm: '2' }}
                        columns={6}>
                        <Text>{i + 1}</Text>
                        <Text textTransform="uppercase">{o.symbol}</Text>
                        <HStack>
                            <Image w="20px" borderRadius="50px" src={`https://defillama.com/_next/image?url=%2Ficons%2F${o.project}.jpg&w=48&q=75`} />
                            <Text textTransform="capitalize">{o.project}</Text>
                        </HStack>
                        <HStack>
                            <Image w="20px" borderRadius="50px" src={`https://defillama.com/_next/image?url=%2Fchain-icons%2Frsz_${o.chain.toLowerCase()}.jpg&w=48&q=75`} />
                            <Text textTransform="capitalize">{o.chain}</Text>
                        </HStack>
                        <Text>{shortenNumber(o.apy, 2)}%</Text>
                        <Text>{shortenNumber(o.tvlUsd, 2, true)}</Text>
                    </SimpleGrid>
                })
            }
        </VStack>
    </Container>
}

export const Oppys = () => {
    const { oppys } = useOppys();

    return <OppysTable oppys={oppys} />
}