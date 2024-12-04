
import { useOppys } from '@app/hooks/useMarkets'
import { NetworkIds, Token, YieldOppy } from '@app/types';
import { homogeneizeLpName, shortenNumber } from '@app/util/markets';
import { Box, HStack, Image, SimpleGrid, Stack, Text, VStack, useMediaQuery } from '@chakra-ui/react';

import Link from '@app/components/common/Link';
import { ExternalLinkIcon } from '@chakra-ui/icons';

import { SkeletonBlob } from '@app/components/common/Skeleton';
import { preciseCommify } from '@app/util/misc';
import { UnderlyingItem } from '../Assets/UnderlyingItem';
import { NETWORKS_BY_NAME } from '@app/config/networks';
import { CHAIN_TOKENS, TOKENS, getToken } from '@app/variables/tokens';

import { useAppTheme } from '@app/hooks/useAppTheme';
import { PROTOCOL_DEFILLAMA_MAPPING, PROTOCOLS_BY_IMG } from '@app/variables/images';

const cleanProjectName = (project: string) => {
    return project.replace(/-/g, ' ').replace(' dex', '').replace(/ V\d$/gi, '');
}

const poolLinks = {
    'f763842a-e4db-418c-a0cb-9390b61cece8': 'https://app.balancer.fi/#/ethereum/pool/0x5b3240b6be3e7487d61cd1afdfc7fe4fa1d81e6400000000000000000000037b',
    'faf2dccc-dba6-476a-a7df-ba771927d62d': 'https://app.balancer.fi/#/ethereum/pool/0x441b8a1980f2f2e43a9397099d15cc2fe6d3625000020000000000000000035f',
    '8cd47cd4-7824-4a8d-aebd-d703d86beae2': 'https://velodrome.finance/liquidity/manage?address=0x43ce87a1ad20277b78cae52c7bcd5fc82a297551',
    '17f0492d-6279-46b4-a637-40e542130954': 'https://velodrome.finance/liquidity/manage?address=0x6c5019d345ec05004a7e7b0623a91a0d9b8d590d',
    '2cb9f208-36e7-4505-be1c-9010c5d65317': 'https://ftm.curve.fi/factory/14/deposit',
    'a6aee229-3a38-47a1-a664-d142a4184ec9': 'https://curve.fi/factory/27/deposit',
    '0x73e02eaab68a41ea63bdae9dbd4b7678827b2352': 'https://v2.info.uniswap.org/pair/0x73e02eaab68a41ea63bdae9dbd4b7678827b2352',
}

const projectLinks = {
    'concentrator': 'https://concentrator.aladdin.club/#/vault',
    'curve': 'https://curve.fi',
    'beefy-finance': 'https://app.beefy.com',
    'beefy': 'https://app.beefy.com',
    'yearn-finance': 'https://yearn.finance',
    'uniswap': 'https://info.uniswap.org/#/pools',
    'sushiswap': 'https://app.sushi.com/farm?chainId=1',
    'convex-finance': 'https://www.convexfinance.com/stake',
    'aura': 'https://app.aura.finance',
    'stakedao': 'https://lockers.stakedao.org',
    'thena-v1': 'https://thena.fi/liquidity',
    'thena-v2': 'https://thena.fi/liquidity',
    'balancer-v2': 'https://balancer.fi/pools',
    'uniswap-v2': 'https://app.uniswap.org/#/add/v2',
    'velodrome-v1': 'https://v1.velodrome.finance/liquidity/manage',
    'velodrome-v2': 'https://velodrome.finance/liquidity/manage',
    'pickle': 'https://app.pickle.finance/farms',
    'ramses-v1': 'https://app.ramses.exchange/liquidity',
    'ramses-v2': 'https://app.ramses.exchange/liquidity',
    'gamma': 'https://app.gamma.xyz/dashboard',
    'liquis': 'https://www.liquis.app/stake',
    'bunni': 'https://bunni.pro/pools',
    'extra-finance': 'https://app.extrafi.io/farm',
    'aerodrome-v1': 'https://aerodrome.finance/liquidity',
    'harvest-finance': 'https://app.harvest.finance/farms',
}

const nativeLpProjects = ['curve-dex', 'uniswap-v2', 'uniswap-v3', 'aerodrome-v1', 'ramses-v1', 'ramses-v2', 'velodrome-v1', 'velodrome-v2', 'balancer-v2', 'sushiswap', 'thena-v1', 'thena-v2'];

const getPoolLink = (project, pool, underlyingTokens, symbol, isStable = true, chainName: string, localTokenConfig?: Token) => {
    let url;
    const _pool = pool || '';
    const chainId = NETWORKS_BY_NAME[chainName]?.id;
    switch (project) {
        case 'balancer':
            url = `https://app.balancer.fi/#/pool/${_pool}`
            break;
        case 'balancer-v2':
            const balancerPoolId = localTokenConfig?.balancerInfos?.poolId || '';
            url = `https://balancer.fi/pools/${chainName.toLowerCase()}/v2/${balancerPoolId?.toLowerCase()}`
            break;
        case 'yearn-finance':
            const vaultAddress = localTokenConfig?.address || '';
            const query = vaultAddress ? '' : `?chains=${chainId}&search=dola`;
            url = `https://yearn.fi/vaults/${vaultAddress ? `${chainId}/${vaultAddress}` : ''}` + query
            break;
        case 'uniswap':
            url = `https://info.uniswap.org/#/pools/${_pool}`
            break;
        case 'velodrome-v2':
        case 'aerodrome-v1':
            const [sym0, sym1] = symbol.split('-');
            const chainId = project === 'aerodrome-v1' ? NetworkIds.base : NetworkIds.optimism;
            const token0 = getToken(CHAIN_TOKENS[chainId], sym0);
            const token1 = getToken(CHAIN_TOKENS[chainId], sym1);
            const baseUrl = project === 'aerodrome-v1' ? 'https://aerodrome.finance' : 'https://velodrome.finance';
            const factory = project === 'velodrome-v2' && chainName === 'Optimism' ? '0xF1046053aa5682b4F9a81b5481394DA16BE5FF5a' : project === 'velodrome-v2' && chainName === 'Mode' ? '0x31832f2a97Fd20664D76Cc421207669b55CE4BC0' : '';
            url = token0?.address && token1?.address ? `${baseUrl}/pools?token0=${token0.address}&token1=${token1.address}&type=${isStable ? '0' : '-1'}&factory=${factory}` : baseUrl + '/liquidity'
            break;
        case 'uniswap-v2':
            url = underlyingTokens?.length > 0 ? `https://app.uniswap.org/#/add/v2/${underlyingTokens.join('/')}` : '';
            break;
        case 'ramses-v1':
            url = `https://app.ramses.exchange/liquidity/v1/${_pool.toLowerCase()}`;
            break;
        case 'ramses-v2':
            url = `https://app.ramses.exchange/liquidity/v2/${_pool.toLowerCase()}`;
            break;
    }
    return poolLinks[_pool] || url || projectLinks[project];
}

const ProjectItem = ({ isLargerThan = true, showLink = true, project, projectLabel, link, showImage = true, showText = true }: { isLargerThan?: boolean, showLink?: boolean, project: string, link?: string, showImage?: boolean, showText?: boolean }) => {
    const imgSize = isLargerThan ? 24 : 16;
    return <Stack direction={isLargerThan ? 'row' : 'column'} alignItems="center" spacing="2">
        {
            showImage && <Image ignoreFallback={true} alt='' title={projectLabel} w={`${imgSize}px`} borderRadius="50px" src={`https://icons.llamao.fi/icons/protocols/${project}?w=${imgSize}&h=${imgSize}`} fallbackSrc={`https://defillama.com/_next/image?url=%2Ficons%2F${project.replace('-finance', '')}.jpg&w=48&q=75`} />
        }
        {
            showText && isLargerThan && <>
                {
                    showLink && link ? <Link textDecoration="underline" textTransform="capitalize" href={link} target="_blank" isExternal>{projectLabel} <ExternalLinkIcon fontSize="14px" mb="1px" /></Link> : <Text fontSize={fontSizeSmaller} color="mainTextColorLight" textTransform="capitalize">{projectLabel}</Text>
                }
            </>
        }
    </Stack>
}

const ChainItem = ({ chain, showText = true, isLargerThan = true }: { chain: string, showText?: boolean, isLargerThan?: boolean }) => {
    const imgSize = isLargerThan ? '30' : '20';
    return <HStack className="bordered-grid-item">
        <Image ignoreFallback={true} alt='' title={chain} w={`${imgSize}px`} borderRadius="50px" src={`https://icons.llamao.fi/icons/chains/rsz_${chain.toLowerCase()}?w=${imgSize}&h=${imgSize}`} />
        {
            showText && <Text fontSize={fontSize} fontWeight="extrabold" textTransform="capitalize">{chain}</Text>
        }
    </HStack>
}

const poolColumn = ({ isLargerThan = true, width, symbol, project, chain, underlyingTokens }) => {
    let pairs = [];
    let isFallbackCase = false;

    try {
        pairs = underlyingTokens?.length < 2 ? symbol.replace('DOLA-BNB', 'DOLA-WBNB').replace('-USDCE', '-USDC').split('-').slice(0, 2).map(sym => getToken(CHAIN_TOKENS[NETWORKS_BY_NAME[chain]?.id], sym)?.address) : underlyingTokens;
    } catch (e) {
        isFallbackCase = true;
    }
    if (isFallbackCase) {
        try {
            pairs = !underlyingTokens ? symbol.replace('DOLA-BNB', 'DOLA-WBNB').split('-').slice(0, 2).map(sym => getToken(TOKENS, sym)?.address) : underlyingTokens;
        } catch (e) { }
    }
    const chainId = isFallbackCase ? NetworkIds.mainnet : NETWORKS_BY_NAME[chain]?.id;
    const containerProps = { direction: 'column', alignItems: 'center' }
    const textProps = { fontSize, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', maxWidth: '300px' };
    const commonLpProps = { Container: Stack, imgSize: isLargerThan ? 45 : 24, label: symbol, pairs, showAsLp: true, chainId, alternativeLpDisplay: true, containerProps, textProps };
    return <HStack className="bordered-grid-item">
        {
            pairs?.length > 0 ? <>
                <UnderlyingItem {...commonLpProps} />
            </> : <Text fontSize={fontSize}>{symbol}</Text>
        }
    </HStack>
};

const fontSize = { base: '13px', md: '22px' };
const fontSizeSmaller = { base: '11px', md: '16px' };

const GroupedOppyItem = ({ oppy, isLargerThan, showLinks = false }: { oppy: YieldOppy, isLargerThan: boolean, showLinks?: boolean }) => {
    return <>
        {poolColumn({ ...oppy, isLargerThan })}
        <Text className="bordered-grid-item" fontSize={fontSize}>
            {shortenNumber(oppy.tvlUsd, 2, true)}
        </Text>
        <VStack className="bordered-grid-item">
            <Text fontSize={fontSize}>{preciseCommify(oppy.apy, 2)}%</Text>
            <HStack>
                <ProjectItem isLargerThan={isLargerThan} showLink={showLinks} link={oppy.link} showImage={true} project={oppy.project} projectLabel={cleanProjectName(oppy.project)} />
            </HStack>
        </VStack>
        <VStack className="bordered-grid-item">
            {oppy.bestYieldAggregatorApy && <Text fontSize={fontSize}>{preciseCommify(oppy.bestYieldAggregatorApy, 2)}%</Text>}
            {oppy.bestYieldAggregatorProject && <HStack>
                <ProjectItem isLargerThan={isLargerThan} showLink={showLinks} link={oppy.bestYieldAggregatorLink} showImage={true} project={oppy.bestYieldAggregatorProject} projectLabel={cleanProjectName(oppy.bestYieldAggregatorProject)} />
            </HStack>}
        </VStack>
    </>
}

export const OppysGroupedTop3 = ({
    groupedOppys,
    chain,
    isLoading,
    isLargerThan = false,
    showLinks = false,
}: {
    groupedOppys: YieldOppy[],
    chain: string,
    isLoading?: boolean,
    isLargerThan?: boolean,
    showLinks?: boolean,
}) => {
    const { themeStyles } = useAppTheme();
    return <Box id={`${chain}-yields`} borderWidth="0px" borderRadius={isLargerThan ? '8' : undefined} p={isLargerThan ? '4' : '0'} bgColor="containerContentBackground" borderColor="mainTextColorLight" className="bordered-grid-container">
        <ChainItem chain={chain} isLargerThan={isLargerThan} />
        <Text className="bordered-grid-item" color={themeStyles.colors.mainTextColor} fontWeight="extrabold" fontSize={fontSize}>
            TVL
        </Text>
        <Text className="bordered-grid-item" color={themeStyles.colors.mainTextColor} fontWeight="extrabold" fontSize={fontSize}>
            Native<br/>APY
        </Text>
        <Text className="bordered-grid-item" color={themeStyles.colors.mainTextColor} fontWeight="extrabold" fontSize={fontSize}>
            Yield Aggregator APY
        </Text>
        {
            isLoading ? <><SkeletonBlob /><SkeletonBlob /><SkeletonBlob /><SkeletonBlob /></> : groupedOppys.map((o, i) => {
                return <GroupedOppyItem showLinks={showLinks} key={o.symbol} oppy={o} isLargerThan={isLargerThan} index={i} />
            })
        }
    </Box>
}

const topChains = ['Ethereum', 'Base', 'Optimism', 'Arbitrum', 'Blast', 'Mode'];

function arePairsEqual(pair1, pair2) {
    const normalizePair = (pair) => {
        return pair.split('-').sort();
    };
    const normalizedPair1 = normalizePair(pair1);
    const normalizedPair2 = normalizePair(pair2);
    return normalizedPair1[0] === normalizedPair2[0] &&
        normalizedPair1[1] === normalizedPair2[1];
}

export const OppysV2 = ({
    showLinks = false,
}) => {
    const { oppys, isLoading } = useOppys();
    const [isLargerThan] = useMediaQuery(`(min-width: 400px)`);

    const _oppys = (oppys || []).filter(o => !o.symbol.includes('-BB-'));

    const top3ByChain = topChains.map(chain => {
        const top3Native = _oppys.filter(o => o.stablecoin && nativeLpProjects.includes(o.project) && o.chain === chain).sort((a, b) => b.apy - a.apy).slice(0, 3).map((o, i) => ({ ...o, rank: i + 1 }));
        const oppyChainId = NETWORKS_BY_NAME[chain].id.toString();
        const chainTokens = Object.values(CHAIN_TOKENS[oppyChainId]);
        const groupedOppys = top3Native.map(o => {
            const findLocalConf = chainTokens.find(t => {
                const protocol = PROTOCOLS_BY_IMG[t.protocolImage];
                const defiLlamaProjectName = PROTOCOL_DEFILLAMA_MAPPING[protocol];
                return defiLlamaProjectName === o.project && homogeneizeLpName(t.symbol) === o.symbol
            });

            const bestYieldAggregator = _oppys.filter(o2 => o2.stablecoin && !nativeLpProjects.includes(o2.project) && o2.chain === chain && o2.symbol === o.symbol).sort((a, b) => b.apy - a.apy)[0];
            const findYieldLocalConf = chainTokens.find(t => {
                const protocol = PROTOCOLS_BY_IMG[t.protocolImage];
                const defiLlamaProjectName = PROTOCOL_DEFILLAMA_MAPPING[protocol];
                return defiLlamaProjectName === bestYieldAggregator?.project && homogeneizeLpName(t.symbol) === bestYieldAggregator?.symbol
            });

            const nativeLink = findLocalConf?.link || getPoolLink(o.project, o.pool, o.underlyingTokens, o.symbol, o.stablecoin, o.chain, findLocalConf);
            const bestYieldAggregatorLink = getPoolLink(bestYieldAggregator?.project, bestYieldAggregator?.pool, bestYieldAggregator?.underlyingTokens, bestYieldAggregator?.symbol, bestYieldAggregator?.stablecoin, o.chain, findYieldLocalConf);
            return { ...o, link: nativeLink, bestYieldAggregatorProject: bestYieldAggregator?.project, bestYieldAggregatorApy: bestYieldAggregator?.apy, bestYieldAggregatorLink };
        });

        return {
            chain,
            hasOppys: groupedOppys.length > 0,
            groupedOppys,
        };
    }).filter(o => o.hasOppys);

    return <VStack alignItems="flex-start" spacing="10">
        <HStack px="6" w='full' justify="center">
            <HStack as="a" href="https://defillama.com/yields?token=DOLA&token=INV&token=DBR" target="_blank">
                <Text textDecoration="underline" color="secondaryTextColor">
                    Data source: DefiLlama <ExternalLinkIcon />
                </Text>
                <Image borderRadius="50px" w="40px" src="/assets/projects/defi-llama.jpg" />
            </HStack>
        </HStack>
        <SimpleGrid columns={1} spacing="20">
            {
                top3ByChain.map(({ chain, groupedOppys }) => (
                    <OppysGroupedTop3 showLinks={showLinks} isLargerThan={isLargerThan} key={chain} chain={chain} isLoading={isLoading} title={`Top 3 DOLA LP Opportunities on ${chain}`} groupedOppys={groupedOppys} />
                ))
            }
        </SimpleGrid>
    </VStack>
}