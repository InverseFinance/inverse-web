import { TABS_COLOR_SCHEME, TABS_VARIANT } from '@app/variables/theme'
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
        colorScheme={TABS_COLOR_SCHEME}
        variant={TABS_VARIANT}
    >
        <TabList justifyContent={{ base: 'flex-start', sm: 'center' }}>
            <Tab as="a" href="/bonds" _focus={{ outline: 'none' }}>Bonds</Tab>
            <Tab as="a" href="/bonds/stats" _focus={{ outline: 'none' }}>Bonds Stats</Tab>
        </TabList>
    </Tabs>
}