import { useAppTheme } from "@app/hooks/useAppTheme";
import { Flex, Image, Stack, VStack, Text, HStack } from "@chakra-ui/react";
import { useState } from "react";
import { NotifBadge } from "../NotifBadge";
import Link from "../Link";
import { ChevronDownIcon, ChevronRightIcon } from "@chakra-ui/icons";
import { lightTheme } from "@app/variables/theme";

const MOBILE_NAV_HEIGHT = 72;
const MOBILE_NAV_HEIGHT_PX = `${MOBILE_NAV_HEIGHT}px`;
// add some margin to the bottom of the submenu container to avoid the last item to be hidden by the bottom bar
const SUBMENU_CONTAINER_HEIGHT_PX = `calc(100vh - ${(MOBILE_NAV_HEIGHT+130)}px)`;

export const BurgerMenu = ({
    active,
    activeSubmenu,
    nbNotif = 0,
    navItems = [],
    userAddress = '',
    isLanding = false,
    filler,
}: {
    active?: string,
    activeSubmenu?: string,
    userAddress?: string,
    nbNotif?: number,
    isLanding?: boolean
    filler?: any
    navItems?: {
        label: string, href: string, submenus?: { label: string, href: string }[]
    }[],
}) => {
    const { themeName, themeStyles } = useAppTheme();
    const [showMobileNav, setShowMobileNav] = useState(false);
    const [openedMenu, setOpenedMenu] = useState('');
    const styles = isLanding ? lightTheme : themeStyles;

    const burger = <Flex position="relative" display={{ base: 'flex', lg: 'none' }} w={6} h={6} onClick={() => setShowMobileNav(!showMobileNav)}>
        <Flex width="24px" height="24px">
            {showMobileNav ? (
                <Image transform="translate3d(4px, 4px, 0)" w={4} h={4} ignoreFallback={true} src="/assets/cancel.svg" alt="x" filter={themeName === 'dark' && !isLanding ? undefined : 'invert(0.8)'} />
            ) : (
                <Image w={6} h={6} ignoreFallback={true} src="/assets/hamburger.svg" alt="-" filter={themeName === 'dark' && !isLanding ? undefined : 'invert(0.8)'} />
            )}
        </Flex>
        {
            active !== 'Governance' && !showMobileNav && nbNotif > 0 && <NotifBadge>
                {nbNotif}
            </NotifBadge>
        }
    </Flex>

    return <>
        {burger}
        {showMobileNav && (
            <Flex spacing="0" direction="column" margin="0 !important" w="full" position={'fixed'} top={isLanding ? 0 : '72px'} left="0" zIndex="9999999" transitionDuration="0.1s" transitionTimingFunction="ease">
                {
                    isLanding && <HStack
                        px="8%"
                        justify={{ base: 'space-between', sm: 'flex-end' }}
                        alignItems="center"
                        bgColor={styles.colors.primary['900']}
                        borderBottomWidth={1}
                        borderColor={styles.colors.primary['800']}
                        h={MOBILE_NAV_HEIGHT_PX}
                        w="full">
                        {filler}
                        {burger}
                    </HStack>
                }
                <Stack
                    w="full"
                    bgColor={styles.colors.primary['900']}
                    fontWeight="medium"
                    spacing={3}
                    maxH={SUBMENU_CONTAINER_HEIGHT_PX}
                    p={4}
                    borderBottomWidth={1}
                    borderColor={styles.colors.primary['800']}                    
                    boxShadow={`0 2px 2px 2px ${styles.colors['primary'][500]}`}
                    overflow="auto"
                >
                    {
                        navItems.map(({ label, href, submenus }, i) => {
                            const hasSubmenus = !!submenus?.length;
                            const LinkComp = !hasSubmenus ? Link : VStack;
                            const color = active === label ? styles.colors.mainTextColor : styles.colors.accentTextColor
                            return <LinkComp
                                spacing={!hasSubmenus ? '0' : undefined}
                                w="fit-content"
                                position="relative"
                                key={i} href={hasSubmenus ? undefined : href}
                                color={color}
                                alignItems="flex-start"
                                onClick={() => setOpenedMenu(openedMenu !== label ? label : '')}
                                textDecoration={hasSubmenus ? undefined : 'underline'}
                            >
                                {
                                    hasSubmenus ? <HStack alignItems="flex-end">
                                        <Text color={color}>
                                            {label} {
                                                openedMenu !== label ? <ChevronDownIcon /> : <ChevronRightIcon />
                                            }
                                        </Text>
                                        {
                                            href === '/governance' && nbNotif > 0 &&
                                            <NotifBadge position="relative">
                                                {nbNotif}
                                            </NotifBadge>
                                        }
                                    </HStack> : label
                                }
                                {
                                    hasSubmenus && openedMenu === label && <VStack pt="0" alignItems="flex-start" pl="4">
                                        {submenus
                                            .filter(s => !s.href.includes('$account') || (s.href.includes('$account') && !!userAddress))
                                            .map((sub, j) => {
                                                return <Link
                                                    textDecoration="underline"
                                                    key={j}
                                                    href={sub.href.replace('$account', userAddress || '')}
                                                    color={activeSubmenu === sub.label ? styles.colors.mainTextColor : styles.colors.accentTextColor}
                                                >
                                                    {sub.label}
                                                </Link>
                                            })}
                                    </VStack>
                                }
                            </LinkComp>
                        })
                    }
                </Stack>
            </Flex>
        )}
    </>
}