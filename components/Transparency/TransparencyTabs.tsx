import { useAppTheme } from '@app/hooks/useAppTheme';
import { Tabs, TabList, Tab, VStack, Text, HStack, Image } from '@chakra-ui/react'
import Link from '../common/Link';

type TabsType = 'overview' | 'treasury' | 'veNfts' | 'liquidity' | 'inv' | 'dola' | 'dbr' | 'multisigs' | 'interest-model' | 'feds' | 'stabilizer' | 'dao' | 'shortfalls' | 'bad-debts';

const TABS = [
    // { page: 'overview', label: 'Overview' },
    { page: 'treasury', label: 'Treasury' },
    { page: 'veNfts', label: 'veNfts' },
    { page: 'liquidity', label: 'Liquidity' },
    { page: 'dao', label: 'DAO & INV' },
    // { page: 'inv', label: 'INV' },    
    { page: 'dbr', label: 'DBR' },
    { page: 'dola', label: 'DOLA & Feds' },
    { page: 'feds', label: 'Feds Policy' },
    // { page: 'interest-model', label: 'Interest Rates' },
    { page: 'multisigs', label: 'Multisig Wallets' },
    // { page: 'firm-users', label: 'FiRM users' },
    // { page: 'liquidations', label: 'Liquidations' },
    { page: 'bad-debts', label: 'Bad debts' },
    { page: 'frontier-overview', label: 'Frontier & Other' },
];

const TABS_OTHER = [
    { page: 'overview', label: 'Main Portal' },
    { page: 'frontier-overview', label: 'Frontier Overview' },
    { page: 'frontier-shortfalls', label: 'Frontier Shortfalls' },
    { page: 'frontier-liquidations', label: 'Frontier Liquidations' },
    { page: 'other-stabilizer', label: 'Stabilizer' },
];

export const TransparencyOtherTabs = (props: TransparencyTabsProps) => {
    return <TransparencyTabs tabs={TABS_OTHER} {...props} />
}

type TransparencyTabsProps = {
    active: TabsType,
    tabs?: { page: string, label: string }[],
}

export const TransparencyTabs = ({
    active,
    tabs = TABS,
}: TransparencyTabsProps) => {
    const { themeParams, themeName } = useAppTheme();
    const { TABS_COLOR_SCHEME, TABS_VARIANT } = themeParams;
    // const handleTab = (newIndex: number) => {
    //     // cleaner visually than router.push
    //     window.location.pathname = `/transparency/${tabs[newIndex].page}`
    // }

    const activeIndex = tabs.findIndex(tab => tab.page === active);

    return (
        <VStack w='full' pt="4">
            <HStack spacing="4">
                <Image filter={themeName === 'dark' ? 'invert(1)' : undefined} src="/assets/transparency.png" h="40px" w="40px" ignoreFallback={true} />
                <VStack alignItems="flex-start" spacing="0">
                    <Text fontWeight="extrabold" fontSize="22px">Transparency Portal</Text>
                    <Text as="i" fontWeight="bold" fontSize="14px" color="secondaryTextColor">Don't trust, verify</Text>
                </VStack>
            </HStack>
            <Tabs defaultIndex={activeIndex} mt="5" mb="2" overflow="auto" w="full" colorScheme={TABS_COLOR_SCHEME} variant={TABS_VARIANT}>
                <TabList justifyContent={{ base: 'flex-start', sm: 'center' }}>
                    {tabs.map((tab, tabIdx) => <Tab px={{ base: '3', '2xl': '4' }} fontSize={{ base: '14px', '2xl': '16px' }} _focus={{ outline: 'none' }} key={tab.page}>
                        <Link color={activeIndex === tabIdx ? 'mainTextColor' : 'mainTextColorLight'} href={`/transparency/${tabs[tabIdx].page}`}>{tab.label}</Link>
                    </Tab>)}
                </TabList>
            </Tabs>
        </VStack>
    )
}