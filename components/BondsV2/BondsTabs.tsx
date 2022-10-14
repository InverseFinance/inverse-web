import { Tab, TabList, Tabs } from '@chakra-ui/react'

export const BondsTabs = ({
    defaultIndex = 0
}) => {
    return <Tabs
        defaultIndex={defaultIndex}
        mt="5"
        mb="2"
        overflow="auto"
        w="full"
        colorScheme="white"
        variant='solid-rounded'>
        <TabList justifyContent={{ base: 'flex-start', sm: 'center' }}>
            <Tab as="a" href="/bonds" _focus={{ outline: 'none' }}>Bond Markets</Tab>
            <Tab as="a" href="/bonds/purchased" _focus={{ outline: 'none' }}>My V2 Bonds</Tab>
            <Tab as="a" href="/bonds/stats" _focus={{ outline: 'none' }}>Bonds Stats</Tab>
        </TabList>
    </Tabs>
}