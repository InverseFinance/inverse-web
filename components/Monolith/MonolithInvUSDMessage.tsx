import { Divider, VStack, Text, HStack, Image, Stack } from "@chakra-ui/react";
import { Link } from "../common/Link";
import { ExternalLinkIcon } from "@chakra-ui/icons";
import useEtherSWR from "@app/hooks/useEtherSWR";
import { useAccount } from "@app/hooks/misc";
import { FIRM_VIEWER } from "@app/config/constants";
import { getBnToNumber } from "@app/util/markets";
import { InfoMessage } from "../common/Messages";

export const MonolithInvUSDMessage = () => {
    const account = useAccount();
    const { data: invMarketBalBn } = useEtherSWR([
        FIRM_VIEWER, 'getPositionBalance', '0xb516247596Ca36bf32876199FBdCaD6B3322330B', account,
    ]);
    const invMarketBal = invMarketBalBn ? getBnToNumber(invMarketBalBn) : 0;
    const needMigration = invMarketBal >= 1;
    return <VStack maxW="1200px" w='full' alignItems="center" spacing="0" px="6" mb="4">
        <VStack w='full' alignItems="center" spacing="3" position="relative" zIndex={1}>
            <HStack spacing="2" flexWrap="wrap" justify="center">
                {
                    needMigration ? <InfoMessage
                        alertProps={{ w: 'full' }}
                        description={
                            <Stack direction={{ base: 'column', lg: 'row-reverse' }} alignItems="center" spacing="5">
                                <Image borderRadius="20px" maxWidth="100%" src="/assets/migrate-inv-to-monolith.png" width="300px" />
                                <VStack spacing="0" alignItems="center">
                                    <Text fontSize={{ base: '12px', md: '14px' }} fontWeight="bold" textAlign="left">
                                        Please exit your position in the INV market and migrate it to Monolith.
                                    </Text>
                                    <Text fontSize={{ base: '12px', md: '14px' }} textAlign="left">
                                        The INV market is being paused and will be phased out progressively.
                                    </Text>
                                    <Text fontSize={{ base: '12px', md: '14px' }} textAlign="left">
                                        CF on Monolith is 65% while CF on FiRM is 35% (and reducing soon).
                                    </Text>
                                </VStack>
                            </Stack>
                        }
                    />
                        :
                        <>
                            <Text fontSize={{ base: '16px', md: '22px' }} fontWeight="bold" textAlign="center">
                                Borrow against your INV with
                            </Text>
                            <HStack spacing="1">
                                <Image
                                    src="https://app.monolith.market/invUSD.png"
                                    borderRadius="full"
                                    w={{ base: '22px', md: '26px' }}
                                    h={{ base: '22px', md: '26px' }}
                                />
                                <Text fontSize={{ base: '16px', md: '22px' }} fontWeight="extrabold" color="accentTextColor">
                                    invUSD
                                </Text>
                            </HStack>
                        </>
                }

            </HStack>
            <Stack justify="center" spacing={{ base: 1, md: 0 }} direction={{ base: 'column' }} w='full'>
                <HStack justify={{ base: 'center' }} spacing="1">
                    <Text fontSize={{ base: '13px', md: '15px' }} color="secondaryTextColor">
                        {needMigration ? <b>Monolith</b> : <>Powered by <b>Monolith</b></>}
                    </Text>
                    <Image
                        src="https://app.monolith.market/square-logo.png"
                        borderRadius="full"
                        w="18px"
                        h="18px"
                    />
                </HStack>
                <Text textAlign="center" fontSize={{ base: '13px', md: '15px' }} color="secondaryTextColor">
                    A stablecoin-as-a-service protocol owned by the Inverse DAO
                </Text>
            </Stack>
            <Stack alignItems="center" justify="center" direction={{ base: 'column', md: 'row' }} w='full'>
                <Link
                    fontSize={{ base: '13px', md: '15px' }}
                    textDecoration="underline"
                    href="https://monolith.market"
                    isExternal
                    target="_blank"
                    _hover={{ color: 'accentTextColor' }}
                >
                    Visit Monolith <ExternalLinkIcon ml="1" />
                </Link>
                <Link
                    fontSize={{ base: '13px', md: '15px' }}
                    textDecoration="underline"
                    href="https://app.monolith.market/1/coin/0"
                    isExternal
                    target="_blank"
                    _hover={{ color: 'accentTextColor' }}
                >
                    Borrow against INV <ExternalLinkIcon ml="1" />
                </Link>
            </Stack>
        </VStack>
        <Divider pt="4" w='full' maxW="1200px" />
    </VStack>
}