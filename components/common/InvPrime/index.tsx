import { VStack, Text, Stack, Image } from "@chakra-ui/react"
import Link from "../Link"
import { INV_STAKED_MIN_FOR_EXTRA_FEATURES } from "@app/config/features"
import { BUY_LINKS } from "@app/config/constants"
import { InfoMessage } from "../Messages"

export const InvPrime = () => {
    return <Stack direction={{ base: 'column-reverse', lg: 'row' }} spacing="2" alignItems="center">
        <InfoMessage
            alertProps={{ w: { base: 'full', lg: '65%' }, m: '0' }}
            title="Early access for INV stakers"
            description={
                <VStack
                    w='full'
                    alignItems="flex-start"
                >
                    <Text>This feature is available in early access for Inv Stakers on FiRM ({INV_STAKED_MIN_FOR_EXTRA_FEATURES} INV minimum)</Text>
                    <Link textDecoration="underline" target="_blank" isExternal href={BUY_LINKS.INV}>
                        Buy INV
                    </Link>
                    <Link textDecoration="underline" href="/firm/INV">
                        Stake INV on FiRM
                    </Link>
                </VStack>
            }
        />
        <VStack w={{ base: 'full', lg: '35%' }}>
            <Image borderRadius="6px" src="/assets/inv-key.png" h={{ base: '100px', lg: '184px' }} />
        </VStack>
    </Stack>
}