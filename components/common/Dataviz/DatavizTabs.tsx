import { Tabs, TabList, Tab } from '@chakra-ui/react'

type DatavizTabs = 'overview' | 'dola';

const tabs = [
    { page: 'overview', label: 'Overview' },
    { page: 'dola', label: 'DOLA & the Feds' },
]

export const DatavizTabs = ({ active }: { active: DatavizTabs}) => {
    const handleTab = (newIndex: number) => {
        // cleaner visually than router.push
        window.location.pathname = `/transparency/${tabs[newIndex].page}`
    }

    const activeIndex = tabs.findIndex(tab => tab.page === active);

    return (
        <Tabs onChange={handleTab} mt="5" mb="2" defaultIndex={activeIndex} colorScheme="white" variant='solid-rounded'>
            <TabList>
                {tabs.map(tab => <Tab key={tab.page}>{tab.label}</Tab>)}
            </TabList>
        </Tabs>
    )
}