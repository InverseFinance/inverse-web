import Link from "@app/components/common/Link"
import { useAppTheme } from "@app/hooks/useAppTheme";
import { Tab, TabList, Tabs } from "@chakra-ui/react"

export const DolaStakingTabs = ({
    defaultIndex = 0
}) => {
    const { themeParams } = useAppTheme();
    const { TABS_COLOR_SCHEME, TABS_VARIANT } = themeParams;
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
            <Tab color={defaultIndex === 0 ? 'mainTextColor' : 'mainTextColorLight'} as={Link} href="/sDOLA" _focus={{ outline: 'none' }}>sDOLA</Tab>
            <Tab color={defaultIndex === 1 ? 'mainTextColor' : 'mainTextColorLight'} as={Link} href="/sdola/stats" _focus={{ outline: 'none' }}>sDOLA Stats</Tab>
            <Tab color={defaultIndex === 2 ? 'mainTextColor' : 'mainTextColorLight'} as={Link} href="/dsa" _focus={{ outline: 'none' }}>DSA</Tab>
            <Tab color={defaultIndex === 3 ? 'mainTextColor' : 'mainTextColorLight'} as={Link} href="/dsa/stats" _focus={{ outline: 'none' }}>DSA Stats</Tab>
        </TabList>
    </Tabs>
}

export const JDolaStakingTabs = ({
    defaultIndex = 0
}) => {
    const { themeParams } = useAppTheme();
    const { TABS_COLOR_SCHEME, TABS_VARIANT } = themeParams;
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
            <Tab color={defaultIndex === 0 ? 'mainTextColor' : 'mainTextColorLight'} as={Link} href="/sDOLA" _focus={{ outline: 'none' }}>jDOLA</Tab>
            <Tab color={defaultIndex === 1 ? 'mainTextColor' : 'mainTextColorLight'} as={Link} href="/sdola/stats" _focus={{ outline: 'none' }}>jDOLA Stats</Tab>
        </TabList>
    </Tabs>
}