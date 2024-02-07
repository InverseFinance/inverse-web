import { Tab, TabList, Tabs } from "@chakra-ui/react"

export const DolaStakingTabs = ({
    defaultIndex = 0
}) => {
    return <Tabs
        defaultIndex={defaultIndex}
        mt="5"
        mb="2"
        overflow="auto"
        w="full"
        colorScheme="blue"
        variant='solid-rounded'>
        <TabList justifyContent={{ base: 'flex-start', sm: 'center' }}>
            <Tab as="a" href="/sDOLA" _focus={{ outline: 'none' }}>sDOLA</Tab>
            <Tab as="a" href="/dsa" _focus={{ outline: 'none' }}>DOLA Savings Account</Tab>
            <Tab as="a" href="/sDOLA/stats" _focus={{ outline: 'none' }}>sDOLA stats</Tab>
            <Tab as="a" href="/dsa/stats" _focus={{ outline: 'none' }}>DSA stats</Tab>
        </TabList>
    </Tabs>
}