import Link from "@app/components/common/Link"
import { useAppTheme } from "@app/hooks/useAppTheme";
import { Tab, TabList, Tabs } from "@chakra-ui/react"

export const SINVTabs = ({
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
            <Tab color={defaultIndex === 0 ? 'mainTextColor' : 'mainTextColorLight'} as={Link} href="/sINV" _focus={{ outline: 'none' }}>sINV</Tab>
            <Tab color={defaultIndex === 1 ? 'mainTextColor' : 'mainTextColorLight'} as={Link} href="/sinv/stats" _focus={{ outline: 'none' }}>sINV Stats</Tab>
        </TabList>
    </Tabs>
}