import { VStack, Image, HStack } from "@chakra-ui/react"
import Link from "../common/Link"
import { useEffect, useState } from "react";

const badgeW = 182;

export const SafetyMiniCaroussel = () => {
    const [badgeX, setBadgeX] = useState(0);

    const transition = () => {
        const newBadgeX = badgeX - badgeW;
        setBadgeX(newBadgeX <= -2 * badgeW ? 0 : newBadgeX);
    }

    useEffect(() => {
        const interval = setInterval(() => {
            transition();
        }, 6000);

        return () => clearInterval(interval);
    }, [badgeX]);

    return <VStack w={`${badgeW}px`} h="50px" overflow="hidden" position="relative" pt={{ base: '4', sm: '0' }} display={{ base: 'none', sm: 'inline-flex' }} spacing="0" alignItems="flex-end">
        <Link transition="500ms all" right={`${badgeX}px`} position="absolute" href="https://chain.link/badge" isExternal target="_blank">
            <Image ignoreFallback={true} w={`${badgeW}px`} h="50px" src="https://chain.link/badge-market-data-white" alt="market data secured with chainlink" />
        </Link>
        <Link transition="500ms all" position="absolute" right={`${badgeX + badgeW}px`} bgImage="/assets/partners/immunefi.svg?" bgRepeat="no-repeat" bgColor="#f5f7fe" width={`${badgeW}px`} h="50px" href="https://immunefi.com/bounty/inversefinance/" border="1px solid #e9effc" borderRadius="5px" bgSize='60%' bgPosition="center" isExternal target="_blank">
            &nbsp;
        </Link>
    </VStack>
}

export const SafetyBadges = () => {
    return <HStack spacing="2" h="50px" position="relative" pt={{ base: '4', sm: '0' }} display={{ base: 'none', sm: 'inline-flex' }} alignItems="flex-end">
        <Link _hover={{ filter: 'brightness(1.1)' }} bgImage="/assets/partners/immunefi.svg?" bgRepeat="no-repeat" bgColor="#f5f7fe" width={`${badgeW}px`} h="50px" href="https://immunefi.com/bounty/inversefinance/" border="1px solid #e9effc" borderRadius="5px" bgSize='60%' bgPosition="center" isExternal target="_blank">
            &nbsp;
        </Link>
        {/* <Link _hover={{ filter: 'brightness(1.1)' }} href="https://chain.link/badge" isExternal target="_blank">
            <Image ignoreFallback={true} w={`${badgeW}px`} h="50px" src="https://chain.link/badge-market-data-white" alt="market data secured with chainlink" />
        </Link> */}
    </HStack>
}