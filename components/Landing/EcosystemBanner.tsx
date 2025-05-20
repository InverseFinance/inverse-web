import { Text, HStack, Image } from '@chakra-ui/react';
import { lightTheme } from '@app/variables/theme';
import { TOKEN_IMAGES } from '@app/variables/images';

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
    },
    {
        image: 'https://assets.coingecko.com/coins/images/15585/large/convex.png?1621256328',
        label: 'Convex',
        href: '',
    },
    {
        image: 'https://assets.coingecko.com/coins/images/11849/large/yfi-192x192.png?1598325330',
        label: 'Yearn',
        href: '',
    },
    {
        image: '/assets/projects/coinbase.svg',
        label: 'Coinbase',
        href: '',
    },
    {
        image: TOKEN_IMAGES.VELO,
        label: 'Velodrome',
        href: '',
    },
    {
        image: TOKEN_IMAGES.AERO,
        label: 'Aerodrome',
        href: '',
    },
    {
        image: 'https://assets.coingecko.com/coins/images/11683/large/Balancer.png?1592792958',
        label: 'Balancer',
        href: '',
    },
    {
        image: 'https://assets.coingecko.com/coins/images/25942/large/logo.png?1654784187',
        label: 'Aura',
        href: '',
    },
    {
        image: 'https://assets.coingecko.com/coins/images/15069/large/Pendle_Logo_Normal-03.png?1696514728',
        label: 'Pendle',
        href: '',
    },
    {
        image: 'https://assets.coingecko.com/coins/images/52854/large/spectra.jpg?1734517434',
        label: 'Spectra',
        href: '',
    },
    {
        image: TOKEN_IMAGES.THENA,
        label: 'Thena',
        href: '',
    },
    {
        image: 'https://assets.coingecko.com/coins/images/54833/standard/RSUP-icon.png?1741965338',
        label: 'Resupply',
        href: '',
    },
];

export const EcosystemBanner = () => {
    return <HStack className="banner" bgColor="white" pb="2" pt="2">
        <HStack className="banner-track">
            {data.map((el,i) => <EcoElement key={i} {...el} />)}
            {/* duplicate for smooth banner auto-scroll */}
            {data.map((el,i) => <EcoElement key={i} {...el} />)}
        </HStack>
    </HStack>
}