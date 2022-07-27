
import { useOppys } from '@app/hooks/useMarkets'
import { YieldOppy } from '@app/types';
import { shortenNumber } from '@app/util/markets';
import { Flex, HStack, Image, Text, VStack } from '@chakra-ui/react';
import Container from '@app/components/common/Container';
import Table from '@app/components/common/Table';
import { InfoMessage } from '@app/components/common/Messages';
import Link from '@app/components/common/Link';
import { ExternalLinkIcon } from '@chakra-ui/icons';
import { RadioCardGroup } from '@app/components/common/Input/RadioCardGroup';
import { useEffect, useState } from 'react';
import { SkeletonBlob } from '@app/components/common/Skeleton';

const ColHeader = ({ ...props }) => {
    return <Flex justify="flex-start" minWidth={'150px'} fontSize="24px" fontWeight="extrabold" {...props} />
}

const Cell = ({ ...props }) => {
    return <HStack fontSize="16px" fontWeight="normal" justify="flex-start" minWidth="150px" {...props} />
}

const FilterItem = ({ ...props }) => {
    return <HStack fontSize="14px" fontWeight="normal" justify="flex-start" {...props} />
}

const poolLinks = {
    '0x28368D7090421Ca544BC89799a2Ea8489306E3E5-fantom': 'https://ftm.curve.fi/factory/14/deposit',
    '0xAA5A67c256e27A5d80712c51971408db3370927D-ethereum': 'https://curve.fi/factory/27/deposit',
    '0x73e02eaab68a41ea63bdae9dbd4b7678827b2352': 'https://v2.info.uniswap.org/pair/0x73e02eaab68a41ea63bdae9dbd4b7678827b2352',
}

const projectLinks = {
    'concentrator': 'https://concentrator.aladdin.club/#/vault',
    'curve': 'https://curve.fi',
    'beefy-finance': 'https://app.beefy.com',
    'yearn-finance': 'https://yearn.finance',
    'uniswap': 'https://info.uniswap.org/#/pools',
    'sushiswap': 'https://app.sushi.com/farm?chainId=1',
    'convex-finance': 'https://www.convexfinance.com/stake',
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
        case 'velodrome':
            url = `https://app.velodrome.finance/liquidity/manage?address=${pool}`
            break;
    }
    return poolLinks[pool] || url || projectLinks[project];
}

const ProjectItem = ({ project }: { project: string }) => {
    return <>
        <Image w="20px" borderRadius="50px" src={`https://defillama.com/_next/image?url=%2Ficons%2F${project}.jpg&w=48&q=75`} fallbackSrc={`https://defillama.com/_next/image?url=%2Ficons%2F${project.replace('-finance', '')}.jpg&w=48&q=75`} />
        <Text textTransform="capitalize">{project.replace(/-/g, ' ')}</Text>
    </>
}

const ChainItem = ({ chain }: { chain: string }) => {
    return <>
        <Image w="20px" borderRadius="50px" src={`https://defillama.com/_next/image?url=%2Fchain-icons%2Frsz_${chain.toLowerCase()}.jpg&w=48&q=75`} />
        <Text textTransform="capitalize">{chain}</Text>
    </>
}

const columns = [
    {
        field: 'symbol',
        label: 'Pool',
        header: ({ ...props }) => <ColHeader minWidth="200px" justify="flex-start"  {...props} />,
        value: ({ symbol, pool, project }) => {
            const link = getPoolLink(project, pool);
            return <Cell justify="flex-start" minWidth="200px">
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
        showFilter: true,
        filterWidth: '190px',
        filterItemRenderer: ({ symbol }) => <FilterItem><Text>{symbol}</Text></FilterItem>
    },
    {
        field: 'project',
        label: 'Project',
        header: ({ ...props }) => <ColHeader minWidth="220px" justify="flex-start"  {...props} />,
        value: ({ project }) => <Cell minWidth="220px" justify="flex-start" >
            <ProjectItem project={project} />
        </Cell>,
        showFilter: true,
        filterWidth: '210px',
        filterItemRenderer: (props) => <FilterItem><ProjectItem {...props} /></FilterItem>,
    },
    {
        field: 'chain',
        label: 'Chain',
        header: ({ ...props }) => <ColHeader minWidth="200px" justify="flex-start"  {...props} />,
        value: ({ chain }) => <Cell minWidth="200px" justify="flex-start" >
            <ChainItem chain={chain} />
        </Cell>,
        showFilter: true,
        filterWidth: '190px',
        filterItemRenderer: (props) => <FilterItem><ChainItem {...props} /></FilterItem>,
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

export const OppysTable = ({
    oppys,
    isLoading,
}: {
    oppys: YieldOppy[],
    isLoading?: boolean,
}) => {
    const [category, setCategory] = useState('all');
    const [filteredOppys, setFilteredOppys] = useState(oppys);

    useEffect(() => {
        if (category === 'all') {
            setFilteredOppys(oppys);
        } else {
            const regEx = new RegExp(category, 'i');
            setFilteredOppys(oppys.filter(o => regEx.test(o.symbol)));
        }
    }, [oppys, category]);

    return <Container
        noPadding
        contentProps={{ p: { base: '2', sm: '8' } }}
        label="Earn with INV & DOLA on external platforms"
        description="DeFi yield opportunities on Ethereum, Optimism and Fantom"
        href="https://docs.inverse.finance/inverse-finance/yield-opportunities"
        headerProps={{
            direction: { base: 'column', md: 'row' },
            align: { base: 'flex-start', md: 'flex-end' },
        }}
        right={
            <RadioCardGroup
                wrapperProps={{ mt: { base: '2' }, overflow: 'auto', maxW: '90vw' }}
                group={{
                    name: 'category',
                    defaultValue: category,
                    onChange: (v) => { setCategory(v) },
                }}
                radioCardProps={{
                    w: 'fit-content',
                    textAlign: 'center',
                    px: { base: '2', md: '3' },
                    py: '1',
                    fontSize: '12px',
                    whiteSpace: 'nowrap'
                }}
                options={[
                    { label: 'All', value: 'all' },
                    { label: 'INV', value: 'inv' },
                    { label: 'DOLA', value: 'dola' },
                ]}
            />
        }
    >
        {
            isLoading ? <SkeletonBlob />
                :
                <VStack w='full' spacing="10">
                    <Table
                        keyName="pool"
                        defaultSort="tvlUsd"
                        defaultSortDir="desc"
                        columns={columns}
                        items={filteredOppys}
                        sortChevronProps={{ w: 8, h: 8, transform: 'translateX(20px)' }}
                        colBoxProps={{ fontWeight: "extrabold" }}
                    />
                    <InfoMessage
                        alertProps={{ w: 'full' }}
                        description={
                            <VStack alignItems="flex-start">
                                {
                                    oppys?.length > 0 && !oppys.find(o => o.project === 'convex-finance') &&
                                    <HStack spacing="1">
                                        <Text>Another option is staking DOLA-3POOL on</Text>
                                        <Link href={projectLinks['convex-finance']} target="_blank" isExternal>Convex Finance</Link>
                                    </HStack>
                                }
                                <Text>
                                    Risk Disclosure: Most yield opportunities mentioned on this page have not been audited by Inverse Finance.
                                </Text>
                                <Text>Please make your own Due Diligence.</Text>
                            </VStack>
                        }
                    />
                    <HStack as="a" href="https://defillama.com/" target="_blank">
                        <Text color="secondaryTextColor">
                            Powered By Defi Llama
                        </Text>
                        <Image borderRadius="50px" w="40px" src="/assets/projects/defi-llama.jpg" />
                    </HStack>
                </VStack>
        }
    </Container>
}

export const Oppys = () => {
    const { oppys, isLoading } = useOppys();
    return <OppysTable isLoading={isLoading} oppys={oppys} />
}