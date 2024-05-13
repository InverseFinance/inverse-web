import { Tab, TabList, Tabs } from "@chakra-ui/react"

export const DbrAuctionTabs = ({
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
            <Tab as="a" href="/dbr/auction" _focus={{ outline: 'none' }}>Buy DBR via auction</Tab>
            <Tab as="a" href="/dbr/auction/stats" _focus={{ outline: 'none' }}>Auction Stats</Tab>            
            <Tab as="a" href="/dbr/auction/virtual-stats" _focus={{ outline: 'none' }}>Virtual Auction Stats</Tab>            
            <Tab as="a" href="/dbr/auction/sdola-stats" _focus={{ outline: 'none' }}>sDOLA Auction Stats</Tab>            
        </TabList>
    </Tabs>
}