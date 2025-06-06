import { Text, HStack, Image, SimpleGrid, VStack, useInterval } from '@chakra-ui/react';
import { lightTheme } from '@app/variables/theme';
import { TOKEN_IMAGES } from '@app/variables/images';
import Logo from '../common/Logo';
import { LandingHeading } from '../common/Landing/LandingComponents';
import { NetworkImage, NetworkItem } from '../common/NetworkItem';
import { useState } from 'react';

const EcoElement = ({
    image,
    label,
}: {
    image: string,
    label: string,
}) => {
    return <HStack className="banner-element" minW="200px" w='230px' px="8" py='10' maxH='120px'>
        <HStack w='full' justify="center" spacing="4">
            <Image borderRadius='full' src={image} height='40px' alt={label} />
            <Text color={lightTheme.colors.mainTextColor} fontWeight='bold' fontSize='16px'>
                {label}
            </Text>
        </HStack>
    </HStack>;
}

export const ecosystemData = [
    {
        image: 'https://assets.coingecko.com/coins/images/12124/large/Curve.png',
        label: 'Curve',

        category: 'DEX',
        categories: ['DEX', 'LENDING', 'LIQUIDITY'],
        "href": "https://curve.finance",
        "description": "Curve is a decentralized exchange liquidity pool on Ethereum designed for extremely efficient stablecoin trading",
    },
    {
        image: 'https://assets.coingecko.com/coins/images/15585/large/convex.png?1621256328',
        label: 'Convex',

        category: 'YIELD',
        "href": "https://www.convexfinance.com/",
        "description": "Convex simplifies your Curve-boosting experience to maximize your yields.",
    },
    {
        image: 'https://assets.coingecko.com/coins/images/11849/large/yfi-192x192.png?1598325330',
        label: 'Yearn',

        category: 'YIELD',
        "href": "https://yearn.finance/",
        "description": "Yearn.finance is an aggregator service for decentralized finance (DeFi) investors, using automation to allow them to maximize profits from yield farming.",
    },
    {
        image: '/assets/projects/coinbase.svg',
        label: 'Coinbase',

        category: 'CEX',
        "href": "https://www.coinbase.com/",
        description: "Coinbase is a secure online platform for buying, selling, transferring, and storing cryptocurrency.",
    },
    {
        image: TOKEN_IMAGES.VELO,
        label: 'Velodrome',
        category: 'DEX',
        categories: ['DEX', 'YIELD'],
        "href": "https://velodrome.finance",
        "description": "Velodrome is a DeFi platform that focuses on improving the efficiency of asset exchange and liquidity in the Optimism ecosystem.",
    },
    {
        image: TOKEN_IMAGES.AERO,
        label: 'Aerodrome',
        category: 'DEX',
        categories: ['DEX', 'YIELD'],
        "href": "https://aerodrome.finance/",
        "description": "Velodrome is a DeFi platform that focuses on improving the efficiency of asset exchange and liquidity in the Base ecosystem.",
    },
    {
        image: 'https://assets.coingecko.com/coins/images/11683/large/Balancer.png?1592792958',
        label: 'Balancer',

        category: 'DEX',
        "href": "https://balancer.finance/",
        "description": "Balancer is a protocol for programmable liquidity.",
    },
    {
        image: 'https://assets.coingecko.com/coins/images/25942/large/logo.png?1654784187',
        label: 'Aura',

        category: 'YIELD',
        "href": "https://aura.finance",
        "description": "Aura Finance is a protocol built on top of the Balancer system to provide maximum incentives to Balancer liquidity providers and BAL stakers (into veBAL) through social aggregation of BAL deposits and Aura's native token.",
    },
    {
        image: 'https://assets.coingecko.com/coins/images/15069/large/Pendle_Logo_Normal-03.png?1696514728',
        label: 'Pendle',

        category: 'YIELD',
        "href": "https://pendle.finance/",
        "description": "Pendle Finance is a protocol that enables the trading of tokenized future yield on an AMM system.",
    },
    {
        image: 'https://assets.coingecko.com/coins/images/52854/large/spectra.jpg?1734517434',
        label: 'Spectra',

        category: 'YIELD',
        "href": "https://app.spectra.finance/fixed-rate",
        "description": "Secure your future yield at a fixed rate.",
    },
    {
        image: TOKEN_IMAGES.THENA,
        label: 'Thena',

        category: 'DEX',
        categories: ['DEX', 'YIELD'],
        "href": "https://www.thena.fi",
        "description": "THENA FUSION is the concentrated liquidity protocol on BSC chain, powered by Algebra Protocol",
    },
    {
        image: 'https://assets.coingecko.com/coins/images/54833/standard/RSUP-icon.png?1741965338',
        label: 'Resupply',

        category: 'LENDING',
        categories: ['LENDING', 'YIELD'],
        "href": "https://resupply.fi/",
        "description": "A decentralized stablecoin protocol, leveraging the liquidity and stability of lending markets",
    },
    {
        image: 'https://assets.coingecko.com/coins/images/2822/large/huobi-token-logo.png?1547036992',
        label: 'HTX',

        category: 'CEX',
        "href": "https://www.htx.com/",
        "description": "HTX is one of the world's biggest Bitcoin exchanges and altcoin crypto exchanges.",
    },
    {
        image: 'https://assets.coingecko.com/markets/images/409/large/WeChat_Image_20210622160936.png?1624349423',
        label: 'MEXC',

        category: 'CEX',
        "href": "https://www.mexc.com/",
        "description": "MEXC is your easiest way to crypto. Explore the world's leading cryptocurrency exchange for buying, trading, and earning crypto.",
    },
    {
        image: TOKEN_IMAGES.FRAX,
        label: 'Frax',

        category: 'LENDING',
        categories: ['LENDING', 'YIELD'],
        "href": "https://frax.finance/",
        "description": "Frax: Decentralized stablecoin protocol with multiple tokens and supporting subprotocols",
    },
    {
        image: 'https://assets.coingecko.com/coins/images/12704/large/token.png?1601876182',
        label: 'Beefy',

        category: 'YIELD',
        "href": "https://beefy.com",
        "description": "Beefy automates yield farming to make DeFi easy, safe and efficient for all. By autocompounding your tokens, Beefy unlocks higher returns so you earn more of what you love.",
    },
    {
        image: '/assets/partners/immunefi.svg',
        label: 'Immunefi',

        category: 'SECURITY',
        "href": "https://immunefi.com/",
        "description": "Immunefi offers large bug bounties for securing web3 projects",
    },
    {
        image: '/assets/v2/landing/nomoi.png',
        label: 'Nomoi',
        category: 'SECURITY',
        "href": "https://nomoi.xyz/",
        "description": "Nomoi is a boutique Web3 hacker collective that provides comprehensive security audits for DeFi protocols, with roots in Open Zeppelin and Consensys",
    },
    {
        image: '/assets/v2/landing/code4arena.png',
        label: 'Code4Arena',

        category: 'SECURITY',
        "href": "https://code4arena.com/",
        "description": "Code4rena security auditors (Wardens) compete to find high-severity vulnerabilities",
    },
    {
        image: '/assets/landing/yAudit.jpg',
        label: 'yAudit',

        category: 'SECURITY',
        "href": "https://electisec.com/",
        "description": "yAudit is a security auditing firm that spun out of Yearn Finance, focusing on providing comprehensive smart contract audits and security practices for DeFi protocols",
    },
    {
        image: '/assets/v2/landing/defimoon.png',
        label: 'Defimoon',

        category: 'SECURITY',
        "href": "https://defimoon.xyz/",
        "description": "DeFi Moon: Boutique auditing firm specializing in smart contract security reviews",
    },
    {
        image: 'https://assets.coingecko.com/coins/images/877/standard/chainlink-new-logo.png?1696502009',
        label: 'Chainlink',

        category: 'INFRASTRUCTURE',
        "href": "https://chain.link/",
        "description": "Chainlink is a decentralized oracle network that provides secure and reliable data feeds to smart contracts.",
    },
    {
        image: '/assets/landing/enso.jpeg',
        label: 'Enso',

        category: 'INFRASTRUCTURE',
        "href": "https://www.enso.build/",
        "description": "Enso: Universal DeFi dashboard for bundled, optimized multi-protocol interactions",
    },
    {
        image: '/assets/landing/debank.jpg',
        label: 'Debank',

        category: 'INFRASTRUCTURE',
        "href": "https://debank.com/",
        "description": "DeBank is a comprehensive DeFi portfolio tracking and management platform",
    },
    {
        image: TOKEN_IMAGES.USR,
        label: 'USR',

        category: 'LIQUIDITY',
        categories: ['LIQUIDITY', 'YIELD'],
        "href": "https://usual.money/",
        "description": "A secure, decentralized issuer that takes back the value captured by crypto giants—and redistributes it to the community through $USUAL.",
    },
    {
        image: TOKEN_IMAGES.CRVUSD,
        label: 'CrvUSD',

        category: 'LIQUIDITY',
        categories: ['LIQUIDITY', 'YIELD'],
        "href": "https://crvusd.curve.finance/#/ethereum/markets",
        "description": "crvUSD is a collateralized-debt-position (CDP) stablecoin pegged to the US Dollar",
    },
    {
        image: TOKEN_IMAGES.PYUSD,
        label: 'PayPal',

        category: 'LIQUIDITY',
        categories: ['LIQUIDITY', 'YIELD'],
        "href": "https://paypal.com",
        "description": "PayPal USD (PYUSD): Ethereum-based stablecoin backed 1:1 by US dollars",
    },
    {
        image: "https://assets.coingecko.com/coins/images/13724/large/stakedao_logo.jpg?1696513468",
        label: 'StakeDAO',
        category: 'YIELD',
        "href": "https://stakedao.org/",
        "description": "Stake DAO is a non-custodial decentralized protocol enabling users to access optimized yield opportunities in DeFi",
    },
];

const projectImages = ecosystemData.reduce((acc, el) => {
    acc[el.label] = el.image;
    return acc;
}, {});

const EcoCellItem = ({ project, width = 50 }: { project: string, width?: number }) => {
    return <Image borderRadius='full' src={projectImages[project]!} width={{ base: `${parseInt(width / 2)}px`, md: `${width}px` }} alt={project} />
}

const bannerItems = ecosystemData.slice(0, 10);

export const EcosystemBanner = () => {
    return <HStack className="banner" bgColor="white" pb="2" pt="2">
        <HStack className="banner-track">
            {bannerItems.map((el, i) => <EcoElement key={i} {...el} />)}
            {/* duplicate for smooth banner auto-scroll */}
            {bannerItems.map((el, i) => <EcoElement key={i} {...el} />)}
        </HStack>
    </HStack>
}

const CellBig = ({ children }: { children: React.ReactNode }) => {
    return <VStack alignItems="center" justifyContent="center" w={{ base: '150px', md: '400px' }} h={{ base: '135px', md: '360px' }} boxShadow="0 0 0 1px lightgray">
        {children}
    </VStack>
}

const CellBigGrid = ({ children }: { children: React.ReactNode }) => {
    return <SimpleGrid columns={2} alignItems="center" justifyContent="center" w={{ base: '150px', md: '400px' }} h={{ base: '135px', md: '360px' }} boxShadow="0 0 0 1px lightgray">
        {children}
    </SimpleGrid>
}

const CellSmaller = ({ children }: { children: React.ReactNode }) => {
    return <SimpleGrid columns={2} alignItems="center" justifyContent="center" w={{ base: '150px', md: '400px' }} h={{ base: '90px', md: '240px' }} boxShadow="0 0 0 1px lightgray">
        {children}
    </SimpleGrid>
}

const CellItem = ({ children }: { children: React.ReactNode }) => {
    const [enableColor, setEnableColor] = useState(false);

    useInterval(() => {
        const random = Math.random();
        setEnableColor(random > 0.5);
    }, 1000);

    return <VStack filter={enableColor ? 'grayscale(0%)' : 'grayscale(100%)'} alignItems="center" justifyContent="center" w={{ base: '75px', md: '200px' }} h={{ base: '45px', md: '120px' }} boxShadow="0 0 0 1px lightgray"
        transition="filter 0.25s ease-in-out"
    >
        {children}
    </VStack>
}

const CellText = ({ children }: { children: React.ReactNode }) => {
    return <LandingHeading fontSize={{ base: '10px', md: '20px' }} fontWeight="bold">
        {children}
    </LandingHeading>
}

export const EcosystemGrid = () => {
    return <VStack position="relative" w='full' spacing="0">
        <VStack w='full' position="absolute" top="0" left="0" right="0" bottom="0" zIndex="1"
            bg="radial-gradient(circle, rgba(255,255,255,0) 0%, rgba(255,255,255,1) 66%)"
            boxShadow="0 0 0 10px white"
        ></VStack>
        <VStack boxShadow="inset 0 0 0 1px white" spacing="0" display="grid" w='full' alignItems="center" justify="center">
            <HStack spacing="0" w='full' maxW="1300px" >
                <CellSmaller>
                    <CellItem>
                        <EcoCellItem project="Velodrome" />
                    </CellItem>
                    <CellItem>
                        <EcoCellItem project="Aerodrome" />
                    </CellItem>
                    <CellItem>
                        <EcoCellItem project="Balancer" />
                    </CellItem>
                    <CellItem>
                        <CellText>
                            DEX
                        </CellText>
                    </CellItem>
                </CellSmaller>
                <CellSmaller>
                    <CellItem>
                        <EcoCellItem project="Resupply" />
                    </CellItem>
                    <CellItem>
                        <EcoCellItem project="Frax" />
                    </CellItem>
                    <CellItem>
                        <EcoCellItem project="Curve" />
                    </CellItem>
                    <CellItem>
                        <CellText>
                            Lending
                        </CellText>
                    </CellItem>
                </CellSmaller>
                <CellSmaller>
                    <CellItem>
                        <EcoCellItem project="Convex" />
                    </CellItem>
                    <CellItem>
                        <EcoCellItem project="Beefy" />
                    </CellItem>
                    <CellItem>
                        <CellText>
                            Yield
                        </CellText>
                    </CellItem>
                    <CellItem>
                        <EcoCellItem project="Yearn" />
                    </CellItem>
                </CellSmaller>
            </HStack>
            <HStack spacing="0" w='full' maxW="1300px" >
                <CellBigGrid>
                    <CellItem>
                        <NetworkImage chainId={10} size={{ base: '25px', md: '50px' }} />
                    </CellItem>
                    <CellItem>
                        <NetworkImage chainId={8453} size={{ base: '25px', md: '50px' }} />
                    </CellItem>
                    <CellItem>
                        <NetworkImage chainId={42161} size={{ base: '25px', md: '50px' }} />
                    </CellItem>
                    <CellItem>
                        <CellText>
                            Chains
                        </CellText>
                    </CellItem>
                    <CellItem>
                        <NetworkImage chainId={43114} size={{ base: '25px', md: '50px' }} />
                    </CellItem>
                    <CellItem>
                        <NetworkImage chainId={1} size={{ base: '25px', md: '50px' }} />
                    </CellItem>
                </CellBigGrid>
                <CellBig>
                    <Logo boxSize={{ base: '50px', md: '150px' }} noFilter={true} />
                </CellBig>
                <CellBigGrid>
                    <CellItem>
                        <EcoCellItem width={50} project="Immunefi" />
                    </CellItem>
                    <CellItem>
                        <EcoCellItem width={50} project="yAudit" />
                    </CellItem>
                    <CellItem>
                        <CellText>
                            Security
                        </CellText>
                    </CellItem>
                    <CellItem>
                        <EcoCellItem width={50} project="Defimoon" />
                    </CellItem>
                    <CellItem>
                        <EcoCellItem width={50} project="Nomoi" />
                    </CellItem>
                    <CellItem>
                        <EcoCellItem width={50} project="Code4Arena" />
                    </CellItem>
                </CellBigGrid>
            </HStack>
            <HStack spacing="0" w='full' maxW="1300px" >
                <CellSmaller>
                    <CellItem>
                        <EcoCellItem project="Chainlink" />
                    </CellItem>
                    <CellItem>
                        <CellText>
                            Infrastructure
                        </CellText>
                    </CellItem>
                    <CellItem>
                        <EcoCellItem width={50} project="Debank" />
                    </CellItem>
                    <CellItem>
                        <EcoCellItem project="Enso" />
                    </CellItem>
                </CellSmaller>
                <CellSmaller>
                    <CellItem>
                        <CellText>
                            CEX
                        </CellText>
                    </CellItem>
                    <CellItem>
                        <EcoCellItem project="Coinbase" />
                    </CellItem>
                    <CellItem>
                        <EcoCellItem project="Huobi" />
                    </CellItem>
                    <CellItem>
                        <EcoCellItem project="MEXC" />
                    </CellItem>
                </CellSmaller>
                <CellSmaller>
                    <CellItem>
                        <CellText>
                            Liquidity
                        </CellText>
                    </CellItem>
                    <CellItem>
                        <EcoCellItem project="CrvUSD" />
                    </CellItem>
                    <CellItem>
                        <EcoCellItem project="PayPal" />
                    </CellItem>
                    <CellItem>
                        <EcoCellItem project="USR" />
                    </CellItem>
                </CellSmaller>
            </HStack>
        </VStack>
    </VStack>
}