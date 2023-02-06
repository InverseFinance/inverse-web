import { useAppTheme } from '@app/hooks/useAppTheme';
import { Tabs, TabList, Tab, VStack, Text, HStack, Image } from '@chakra-ui/react'

type TabsType = 'overview' | 'treasury' | 'inv' | 'dola' | 'dbr' | 'multisigs' | 'interest-model' | 'feds' | 'stabilizer' | 'dao' | 'liquidations' | 'shortfalls';

const TABS = [
    { page: 'overview', label: 'Overview' },
    { page: 'treasury', label: 'Treasury' },
    { page: 'dao', label: 'DAO' },
    { page: 'inv', label: 'INV' },
    { page: 'dola', label: 'DOLA' },
    { page: 'dbr', label: 'DBR' },
    { page: 'feds', label: 'Feds' },
    // { page: 'interest-model', label: 'Interest Rates' },
    { page: 'multisigs', label: 'Multisig Wallets' },
    { page: 'stabilizer', label: 'Stabilizer' },
    { page: 'frontier-overview', label: 'Frontier' },
    // { page: 'liquidations', label: 'Frontier Liquidations' },    
];

const TABS_FRONTIER = [
    { page: 'overview', label: 'Main Portal' },
    { page: 'frontier-overview', label: 'Frontier Overview' },
    { page: 'frontier-shortfalls', label: 'Frontier Shortfalls' },
    { page: 'frontier-liquidations', label: 'Frontier Liquidations' },
];

export const TransparencyFrontierTabs = (props: TransparencyTabsProps) => {
    return <TransparencyTabs tabs={TABS_FRONTIER} {...props} />
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
    const handleTab = (newIndex: number) => {
        // cleaner visually than router.push
        window.location.pathname = `/transparency/${tabs[newIndex].page}`
    }

    const activeIndex = tabs.findIndex(tab => tab.page === active);

    return (
        <VStack w='full' pt="4">
            <HStack spacing="4">
                <Image filter={themeName === 'dark' ? 'invert(1)' : undefined} src="/assets/transparency.png" h="40px" w="40px" ignoreFallback={true} />
                <VStack alignItems="flex-start" spacing="0">
                    <Text fontWeight="extrabold" fontSize="22px">Transparency Portal</Text>
                    <Text fontWeight="bold" fontSize="14px" color="secondaryTextColor">Don't trust, verify</Text>
                </VStack>
            </HStack>
            <Tabs onChange={handleTab} defaultIndex={activeIndex} mt="5" mb="2" overflow="auto" w="full" colorScheme={TABS_COLOR_SCHEME} variant={TABS_VARIANT}>
                <TabList justifyContent={{ base: 'flex-start', sm: 'center' }}>
                    {tabs.map(tab => <Tab _focus={{ outline: 'none' }} key={tab.page}>{tab.label}</Tab>)}
                </TabList>
            </Tabs>
        </VStack>
    )
}