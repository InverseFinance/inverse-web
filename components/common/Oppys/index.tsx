
import { useOppys } from '@app/hooks/useMarkets'
import { YieldOppy } from '@app/types';
import { shortenNumber } from '@app/util/markets';
import { Flex, HStack, Image, Text, VStack } from '@chakra-ui/react';
import Container from '@app/components/common/Container';
import Table from '@app/components/common/Table';
import { InfoMessage } from '@app/components/common/Messages';
import Link from '@app/components/common/Link';
import { ExternalLinkIcon } from '@chakra-ui/icons';

const ColHeader = ({ ...props }) => {
    return <Flex justify="flex-start" minWidth={'150px'} fontSize="24px" fontWeight="extrabold" {...props} />
}

const Cell = ({ ...props }) => {
    return <HStack fontSize="16px" fontWeight="normal" justify="flex-start" minWidth="150px" {...props} />
}

const poolLinks = {
    '0x28368D7090421Ca544BC89799a2Ea8489306E3E5-fantom': 'https://ftm.curve.fi/factory/14/deposit',
    '0xAA5A67c256e27A5d80712c51971408db3370927D-ethereum': 'https://curve.fi/factory/27/deposit',
}

const projectLinks = {
    'concentrator': 'https://concentrator.aladdin.club/#/vault',
    'curve': 'https://curve.fi',
    'beefy-finance': 'https://app.beefy.com',
    'yearn-finance': 'https://yearn.finance',
    'uniswap': 'https://info.uniswap.org/#/pools',
    'sushiswap': 'https://app.sushi.com/farm?chainId=1',
}

const getPoolLink = (project, pool) => {
    let url;
    switch (project) {
        case 'balancer':
            url = `https://app.balancer.fi/#/pool/${pool}`
            break;
        case 'yearn-finance':
            url = `https://yearn.finance/#/vault/${pool}`
            break;
        case 'uniswap':
            url = `https://info.uniswap.org/#/pools/${pool}`
            break;
        case 'beefy-finance':
            url = `https://app.beefy.com/vault/${pool.replace(/-[0-9]+$/, '')}`
            break;
    }
    return url || poolLinks[pool] || projectLinks[project];
}

const columns = [
    {
        field: 'symbol',
        label: 'Pool',
        header: ({ ...props }) => <ColHeader justify="flex-start"  {...props} />,
        value: ({ symbol, pool, project }) => {
            const link = getPoolLink(project, pool);
            return <Cell justify="flex-start">
                <VStack borderBottom="1px solid #fff">
                    {
                        !!true ?
                            <Link color="mainTextColor" textTransform="uppercase" as="a" href={link} isExternal target="_blank">
                                <ExternalLinkIcon /> {symbol}
                            </Link>
                            :
                            <Text>{symbol}</Text>
                    }
                </VStack>
            </Cell>
        },
    },
    {
        field: 'project',
        label: 'Project',
        header: ({ ...props }) => <ColHeader w="200px" justify="flex-start"  {...props} />,
        value: ({ project }) => <Cell w="200px" justify="flex-start" >
            <Image w="20px" borderRadius="50px" src={`https://defillama.com/_next/image?url=%2Ficons%2F${project}.jpg&w=48&q=75`} fallbackSrc={`https://defillama.com/_next/image?url=%2Ficons%2F${project.replace('-finance', '')}.jpg&w=48&q=75`} />
            <Text textTransform="capitalize">{project.replace(/-/g, ' ')}</Text>
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
        description="DeFi yield opportunities on Ethereum, Optimism and Fantom"
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
            <InfoMessage
                title="Disclaimer"
                description={
                    <Text>
                        Risk Disclosure: Most yield opportunities mentioned on this page have not been audited by Inverse Finance. Please make your own Due Diligence.
                    </Text>
                }
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