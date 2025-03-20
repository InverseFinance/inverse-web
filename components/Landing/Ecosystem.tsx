import { Tabs, TabList, Tab, Text, HStack, Image } from '@chakra-ui/react';
import { lightTheme } from '@app/variables/theme';
import { SimpleCard } from '../common/Cards/Simple';
import { useState } from 'react';
import { TOKEN_IMAGES } from '@app/variables/images';

const selected = {
    _after: {
        content: '""',
        position: "absolute",
        width: '40px',
        height: '8px',
        bottom: 0,
        backgroundColor: lightTheme.colors.accentTextColor,
        transform: 'rotate(-1deg)'
    },
    
}

const tabProps = { 
    fontWeight: 'bold',
    _focus: {},
    color: lightTheme.colors.mainTextColor,
    _selected: selected,
    px: '8',
    fontSize: '20px',
}

const EcoElement = ({
    image,
    label,
    href,
}: {
    image: string,
    label: string,
    href: string,
}) => {
    return <SimpleCard minW="200px" w='230px' px="8" py='10' maxH='120px' boxShadow="0 0 10px 1px #ccc">
        <HStack w='full' justify="center">
            <Image src={image} height='40px' alt={label} />
            <Text color={lightTheme.colors.mainTextColor} fontWeight='bold' fontSize='16px'>
                {label}
            </Text>
        </HStack>
    </SimpleCard>;
}

const data = [
    {
        tab: 'DEX',
        elements: [
            {
                image: 'https://assets.coingecko.com/coins/images/12124/large/Curve.png',
                label: 'Curve',
                href: '',
            },
            {
                image: 'https://assets.coingecko.com/coins/images/12271/large/512x512_Logo_no_chop.png?1606986688',
                label: 'Sushi',
                href: '',
            },
            {
                image: 'https://assets.coingecko.com/coins/images/12504/large/uniswap-uni.png?1600306604',
                label: 'Uniswap',
                href: '',
            },
            {
                image: 'https://s2.coinmarketcap.com/static/img/coins/128x128/20435.png',
                label: 'Velodrome',
                href: '',
            },
            {
                image: 'https://assets.coingecko.com/coins/images/11683/large/Balancer.png?1592792958',
                label: 'Balancer',
                href: '',
            },
            {
                image: TOKEN_IMAGES.THENA,
                label: 'Thena',
                href: '',
            },
            {
                image: TOKEN_IMAGES.RAM,
                label: 'Ramses',
                href: '',
            },
        ],
    },
    {
        tab: 'YIELD',
        elements: [
            {
                image: 'https://assets.coingecko.com/coins/images/12124/large/Curve.png',
                label: 'Curve',
                href: '',
            },{
                image: 'https://assets.coingecko.com/coins/images/15585/large/convex.png?1621256328',
                label: 'Convex',
                href: '',
            },
            {
                image: 'https://assets.coingecko.com/coins/images/25942/large/logo.png?1654784187',
                label: 'Aura',
                href: '',
            },{
                image: 'https://assets.coingecko.com/coins/images/17881/large/tarot-200px.png?1629704943',
                label: 'Tarot',
                href: '',
            },
            {
                image: 'https://assets.coingecko.com/coins/images/12704/large/token.png?1601876182',
                label: 'Beefy',
                href: '',
            },{
                image: 'https://assets.coingecko.com/coins/images/11849/large/yfi-192x192.png?1598325330',
                label: 'Yearn',
                href: '',
            },
            {
                image: 'https://assets.coingecko.com/coins/images/11683/large/Balancer.png?1592792958',
                label: 'Balancer',
                href: '',
            },
        ],
    },
    {
        tab: 'CEX',
        elements: [
            {
                image: '/assets/projects/coinbase.svg',
                label: 'Coinbase',
                href: '',
            },{
                image: 'https://assets.coingecko.com/coins/images/2822/large/huobi-token-logo.png?1547036992',
                label: 'Huobi',
                href: '',
            },{
                image: 'https://assets.coingecko.com/markets/images/409/large/WeChat_Image_20210622160936.png?1624349423',
                label: 'MEXC',
                href: '',
            },
        ],
    },
    {
        tab: 'INTERFACES',
        elements: [
            {
                image: 'https://studio.zapper.fi/img/logo.png',
                label: 'Zapper',
                href: '',
            },
            {
                image: '/assets/projects/zerion.svg',
                label: 'Zerion',
                href: '',
            },
            {
                image: 'https://assets.debank.com/static/media/logo-mini.db43c06d.svg',
                label: 'DeBank',
                href: '',
            }
        ],
    },
    {
        tab: 'WALLETS',
        elements: [
            {
                image: '/assets/wallets/Metamask.png',
                label: 'Metamask',
                href: '',
            },
            {
                image: '/assets/wallets/coinbase.webp',
                label: 'Coinbase',
                href: '',
            },
            {
                image: '/assets/wallets/WalletConnect.svg',
                label: 'Wallet Connect',
                href: '',
            }
        ],
    },
];

const responsiveProps = {
    transform: 'translateX(-8%)',
    px: '8%',
    overflowX:{ base: 'auto' },
    w: '100vw',
}

export const Ecosystem = () => {
    const [tab, setTab] = useState(0);
    const [mouseDown, setMouseDown] = useState(false);
    const [startX, setStartX] = useState(0);
    const [scrollLeft, setScrollLeft] = useState(0);

    const startDragging = function (e) {
        const slider = document.querySelector('#ecosystem-cards');
        setMouseDown(true);
        setStartX(e.pageX);
        setStartX(e.pageX - slider.offsetLeft);
        setScrollLeft(slider.scrollLeft);
    };

    const stopDragging = function () {
        setMouseDown(false)
    };

    const mouseMove = (e) => {        
        e.preventDefault();
        if(!mouseDown) { return; }
        const slider = document.querySelector('#ecosystem-cards');
        const x = e.pageX - slider.offsetLeft;
        const scroll = x - startX;
        slider.scrollLeft = scrollLeft - scroll;
    }
    
    return <Tabs zIndex='1' variant="unstyled" px='0' onChange={(index) => setTab(index)} >
    <TabList position="relative" {...responsiveProps}>
      {data.map((tab, i) => <Tab key={tab.tab} {...tabProps} pl={i === 0 ? '0': 4}>{tab.tab}</Tab>)}
    </TabList>
  
    <HStack cursor={ mouseDown ? 'grabbing' : 'default' } onMouseMove={mouseMove} onMouseDown={startDragging} onMouseUp={stopDragging} onMouseLeave={stopDragging} id="ecosystem-cards" spacing="6" pb="2" pt="2" mt='8' {...responsiveProps}>
        {data[tab]?.elements.map(el => <EcoElement key={el.label} {...el} />)}
    </HStack>
  </Tabs>
}