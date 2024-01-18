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
            <Tab as="a" href="/sdola" _focus={{ outline: 'none' }}>sDOLA</Tab>
            <Tab as="a" href="/dsa" _focus={{ outline: 'none' }}>DOLA Savings Account</Tab>
        </TabList>
    </Tabs>
}