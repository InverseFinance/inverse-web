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

const data = [
    {
        image: 'https://assets.coingecko.com/coins/images/12124/large/Curve.png',
        label: 'Curve',
        href: '',
        category: 'DEX',
    },
    {
        image: 'https://assets.coingecko.com/coins/images/15585/large/convex.png?1621256328',
        label: 'Convex',
        href: '',
        category: 'YIELD',
    },
    {
        image: 'https://assets.coingecko.com/coins/images/11849/large/yfi-192x192.png?1598325330',
        label: 'Yearn',
        href: '',
        category: 'YIELD',
    },
    {
        image: '/assets/projects/coinbase.svg',
        label: 'Coinbase',
        href: '',
        category: 'CEX',
    },
    {
        image: TOKEN_IMAGES.VELO,
        label: 'Velodrome',
        href: '',
        category: 'DEX',
    },
    {
        image: TOKEN_IMAGES.AERO,
        label: 'Aerodrome',
        href: '',
        category: 'DEX',
    },
    {
        image: 'https://assets.coingecko.com/coins/images/11683/large/Balancer.png?1592792958',
        label: 'Balancer',
        href: '',
        category: 'DEX',
    },
    {
        image: 'https://assets.coingecko.com/coins/images/25942/large/logo.png?1654784187',
        label: 'Aura',
        href: '',
        category: 'YIELD',
    },
    {
        image: 'https://assets.coingecko.com/coins/images/15069/large/Pendle_Logo_Normal-03.png?1696514728',
        label: 'Pendle',
        href: '',
        category: 'YIELD',
    },
    {
        image: 'https://assets.coingecko.com/coins/images/52854/large/spectra.jpg?1734517434',
        label: 'Spectra',
        href: '',
        category: 'YIELD',
    },
    {
        image: TOKEN_IMAGES.THENA,
        label: 'Thena',
        href: '',
        category: 'DEX',
    },
    {
        image: 'https://assets.coingecko.com/coins/images/54833/standard/RSUP-icon.png?1741965338',
        label: 'Resupply',
        href: '',
        category: 'LENDING',
    },
    {
        image: 'https://assets.coingecko.com/coins/images/2822/large/huobi-token-logo.png?1547036992',
        label: 'Huobi',
        href: '',
        category: 'CEX',
    },
    {
        image: 'https://assets.coingecko.com/markets/images/409/large/WeChat_Image_20210622160936.png?1624349423',
        label: 'MEXC',
        href: '',
        category: 'CEX',
    },
    {
        image: TOKEN_IMAGES.FRAX,
        label: 'Frax',
        href: '',
        category: 'LENDING',
    },
    {
        image: 'https://assets.coingecko.com/coins/images/12704/large/token.png?1601876182',
        label: 'Beefy',
        href: '',
        category: 'YIELD',
    },
    {
        image: '/assets/partners/immunefi.svg',
        label: 'Immunefi',
        href: '',
        category: 'SECURITY',
    },
    {
        image: '/assets/v2/landing/nomoi.png',
        label: 'Nomoi',
        href: '',
        category: 'SECURITY',
    },
    {
        image: '/assets/v2/landing/code4arena.png',
        label: 'Code4Arena',
        href: '',
        category: 'SECURITY',
    },
    {
        image: '/assets/landing/yAudit.jpg',
        label: 'yAudit',
        href: '',
        category: 'SECURITY',
    },
    {
        image: '/assets/v2/landing/defimoon.png',
        label: 'Defimoon',
        href: '',
        category: 'SECURITY',
    },
    {
        image: 'https://assets.coingecko.com/coins/images/877/standard/chainlink-new-logo.png?1696502009',
        label: 'Chainlink',
        href: '',
        category: 'INFRASTRUCTURE',
    },
    {
        image: '/assets/landing/enso.jpeg',
        label: 'Enso',
        href: '',
        category: 'INFRASTRUCTURE',
    },
    {
        image: '/assets/landing/debank.jpg',
        label: 'Debank',
        href: '',
        category: 'INFRASTRUCTURE',
    },
    {
        image: TOKEN_IMAGES.USR,
        label: 'USR',
        href: '',
        category: 'LIQUIDITY',
    },
    {
        image: TOKEN_IMAGES.CRVUSD,
        label: 'CrvUSD',
        href: '',
        category: 'LIQUIDITY',
    },
    {
        image: TOKEN_IMAGES.PYUSD,
        label: 'PayPal',
        href: '',
        category: 'LIQUIDITY',
    },
];

const projectImages = data.reduce((acc, el) => {
    acc[el.label] = el.image;
    return acc;
}, {});

const EcoCellItem = ({ project, width = '50px' }: { project: string, width?: string }) => {
    return <Image borderRadius='full' src={projectImages[project]!} width={width} alt={project} />
}

const bannerItems = data.slice(0, 10);

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
    return <VStack alignItems="center" justifyContent="center" w="400px" h="360px" boxShadow="0 0 0 1px lightgray">
        {children}
    </VStack>
}

const CellBigGrid = ({ children }: { children: React.ReactNode }) => {
    return <SimpleGrid columns={2} alignItems="center" justifyContent="center" w="400px" h="360px" boxShadow="0 0 0 1px lightgray">
        {children}
    </SimpleGrid>
}

const CellSmaller = ({ children }: { children: React.ReactNode }) => {
    return <SimpleGrid columns={2} alignItems="center" justifyContent="center" w="400px" h="240px" boxShadow="0 0 0 1px lightgray">
        {children}
    </SimpleGrid>
}

const CellItem = ({ children }: { children: React.ReactNode }) => {
    const [enableColor, setEnableColor] = useState(false);

    useInterval(() => {
        const random = Math.random();
        setEnableColor(random > 0.5);
    }, 1000);

    return <VStack filter={enableColor ? 'grayscale(0%)' : 'grayscale(100%)'} alignItems="center" justifyContent="center" w="200px" h="120px" boxShadow="0 0 0 1px lightgray"
        transition="filter 0.25s ease-in-out"
    >
        {children}
    </VStack>
}

const CellText = ({ children }: { children: React.ReactNode }) => {
    return <LandingHeading fontSize="20px" fontWeight="bold">
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
                        <NetworkImage chainId={10} />
                    </CellItem>
                    <CellItem>
                        <NetworkImage chainId={8453} />
                    </CellItem>
                    <CellItem>
                        <NetworkImage chainId={42161} />
                    </CellItem>
                    <CellItem>
                        <CellText>
                            Chains
                        </CellText>
                    </CellItem>
                    <CellItem>
                        <NetworkImage chainId={43114} />
                    </CellItem>
                    <CellItem>
                        <NetworkImage chainId={1} />
                    </CellItem>
                </CellBigGrid>
                <CellBig>
                    <Logo boxSize={'150px'} noFilter={true} />
                </CellBig>
                <CellBigGrid>
                    <CellItem>
                        <EcoCellItem width="75px" project="Immunefi" />
                    </CellItem>
                    <CellItem>
                        <EcoCellItem width="75px" project="yAudit" />
                    </CellItem>
                    <CellItem>
                        <CellText>
                            Security
                        </CellText>
                    </CellItem>
                    <CellItem>
                        <EcoCellItem width="75px" project="Defimoon" />
                    </CellItem>
                    <CellItem>
                        <EcoCellItem width="75px" project="Nomoi" />
                    </CellItem>
                    <CellItem>
                        <EcoCellItem width="75px" project="Code4Arena" />
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
                        <EcoCellItem width="75px" project="Debank" />
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