import { Text, HStack, Image, SimpleGrid, VStack, useInterval } from '@chakra-ui/react';
import { lightTheme } from '@app/variables/theme';
import { TOKEN_IMAGES } from '@app/variables/images';
import Logo from '../common/Logo';
import { GeistText, LandingHeading, landingMainColor } from '../common/Landing/LandingComponents';
import { NetworkImage, NetworkItem } from '../common/NetworkItem';
import { useState } from 'react';
import { ArrowForwardIcon } from '@chakra-ui/icons';

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
        categories: ['DEX', 'LENDING', 'LIQUIDITY', 'YIELD'],
        href: "https://curve.finance",
        description: "Curve Finance is a decentralized exchange (DEX) that focuses on stablecoin trading.",
    },
    {
        image: 'https://assets.coingecko.com/coins/images/11683/large/Balancer.png?1592792958',
        label: 'Balancer',
        category: 'DEX',
        categories: ['DEX', 'YIELD', 'LIQUIDITY'],
        href: "https://balancer.finance/",
        description: "Balancer (BAL) is a decentralized cryptocurrency exchange (DEX) and an automatic portfolio management platform.",
    },
    {
        image: TOKEN_IMAGES.AERO,
        label: 'Aerodrome',
        category: 'DEX',
        categories: ['DEX', 'YIELD', 'LIQUIDITY'],
        href: "https://aerodrome.finance/",
        description: "Aerodrome Finance (AERO) is a central trading and liquidity marketplace on Base.",
    },
    {
        image: TOKEN_IMAGES.VELO,
        label: 'Velodrome',
        category: 'DEX',
        categories: ['DEX', 'YIELD', 'LIQUIDITY'],
        href: "https://velodrome.finance",
        description: "Velodrome (VELODROME) is a DeFi platform that focuses on improving the efficiency of asset exchange and liquidity in the Optimism ecosystem.",
    },
    {
        image: TOKEN_IMAGES.THENA,
        label: 'Thena',
        category: 'DEX',
        categories: ['DEX', 'YIELD', 'LIQUIDITY'],
        href: "https://www.thena.fi",
        description: "THENA is a community-driven decentralized exchange, powered by a self-optimizing ve(3,3) model, serving BNB Chain projects with their liquidity needs.",
    },
    {
        image: 'https://assets.coingecko.com/coins/images/12632/large/pancakeswap-cake-logo_%281%29.png?1629359065',
        label: 'Pancakeswap',
        category: 'DEX',
        categories: ['DEX'],
        href: "https://pancakeswap.finance/",
        description: "PancakeSwap is a decentralized exchange (DEX) running on the Binance Smart Chain (BSC) and Base, offering trading, earning, and NFT features.",
    },
    {
        image: 'https://assets.coingecko.com/coins/images/12271/standard/512x512_Logo_no_chop.png?1696512101',
        label: 'Sushi',
        category: 'DEX',
        categories: ['DEX'],
        href: "https://sushi.com/",
        description: "Trade crypto effortlessly with SushiSwap, supporting over 30 chains and featuring a powerful aggregator for the best rates across DeFi.",
    },
    {
        image: 'https://assets.coingecko.com/coins/images/12504/large/uniswap-uni.png?1600306604',
        label: 'Uniswap',
        category: 'DEX',
        categories: ['DEX'],
        href: "https://uniswap.org/",
        description: "Uniswap is the largest decentralized exchange (or DEX) operating on the Ethereum blockchain, allowing users anywhere to trade crypto without an intermediary.",
    },
    {
        image: 'https://assets.coingecko.com/coins/images/29420/standard/newram.png?1708427055',
        label: 'Ramses',
        category: 'DEX',
        categories: ['DEX'],
        href: "https://ramses.exchange/",
        description: "Ramses is a next-generation AMM designed to serve as Arbitrum's central liquidity hub.",
    },
    {
        image: 'https://assets.coingecko.com/markets/images/647/large/kyberswap.png?1706864593',
        label: 'Kyber',
        category: 'DEX',
        categories: ['DEX'],
        href: "https://kyberswap.com/",
        description: "KyberSwap is a multi-chain aggregator and DeFi hub that empowers users with insights and tools to achieve financial autonomy.",
    },
    {
        image: 'https://assets.coingecko.com/coins/images/54148/standard/bunni_logo_v2_square.png?1738468465',
        label: 'Bunni',
        category: 'DEX',
        categories: ['DEX', 'YIELD'],
        href: "https://bunni.pro/",
        description: "Bunni transforms Uniswap v3 NFT liquidity positions into fungible ERC-20 tokens, enabling advanced liquidity management features.",
    },
    // CEX Partners
    {
        image: '/assets/projects/coinbase.svg',
        label: 'Coinbase',
        category: 'CEX',
        categories: ['CEX'],
        href: "https://www.coinbase.com/",
        description: "Coinbase is a secure online platform for buying, selling, transferring, and storing cryptocurrency.",
    },
    {
        image: 'https://assets.coingecko.com/coins/images/2822/large/huobi-token-logo.png?1547036992',
        label: 'HTX',
        category: 'CEX',
        categories: ['CEX'],
        href: "https://www.htx.com/",
        description: "HTX is one of the world's biggest Bitcoin exchanges and altcoin crypto exchanges.",
    },
    {
        image: 'https://assets.coingecko.com/markets/images/409/large/WeChat_Image_20210622160936.png?1624349423',
        label: 'MEXC',
        category: 'CEX',
        categories: ['CEX'],
        href: "https://www.mexc.com/",
        description: "MEXC is your easiest way to crypto. Explore the world's leading cryptocurrency exchange for buying, trading, and earning crypto.",
    },

    // Lending Partners
    {
        image: TOKEN_IMAGES.FRAX,
        label: 'Frax',
        category: 'LENDING',
        categories: ['LENDING', 'YIELD', 'LIQUIDITY'],
        href: "https://frax.finance/",
        description: "Frax: Decentralized stablecoin protocol with multiple tokens and supporting subprotocols.",
    },
    {
        image: 'https://assets.coingecko.com/coins/images/21630/standard/gear.png?1696520990',
        label: 'Gearbox',
        category: 'LENDING',
        categories: ['LENDING'],
        href: "https://gearbox.fi/",
        description: "Gearbox Protocol is a DeFi lending protocol that allows users to leverage their crypto assets through its smart contracts on Ethereum.",
    },
    {
        image: 'https://assets.coingecko.com/coins/images/54833/standard/RSUP-icon.png?1741965338',
        label: 'Resupply',
        category: 'LENDING',
        categories: ['LENDING', 'YIELD'],
        href: "https://resupply.fi/",
        description: "A decentralized stablecoin protocol, leveraging the liquidity and stability of lending markets.",
    },
    // Liquidity Partners
    {
        image: 'https://assets.coingecko.com/coins/images/14113/standard/Alchemix.png?1696513834',
        label: 'Alchemix',
        category: 'LIQUIDITY',
        categories: ['LIQUIDITY'],
        href: "https://alchemix.fi/",
        description: "Alchemix: Self-repaying crypto loans using future yield to mint stablecoins.",
    },
    {
        image: 'https://assets.coingecko.com/coins/images/25942/large/logo.png?1654784187',
        label: 'Aura',
        category: 'LIQUIDITY',
        categories: ['LIQUIDITY', 'YIELD'],
        href: "https://aura.finance",
        description: "Aura Finance is a protocol built on top of the Balancer system to provide maximum incentives to Balancer liquidity providers and BAL stakers.",
    },
    {
        image: 'https://assets.coingecko.com/coins/images/6319/large/USD_Coin_icon.png?1547042389',
        label: 'Circle',
        category: 'LIQUIDITY',
        categories: ['LIQUIDITY'],
        href: "https://www.circle.com/en/usdc",
        description: "USDC: Digital dollar stablecoin backed 1:1 by cash-equivalent assets.",
    },
    {
        image: 'https://assets.coingecko.com/coins/images/15585/large/convex.png?1621256328',
        label: 'Convex',
        category: 'LIQUIDITY',
        categories: ['LIQUIDITY', 'YIELD'],
        href: "https://www.convexfinance.com/",
        description: "Convex Finance is a protocol built on top of Curve Finance that optimizes yields for liquidity providers.",
    },
    {
        image: 'https://assets.coingecko.com/coins/images/30711/standard/ELX_logo_%281%29.png?1741217569',
        label: 'Elixir',
        category: 'LIQUIDITY',
        categories: ['LIQUIDITY'],
        href: "https://elixir.finance/",
        description: "Elixir is a modular DeFi protocol enabling users to supply liquidity directly to order book-based exchanges.",
    },
    {
        image: 'https://assets.coingecko.com/coins/images/30645/standard/QLLK8pmR_400x400.jpg?1696529516',
        label: 'Equilibria',
        category: 'LIQUIDITY',
        categories: ['LIQUIDITY'],
        href: "https://equilibria.fi/home",
        description: "Equilibria Finance is designed for PENDLE holders and liquidity providers, offering enhanced yields.",
    },
    {
        image: TOKEN_IMAGES.USDe,
        label: 'Ethena',
        category: 'LIQUIDITY',
        categories: ['LIQUIDITY', 'YIELD'],
        href: "https://www.ethena.fi/",
        description: "Ethena is a synthetic dollar protocol built on Ethereum.",
    },
    {
        image: 'https://assets.coingecko.com/coins/images/31889/standard/FXN_200x200.png?1696530700',
        label: 'fx protocol',
        category: 'LIQUIDITY',
        categories: ['LIQUIDITY', 'YIELD'],
        href: "https://fxprotocol.org/",
        description: "f(x) Protocol splits ETH into low-volatility stablecoins (fETH) and high-volatility leveraged tokens (xETH).",
    },
    {
        image: 'https://assets.coingecko.com/coins/images/13573/large/Lido_DAO.png?1609873644',
        label: 'Lido',
        category: 'LIQUIDITY',
        categories: ['LIQUIDITY'],
        href: "https://lido.fi/",
        description: "Lido is a liquid staking solution for Ethereum and Polygon tokens without lock-ups.",
    },
    {
        image: TOKEN_IMAGES.PYUSD,
        label: 'Paypal',
        category: 'LIQUIDITY',
        categories: ['LIQUIDITY', 'YIELD'],
        href: "https://paypal.com",
        description: "PayPal USD (PYUSD): Ethereum-based stablecoin backed 1:1 by US dollars.",
    },
    {
        image: 'https://assets.coingecko.com/coins/images/30760/standard/PNP_Token.png?1696529629',
        label: 'Penpie',
        category: 'LIQUIDITY',
        categories: ['LIQUIDITY'],
        href: "https://www.pendle.finance/",
        description: "Penpie is a next-gen DeFi platform providing Pendle Finance users with yield and veTokenomics boosting.",
    },
    {
        image: TOKEN_IMAGES.USR,
        label: 'Resolv',
        category: 'LIQUIDITY',
        categories: ['LIQUIDITY', 'YIELD'],
        href: "https://resolv.fi/",
        description: "Resolv maintains USR, a stablecoin natively backed by Ether (ETH) and Bitcoin (BTC).",
    },
    {
        image: 'https://assets.coingecko.com/coins/images/44/standard/xrp-symbol-white-128.png?1696501442',
        label: 'Ripple',
        category: 'LIQUIDITY',
        categories: ['LIQUIDITY'],
        href: "https://ripple.com/",
        description: "Ripple is a blockchain-based digital payment company focusing on fast, low-cost international money transfers.",
    },
    {
        image: 'https://assets.coingecko.com/coins/images/39925/standard/sky.jpg?1724827980',
        label: 'SkyEcosystem',
        category: 'LIQUIDITY',
        categories: ['LIQUIDITY'],
        href: "https://sky.finance/",
        description: "Sky is a decentralized stablecoin protocol with USDS and SKY tokens.",
    },
    {
        image: 'https://assets.coingecko.com/coins/images/13724/large/stakedao_logo.jpg?1696513468',
        label: 'StakeDAO',
        category: 'LIQUIDITY',
        categories: ['LIQUIDITY'],
        href: "https://stakedao.org/",
        description: "Stake DAO is a non-custodial liquid staking platform focused on governance tokens.",
    },
    {
        image: 'https://assets.coingecko.com/coins/images/17495/standard/tokemak-avatar-200px-black.png?1696517036',
        label: 'Tokemak',
        category: 'LIQUIDITY',
        categories: ['LIQUIDITY', 'YIELD'],
        href: "https://www.tokemak.xyz/",
        description: "Tokemak is a decentralized liquidity-providing and market-making protocol.",
    },
    {
        image: 'https://assets.coingecko.com/coins/images/11849/large/yfi-192x192.png?1598325330',
        label: 'Yearn',
        category: 'LIQUIDITY',
        categories: ['LIQUIDITY', 'YIELD'],
        href: "https://yearn.finance/",
        description: "Yearn Finance automatically moves users' deposits between lending protocols to maximize yield returns.",
    },
    {
        image: 'https://assets.coingecko.com/coins/images/53607/standard/yUSD.png?1739862886',
        label: 'YieldFi',
        category: 'LIQUIDITY',
        categories: ['LIQUIDITY', 'YIELD'],
        href: "https://yieldfi.xyz/",
        description: "YieldFi is a fully on-chain asset management platform designed as a fund of funds for DeFi.",
    },
    // Yield Partners
    {
        image: 'https://assets.coingecko.com/coins/images/12704/large/token.png?1601876182',
        label: 'Beefy',
        category: 'YIELD',
        categories: ['YIELD'],
        href: "https://beefy.com",
        description: "Beefy automates yield farming to make DeFi easy, safe and efficient through autocompounding.",
    },
    {
        image: 'https://assets.coingecko.com/coins/images/30973/standard/Ex_logo-white-blue_ring_288x.png?1696529812',
        label: 'Extra',
        category: 'YIELD',
        categories: ['YIELD'],
        href: "https://app.extrafi.io/",
        description: "Extra Finance is a community-driven lending and leveraged yield farming protocol on Optimism and Base.",
    },
    {
        image: 'https://icons.llamao.fi/icons/protocols/dyson?w=48&h=48',
        label: 'Dyson',
        category: 'YIELD',
        categories: ['YIELD'],
        href: "https://dyson.money/",
        description: "Dyson Finance is a DEX that simplifies liquidity provision through dual investment.",
    },
    {
        image: 'https://assets.coingecko.com/coins/images/15069/large/Pendle_Logo_Normal-03.png?1696514728',
        label: 'Pendle',
        category: 'YIELD',
        categories: ['YIELD'],
        href: "https://pendle.finance/",
        description: "Pendle Finance enables trading of tokenized future yield on an AMM system.",
    },
    {
        image: 'https://assets.coingecko.com/coins/images/52854/large/spectra.jpg?1734517434',
        label: 'Spectra',
        category: 'YIELD',
        categories: ['YIELD'],
        href: "https://app.spectra.finance/fixed-rate",
        description: "Spectra Finance is an open-source DeFi protocol enabling users to create, trade, and manage interest rate derivatives.",
    },
    {
        image: 'https://icons.llamao.fi/icons/protocols/napier?w=48&h=48',
        label: 'Napier',
        category: 'YIELD',
        categories: ['YIELD'],
        href: "https://napier.fi/",
        description: "Napier Finance is a modular yield tokenization protocol on the Ethereum Virtual Machine.",
    },
    // Security Partners
    {
        image: '/assets/v2/landing/nomoi.png',
        label: 'Nomoi',
        category: 'SECURITY',
        categories: ['SECURITY'],
        href: "https://nomoi.xyz/",
        description: "Nomoi is a boutique Web3 hacker collective providing comprehensive security audits for DeFi protocols.",
    },
    {
        image: '/assets/landing/yAudit.jpg',
        label: 'yAudit',
        category: 'SECURITY',
        categories: ['SECURITY'],
        href: "https://electisec.com/",
        description: "yAudit is a security auditing firm spun out of Yearn Finance, focusing on smart contract audits.",
    },
    {
        image: '/assets/v2/landing/code4arena.png',
        label: 'Code4Arena',
        category: 'SECURITY',
        categories: ['SECURITY'],
        href: "https://code4arena.com/",
        description: "Code4rena security auditors (Wardens) compete to find high-severity vulnerabilities.",
    },
    {
        image: '/assets/v2/landing/peckshield.png',
        label: 'Peckshield',
        category: 'SECURITY',
        categories: ['SECURITY'],
        href: "https://peckshield.com/",
        description: "PeckShield: Leading blockchain security auditor for smart contracts and protocols.",
    },
    {
        image: '/assets/partners/immunefi.svg',
        label: 'ImmuneFi',
        category: 'SECURITY',
        categories: ['SECURITY'],
        href: "https://immunefi.com/",
        description: "Immunefi offers large bug bounties for securing web3 projects.",
    },
    {
        image: '/assets/v2/landing/defimoon.png',
        label: 'DeFiMoon',
        category: 'SECURITY',
        categories: ['SECURITY'],
        href: "https://defimoon.xyz/",
        description: "DeFi Moon: Boutique auditing firm specializing in smart contract security reviews.",
    },
    // Chains
    {
        image: 'https://assets.coingecko.com/coins/images/279/large/ethereum.png?1595348880',
        label: 'Ethereum',
        category: 'CHAIN',
        categories: ['CHAIN'],
        href: "https://ethereum.org/",
        description: "Decentralized blockchain platform enabling smart contracts and cryptocurrency transactions."
    },
    {
        image: '/assets/networks/base.svg',
        label: 'Base',
        category: 'CHAIN',
        categories: ['CHAIN'],
        href: "https://base.org/",
        description: "Ethereum Layer 2 blockchain by Coinbase for faster, cheaper transactions."
    },
    {
        image: '/assets/networks/optimism.svg',
        label: 'Optimism',
        category: 'CHAIN',
        categories: ['CHAIN'],
        href: "https://www.optimism.io/",
        description: "Ethereum layer-2 scaling solution using optimistic rollups for faster, cheaper transactions."
    },
    {
        image: '/assets/networks/arbitrum.png',
        label: 'Arbitrum',
        category: 'CHAIN',
        categories: ['CHAIN'],
        href: "https://arbitrum.io/",
        description: "Ethereum Layer 2 scaling solution using optimistic rollups for faster, cheaper transactions."
    },
    {
        image: 'https://assets.coingecko.com/coins/images/34979/standard/MODE.jpg?1714561871',
        label: 'Mode',
        category: 'CHAIN',
        categories: ['CHAIN'],
        href: "https://www.mode.network/",
        description: "Mode is an Ethereum Layer 2 blockchain focused on scaling decentralized applications with high throughput and low fees."
    },
    {
        image: '/assets/networks/polygon.png',
        label: 'Polygon',
        category: 'CHAIN',
        categories: ['CHAIN'],
        href: "https://polygon.technology/",
        description: "Polygon is a multi-chain Ethereum scaling platform with support for zkEVM, PoS, and supernets, enhancing Ethereum's scalability and usability."
    },
    // Infrastructure Partners
    {
        image: 'https://assets.coingecko.com/coins/images/877/standard/chainlink-new-logo.png?1696502009',
        label: 'Chainlink',
        category: 'INFRA',
        categories: ['INFRA'],
        href: "https://chain.link/",
        description: "Chainlink is a decentralized oracle network providing secure data feeds to smart contracts.",
    },
    {
        image: '/assets/landing/debank.jpg',
        label: 'Debank',
        category: 'INFRA',
        categories: ['INFRA'],
        href: "https://debank.com/",
        description: "DeBank is a comprehensive DeFi portfolio tracking and management platform.",
    },
    {
        image: '/assets/landing/enso.jpeg',
        label: 'Enso',
        category: 'INFRA',
        categories: ['INFRA'],
        href: "https://www.enso.build/",
        description: "Enso: Universal DeFi dashboard for bundled, optimized multi-protocol interactions.",
    },
    {
        image: 'https://assets.coingecko.com/coins/images/11810/large/nexus-mutual.jpg?1594547726',
        label: 'Nexus Mutual',
        category: 'INFRA',
        categories: ['INFRA'],
        href: "https://nexusmutual.io/",
        description: "Nexus Mutual is a decentralized insurance protocol providing smart contract cover for DeFi.",
    },
    {
        image: 'https://octav.fi/wp-content/uploads/2025/04/favico-150x150.png',
        label: 'Octav',
        category: 'INFRA',
        categories: ['INFRA'],
        href: "https://octav.fi/",
        description: "Octav is a web3 accounting platform that categorizes and reconciles on-chain transactions.",
    },
    {
        image: 'https://icons.llamao.fi/icons/protocols/safe?w=48&h=48',
        label: 'Safe',
        category: 'INFRA',
        categories: ['INFRA'],
        href: "https://safe.global/",
        description: "Safe is a platform to manage digital assets on Ethereum, powering multisig wallets for teams and DAOs.",
    },
    {
        image: 'https://icons.llamao.fi/icons/protocols/snapshot?w=48&h=48',
        label: 'Snapshot',
        category: 'INFRA',
        categories: ['INFRA'],
        href: "https://snapshot.org/",
        description: "Snapshot enables gasless, off-chain governance voting for DAOs and web3 communities.",
    },
    {
        image: 'https://icons.llamao.fi/icons/protocols/socket-protocol?w=48&h=48',
        label: 'Socket',
        category: 'INFRA',
        categories: ['INFRA'],
        href: "https://sockettech.io/",
        description: "Socket DeFi tools protocol facilitates decentralized finance applications.",
    },
    {
        image: 'https://tenderly.co/tenderly-favicon.ico',
        label: 'Tenderly',
        category: 'INFRA',
        categories: ['INFRA'],
        href: "https://tenderly.co/",
        description: "Tenderly is a Web3 developer platform offering monitoring and debugging tools for smart contracts.",
    },
    {
        image: 'https://assets.coingecko.com/coins/images/13397/large/Graph_Token.png?1608145566',
        label: 'The Graph',
        category: 'INFRA',
        categories: ['INFRA'],
        href: "https://thegraph.com/",
        description: "The Graph is a decentralized protocol for indexing and querying blockchain data using GraphQL.",
    },
    {
        image: 'https://assets.coingecko.com/coins/images/38689/standard/zapper.jpg?1718345015',
        label: 'Zapper',
        category: 'INFRA',
        categories: ['INFRA'],
        href: "https://zapper.fi/",
        description: "Zapper is a DeFi dashboard for managing assets across multiple protocols.",
    },
    {
        image: 'https://icons.llamao.fi/icons/protocols/zerion-wallet?w=48&h=48',
        label: 'Zerion',
        category: 'INFRA',
        categories: ['INFRA'],
        href: "https://zerion.io/",
        description: "Zerion: User-friendly DeFi aggregator for managing crypto assets and investments.",
    },
];

const COUNTS_PER_CAT = ecosystemData.reduce((acc, el) => {
    acc[el.category] = (acc[el.category] || 0) + 1;
    el.categories?.forEach(category => {
        if (category && category !== el.category) {
            acc[category] = (acc[category] || 0) + 1;
        }
    });
    return acc;
}, {});

COUNTS_PER_CAT['CHAIN'] = 7;

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

const CellBig = ({ children, isInvisible, isInteractive }: { children: React.ReactNode, isInvisible?: boolean, isInteractive?: boolean }) => {
    return <VStack opacity={isInvisible ? 0 : 1} alignItems="center" justifyContent="center" w={{ base: '150px', md: '400px' }} h={{ base: '135px', md: '360px' }} boxShadow={isInteractive ? '0 0 0 1px transparent' : '0 0 0 1px lightgray'}>
        {children}
    </VStack>
}

const CellBigGrid = ({ children, isInvisible, isInteractive }: { children: React.ReactNode, isInvisible?: boolean, isInteractive?: boolean }) => {
    return <SimpleGrid opacity={isInvisible ? 0 : 1} columns={2} alignItems="center" justifyContent="center" w={{ base: '150px', md: '400px' }} h={{ base: '135px', md: '360px' }} boxShadow={isInteractive ? '0 0 0 1px transparent' : '0 0 0 1px lightgray'}>
        {children}
    </SimpleGrid>
}

const CellSmaller = ({ children, isInvisible, isInteractive }: { children: React.ReactNode, isInvisible?: boolean, isInteractive?: boolean }) => {
    return <SimpleGrid opacity={isInvisible ? 0 : 1} columns={2} alignItems="center" justifyContent="center" w={{ base: '150px', md: '400px' }} h={{ base: '90px', md: '240px' }} boxShadow={isInteractive ? '0 0 0 1px transparent' : '0 0 0 1px lightgray'}>
        {children}
    </SimpleGrid>
}

const CellItem = ({ children, onHover, isCategoryHovered, isInteractive, hoveredCategory }: { children: React.ReactNode, category?: string, onHover?: () => void, isCategoryHovered?: boolean, isInteractive?: boolean, isYo?: boolean, hoveredCategory?: string }) => {
    const [enableColor, setEnableColor] = useState(false);

    useInterval(() => {
        const random = Math.random();
        setEnableColor(random > 0.5);
    }, 1000);

    const isCategoryItemHovered = !!onHover && isCategoryHovered;

    return <VStack filter={enableColor || isCategoryHovered ? 'grayscale(0%)' : 'grayscale(100%)'}
        alignItems="center"
        justifyContent="center"
        w={{ base: '75px', md: '200px' }}
        h={{ base: '45px', md: '120px' }}
        border={isCategoryItemHovered ? '2px solid #00000099' : 'unset'}
        boxShadow={isCategoryItemHovered ? 'inset 0 0 0 4px white' : isInteractive ? '0 0 0 1px transparent' : '0 0 0 1px lightgray'}
        transition="filter 0.25s ease-in-out"
        bgColor={isCategoryItemHovered ? '#D5C6FC' : 'unset'}
        onMouseEnter={() => {
            if (!onHover) return;
            onHover();
        }}
    >
        {(isInteractive && isCategoryHovered) || !isInteractive ? children : null}
    </VStack>
}

const CellText = ({ children }: { children: React.ReactNode }) => {
    return <LandingHeading fontSize={{ base: '8px', md: '16px' }} fontWeight="bold" textAlign="center">
        {children}
    </LandingHeading>
}

const CategoryItem = ({ isInteractive, hoveredCategory, onHover, category }: { isInteractive: boolean, hoveredCategory: string, category: string, onHover: (category: string) => void }) => {
    const isCategoryHovered = hoveredCategory === category;
    return <VStack>
        <CellItem isInteractive={isInteractive} isCategoryHovered={isCategoryHovered} onHover={() => onHover?.(category)}>
            <CellText>
                {isCategoryHovered ? `${COUNTS_PER_CAT[category]} ` : null}
                {category}
                {isCategoryHovered ? ` Partners` : null}
                {isCategoryHovered && <><br /><ArrowForwardIcon /></>}
            </CellText>
        </CellItem>
    </VStack>
}

export const EcosystemGrid = ({ onHover, hoveredCategory }: { onHover?: (category: string) => void, hoveredCategory?: string }) => {
    const isInteractive = !!onHover;
    return <VStack position="relative" w='full' spacing="0">
        {
            !isInteractive && <VStack w='full' position="absolute" top="0" left="0" right="0" bottom="0" zIndex="1"
                bg="radial-gradient(circle, rgba(255,255,255,0) 0%, rgba(255,255,255,1) 66%)"
                boxShadow="0 0 0 10px white"
            ></VStack>
        }
        <VStack boxShadow="inset 0 0 0 1px white" spacing="0" display="grid" w='full' alignItems="center" justify="center">
            <HStack spacing="0" w='full' maxW="1300px" >
                <CellSmaller isInteractive={isInteractive} isInvisible={isInteractive && hoveredCategory !== 'DEX'}>
                    <CellItem isInteractive={isInteractive} isCategoryHovered={hoveredCategory === 'DEX'}>
                        <EcoCellItem project="Velodrome" />
                    </CellItem>
                    <CellItem isInteractive={isInteractive} isCategoryHovered={hoveredCategory === 'DEX'}>
                        <EcoCellItem project="Aerodrome" />
                    </CellItem>
                    <CellItem isInteractive={isInteractive} isCategoryHovered={hoveredCategory === 'DEX'}>
                        <EcoCellItem project="Balancer" />
                    </CellItem>
                    <CategoryItem isInteractive={isInteractive} category="DEX" hoveredCategory={hoveredCategory} onHover={onHover} />
                </CellSmaller>
                <CellSmaller isInteractive={isInteractive} isInvisible={isInteractive && hoveredCategory !== 'LENDING'}>
                    <CellItem isInteractive={isInteractive} isCategoryHovered={hoveredCategory === 'LENDING'}>
                        <EcoCellItem project="Resupply" />
                    </CellItem>
                    <CellItem isInteractive={isInteractive} isCategoryHovered={hoveredCategory === 'LENDING'}>
                        <EcoCellItem project="Frax" />
                    </CellItem>
                    <CellItem isInteractive={isInteractive} isCategoryHovered={hoveredCategory === 'LENDING'}>
                        <EcoCellItem project="Curve" />
                    </CellItem>
                    <CategoryItem isInteractive={isInteractive} category="LENDING" hoveredCategory={hoveredCategory} onHover={onHover} />
                </CellSmaller>
                <CellSmaller isInteractive={isInteractive} isInvisible={isInteractive && hoveredCategory !== 'YIELD'}>
                    <CellItem isInteractive={isInteractive} isCategoryHovered={hoveredCategory === 'YIELD'}>
                        <EcoCellItem project="Convex" />
                    </CellItem>
                    <CellItem isInteractive={isInteractive} isCategoryHovered={hoveredCategory === 'YIELD'}>
                        <EcoCellItem project="Beefy" />
                    </CellItem>
                    <CategoryItem isInteractive={isInteractive} category="YIELD" hoveredCategory={hoveredCategory} onHover={onHover} />
                    <CellItem isInteractive={isInteractive} isCategoryHovered={hoveredCategory === 'YIELD'}>
                        <EcoCellItem project="Yearn" />
                    </CellItem>
                </CellSmaller>
            </HStack>
            <HStack spacing="0" w='full' maxW="1300px" >
                <CellBigGrid isInteractive={isInteractive} isInvisible={isInteractive && hoveredCategory !== 'CHAIN'}>
                    <CellItem isInteractive={isInteractive} isCategoryHovered={hoveredCategory === 'CHAIN'}>
                        <NetworkImage chainId={10} size={{ base: '25px', md: '50px' }} />
                    </CellItem>
                    <CellItem isInteractive={isInteractive} isCategoryHovered={hoveredCategory === 'CHAIN'}>
                        <NetworkImage chainId={8453} size={{ base: '25px', md: '50px' }} />
                    </CellItem>
                    <CellItem isInteractive={isInteractive} isCategoryHovered={hoveredCategory === 'CHAIN'}>
                        <NetworkImage chainId={42161} size={{ base: '25px', md: '50px' }} />
                    </CellItem>
                    <CategoryItem isInteractive={isInteractive} category="CHAIN" hoveredCategory={hoveredCategory} onHover={onHover} />
                    <CellItem isInteractive={isInteractive} isCategoryHovered={hoveredCategory === 'CHAIN'}>
                        <NetworkImage chainId={43114} size={{ base: '25px', md: '50px' }} />
                    </CellItem>
                    <CellItem isInteractive={isInteractive} isCategoryHovered={hoveredCategory === 'CHAIN'}>
                        <NetworkImage chainId={1} size={{ base: '25px', md: '50px' }} />
                    </CellItem>
                </CellBigGrid>
                <CellBig>
                    <Logo boxSize={{ base: '50px', md: '150px' }} noFilter={true} />
                </CellBig>
                <CellBigGrid isInteractive={isInteractive} isInvisible={isInteractive && hoveredCategory !== 'SECURITY'}>
                    <CellItem isInteractive={isInteractive} isCategoryHovered={hoveredCategory === 'SECURITY'}>
                        <EcoCellItem width={50} project="ImmuneFi" />
                    </CellItem>
                    <CellItem isInteractive={isInteractive} isCategoryHovered={hoveredCategory === 'SECURITY'}>
                        <EcoCellItem width={50} project="yAudit" />
                    </CellItem>
                    <CategoryItem isInteractive={isInteractive} category="SECURITY" hoveredCategory={hoveredCategory} onHover={onHover} />
                    <CellItem isInteractive={isInteractive} isCategoryHovered={hoveredCategory === 'SECURITY'}>
                        <EcoCellItem width={50} project="DeFiMoon" />
                    </CellItem>
                    <CellItem isInteractive={isInteractive} isCategoryHovered={hoveredCategory === 'SECURITY'}>
                        <EcoCellItem width={50} project="Nomoi" />
                    </CellItem>
                    <CellItem isInteractive={isInteractive} isCategoryHovered={hoveredCategory === 'SECURITY'}>
                        <EcoCellItem width={50} project="Code4Arena" />
                    </CellItem>
                </CellBigGrid>
            </HStack>
            <HStack spacing="0" w='full' maxW="1300px" >
                <CellSmaller isInteractive={isInteractive} isInvisible={isInteractive && hoveredCategory !== 'INFRA'}>
                    <CellItem isInteractive={isInteractive} isCategoryHovered={hoveredCategory === 'INFRA'}>
                        <EcoCellItem project="Chainlink" />
                    </CellItem>
                    <CategoryItem isInteractive={isInteractive} category="INFRA" hoveredCategory={hoveredCategory} onHover={onHover} />
                    <CellItem isInteractive={isInteractive} isCategoryHovered={hoveredCategory === 'INFRA'}>
                        <EcoCellItem width={50} project="Debank" />
                    </CellItem>
                    <CellItem isInteractive={isInteractive} isCategoryHovered={hoveredCategory === 'INFRA'}>
                        <EcoCellItem project="Enso" />
                    </CellItem>
                </CellSmaller>
                <CellSmaller isInteractive={isInteractive} isInvisible={isInteractive && hoveredCategory !== 'CEX'}>
                    <CategoryItem isInteractive={isInteractive} category="CEX" hoveredCategory={hoveredCategory} onHover={onHover} />
                    <CellItem isInteractive={isInteractive} isCategoryHovered={hoveredCategory === 'CEX'}>
                        <EcoCellItem project="Coinbase" />
                    </CellItem>
                    <CellItem isInteractive={isInteractive} isCategoryHovered={hoveredCategory === 'CEX'}>
                        <EcoCellItem project="HTX" />
                    </CellItem>
                    <CellItem isInteractive={isInteractive} isCategoryHovered={hoveredCategory === 'CEX'}>
                        <EcoCellItem project="MEXC" />
                    </CellItem>
                </CellSmaller>
                <CellSmaller isInteractive={isInteractive} isInvisible={isInteractive && hoveredCategory !== 'LIQUIDITY'}>
                    <CategoryItem isInteractive={isInteractive} category="LIQUIDITY" hoveredCategory={hoveredCategory} onHover={onHover} />
                    <CellItem isInteractive={isInteractive} isCategoryHovered={hoveredCategory === 'LIQUIDITY'}>
                        <EcoCellItem project="Ethena" />
                    </CellItem>
                    <CellItem isInteractive={isInteractive} isCategoryHovered={hoveredCategory === 'LIQUIDITY'}>
                        <EcoCellItem project="Paypal" />
                    </CellItem>
                    <CellItem isInteractive={isInteractive} isCategoryHovered={hoveredCategory === 'LIQUIDITY'}>
                        <EcoCellItem project="Resolv" />
                    </CellItem>
                </CellSmaller>
            </HStack>
        </VStack>
    </VStack>
}