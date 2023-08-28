import { VStack, Text, Box } from "@chakra-ui/react"
import Container from "../common/Container"
import { InfoMessage, WarningMessage } from "../common/Messages"
import Link from "../common/Link"

export const BaseBridgeInformations = () => {
    return <Container label="Informations" noPadding p="0" contentProps={{ minH: '400px' }}>
        <VStack w='full' spacing="4" justify="space-between">
            <WarningMessage
                alertProps={{ w: 'full' }}
                title="Bridging times"
                description={
                    <VStack spacing="0" alignItems="flex-start">
                        <Text>- From Ethereum to Base: a few minutes usually.</Text>
                        <Text>- From Base to Ethereum: 7 days, 3 txs required.</Text>
                    </VStack>
                }
            />

            <InfoMessage
                description={
                    <VStack alignItems="flex-start">
                        <Box>
                            <Text fontWeight="bold" display="inline">
                                Please note:
                            </Text>
                            <Text ml="1" display="inline">
                                DOLA has been deployed to the native base Bridge however DOLA may not be reflected on
                            </Text>
                            <Link ml="1" textDecoration="underline" href="https://bridge.base.org/deposit" isExternal target="_blank">
                                the official Base UI
                            </Link>
                            <Text display="inline" ml="1">
                                pull-down menu for several weeks.
                            </Text>
                        </Box>
                        <Text>
                            Until then, we are providing this user interface to the Base native bridge for our users wishing to move DOLA to Base.
                        </Text>
                        <Box w='full'>
                            <Text display="inline">
                                For more information on using bridges with DOLA please visit:
                            </Text>
                            <Link ml="1" textDecoration="underline" href="https://docs.inverse.finance/inverse-finance/inverse-finance/product-guide/tokens/dola" isExternal={true} target="_blank">
                                DOLA docs
                            </Link>
                        </Box>
                        <Text fontWeight="bold">Base relies mostly on the same technologies as Optimism, please make your own due diligence.</Text>
                        <Text display="inline">
                            This page can also be used for other tokens than DOLA by adding the Base token address to the URL:
                        </Text>
                        <Link ml="1" textDecoration="underline" href="/base?l2token=0xd9aaec86b65d86f6a7b5b1b0c42ffa531710b6ca">
                            USDC example
                        </Link>
                    </VStack>
                }
            />
        </VStack>
    </Container>
}