import { Tabs, TabList, Tab } from '@chakra-ui/react'

type TabsType = 'overview' | 'dola' | 'multisigs' | 'fed-history';

const tabs = [
    { page: 'overview', label: 'Overview' },
    { page: 'dola', label: 'DOLA & the Feds' },
    { page: 'fed-history', label: 'Feds Historical Data' },
    { page: 'multisigs', label: 'Multisig Wallets' },
]

export const TransparencyTabs = ({ active }: { active: TabsType}) => {
    const handleTab = (newIndex: number) => {
        // cleaner visually than router.push
        window.location.pathname = `/transparency/${tabs[newIndex].page}`
    }

    const activeIndex = tabs.findIndex(tab => tab.page === active);

    return (
        <Tabs onChange={handleTab} defaultIndex={activeIndex} mt="5" mb="2" overflow="auto" w="full" colorScheme="white" variant='solid-rounded'>
            <TabList justifyContent={{ base: 'flex-start', sm: 'center' }}>
                {tabs.map(tab => <Tab _focus={{outline: 'none'}} key={tab.page}>{tab.label}</Tab>)}
            </TabList>
        </Tabs>
    )
}