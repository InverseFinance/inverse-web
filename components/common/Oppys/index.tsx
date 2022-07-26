
import { useOppys } from '@app/hooks/useMarkets'
import { YieldOppy } from '@app/types';
import { shortenNumber } from '@app/util/markets';
import { Flex, HStack, Image, Text, VStack } from '@chakra-ui/react';
import Container from '@app/components/common/Container';
import Table from '@app/components/common/Table';

const ColHeader = ({ ...props }) => {
    return <Flex justify="flex-start" minWidth={'150px'} fontSize="24px" fontWeight="extrabold" {...props} />
}

const Cell = ({ ...props }) => {
    return <HStack fontSize="16px" fontWeight="normal" justify="flex-start" minWidth="150px" {...props} />
}

const columns = [
    {
        field: 'symbol',
        label: 'Pool',
        header: ({ ...props }) => <ColHeader justify="flex-start"  {...props} />,
        value: (item) => {
            return <Cell justify="flex-start">
                <Text textTransform="uppercase">{item.symbol}</Text>
            </Cell>
        },
    },
    {
        field: 'project',
        label: 'Project',
        header: ({ ...props }) => <ColHeader justify="flex-start"  {...props} />,
        value: ({ project }) => <Cell justify="flex-start" >
            <Image w="20px" borderRadius="50px" src={`https://defillama.com/_next/image?url=%2Ficons%2F${project}.jpg&w=48&q=75`} />
            <Text textTransform="capitalize">{project}</Text>
        </Cell>,
    },
    {
        field: 'chain',
        label: 'Chain',
        header: ({ ...props }) => <ColHeader justify="flex-start"  {...props} />,
        value: ({ chain }) => <Cell justify="flex-start" >
            <Image w="20px" borderRadius="50px" src={`https://defillama.com/_next/image?url=%2Fchain-icons%2Frsz_${chain.toLowerCase()}.jpg&w=48&q=75`} />
            <Text textTransform="capitalize">{chain}</Text>
        </Cell>,
    },
    {
        field: 'apy',
        label: 'APY',
        header: ({ ...props }) => <ColHeader w="100px" justify="flex-end" {...props} />,
        value: ({ apy }) => <Cell w="100px" justify="flex-end">
            <Text>{shortenNumber(apy, 2)}%</Text>
        </Cell>,
    },
    {
        field: 'tvlUsd',
        label: 'TVL',
        header: ({ ...props }) => <ColHeader w="100px" justify="flex-end" {...props} />,
        value: ({ tvlUsd }) => <Cell w="100px" justify="flex-end">
            <Text>{shortenNumber(tvlUsd, 2, true)}</Text>
        </Cell>,
    },
]

export const OppysTable = ({ oppys }: { oppys: YieldOppy[] }) => {

    return <Container
        noPadding
        contentProps={{ p: { base: '2', sm: '8' } }}
        label="Earn with INV & DOLA on external platforms"
        description="DeFi yield opportunities on Ethereum, optimism and fantom"
        href="https://docs.inverse.finance/inverse-finance/yield-opportunities"
    >
        <VStack w='full' spacing="10">
            <Table
                keyName="pool"
                defaultSort="tvlUsd"
                defaultSortDir="desc"
                columns={columns}
                items={oppys}
                sortChevronProps={{ w: 8, h: 8, transform: 'translateX(20px)' }}
                colBoxProps={{ fontWeight: "extrabold" }}
            />
            <HStack as="a" href="https://defillama.com/" target="_blank">
                <Text color="secondaryTextColor">
                    Powered By Defi Llama
                </Text>
                <Image borderRadius="50px" w="40px" src="/assets/projects/defi-llama.jpg" />
            </HStack>
        </VStack>
    </Container>
}

export const Oppys = () => {
    const { oppys } = useOppys();

    return <OppysTable oppys={oppys} />
}