import { VStack, Text, Stack, Image } from "@chakra-ui/react"
import Link from "../Link"
import { INV_STAKED_MIN_FOR_EXTRA_FEATURES } from "@app/config/features"
import { BUY_LINKS } from "@app/config/constants"
import { InfoMessage } from "../Messages"

export const InvPrime = ({
    showLinks = true
}: {
    showLinks?: boolean
}) => {
    const icon = <Image mr="4" borderRadius="6px" src="/assets/inv-key.png" w='70px' />
    return <Stack direction={{ base: 'column-reverse', lg: 'row' }} spacing="2" alignItems="center">
        <InfoMessage  
            alertProps={{ w: 'full', m: '0', icon }}
            title="Early access for INV stakers"
            description={
                <VStack
                    w='full'
                    alignItems="flex-start"
                    fontSize='14px'
                    spacing="0"
                >
                    <Text>This feature is available in early access for Inv Stakers on FiRM ({INV_STAKED_MIN_FOR_EXTRA_FEATURES} INV minimum).</Text>
                    {
                        showLinks && <Stack direction={{ base: 'column', lg: 'row' }} spacing="2" alignItems="flex-start">
                            <Link textDecoration="underline" target="_blank" isExternal href={BUY_LINKS.INV}>
                                Buy INV
                            </Link>
                            <Link textDecoration="underline" href="/firm/INV">
                                Stake INV on FiRM
                            </Link>
                        </Stack>
                    }
                </VStack>
            }
        />
    </Stack>
}