import { useAppTheme } from "@app/hooks/useAppTheme";
import { Flex, Image, Stack, VStack, Text, HStack } from "@chakra-ui/react";
import { useState } from "react";
import { NotifBadge } from "../NotifBadge";
import Link from "../Link";
import { ChevronDownIcon, ChevronRightIcon } from "@chakra-ui/icons";
import { lightTheme } from "@app/variables/theme";
import { landingLightBorderColor, landingMainColor } from "../Landing/LandingComponents";
import { LandingBigItem, LandingMediumItem, LandingSmallItem } from "./FloatingNav";

const MOBILE_NAV_HEIGHT = 72;
const MOBILE_NAV_HEIGHT_PX = `${MOBILE_NAV_HEIGHT}px`;
// add some margin to the bottom of the submenu container to avoid the last item to be hidden by the bottom bar
const SUBMENU_CONTAINER_HEIGHT_PX = `calc(100vh - ${(MOBILE_NAV_HEIGHT + 130)}px)`;

export const LandingBurgerMenu = ({
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
            <Flex px="4" spacing="0" direction="column" margin="0 !important" w="full" position={'fixed'} top="70px" left="0" zIndex="9999999" transitionDuration="0.1s" transitionTimingFunction="ease">
                <Stack
                    borderRadius="6px"
                    w="full"
                    bgColor={"#f9f9fa"}
                    fontWeight="medium"
                    spacing={0}
                    maxH={SUBMENU_CONTAINER_HEIGHT_PX}
                    p="0"
                    overflow="auto"
                    border={`1px solid ${landingLightBorderColor}`}
                >
                    {
                        navItems.map(({ label, href, submenus, type }, i) => {
                            const hasSubmenus = !!submenus?.length;
                            const LinkComp = !hasSubmenus ? Link : VStack;
                            return <VStack spacing="0" w='full' key={i}>
                                <LinkComp
                                    spacing={!hasSubmenus ? '0' : undefined}
                                    w="full"
                                    href={hasSubmenus ? undefined : href}
                                    position="relative"
                                    color={landingMainColor}
                                    p="4"
                                    onClick={() => setOpenedMenu(openedMenu !== label ? label : '')}
                                    textDecoration={hasSubmenus ? undefined : 'underline'}
                                    borderTop={i !== 0 ? `1px solid ${landingLightBorderColor}` : undefined}
                                >
                                    {
                                        hasSubmenus ? <HStack alignItems="center" justifyContent="space-between" w='full'>
                                            <Text color={landingMainColor}>
                                                {label}
                                            </Text>
                                            {
                                                openedMenu !== label ? <ChevronDownIcon /> : <ChevronRightIcon />
                                            }
                                        </HStack> : label
                                    }
                                </LinkComp>
                                {
                                    hasSubmenus && openedMenu === label && <Stack maxH="300px" overflowY="auto" w='full' bgColor={"#f0f0f0"} direction={type !== 'medium' ? 'column' : 'row'} px="2" py="4" alignItems="flex-start">
                                        {submenus
                                            .filter(s => !s.href.includes('$account') || (s.href.includes('$account') && !!userAddress))
                                            .map((sub, j) => {
                                                const width = type === 'medium' ? '33%' : undefined;
                                                return type === 'big' ? <LandingBigItem key={j} {...sub} /> : type === 'medium' ? <LandingMediumItem key={j} {...sub} width="33%" /> : <LandingSmallItem key={j} {...sub} />
                                            })}
                                    </Stack>
                                }
                            </VStack>
                        })
                    }
                </Stack>
            </Flex>
        )}
    </>
}