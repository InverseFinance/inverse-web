import { VStack, Text, Box } from "@chakra-ui/react"
import Container from "../common/Container"
import { InfoMessage, WarningMessage } from "../common/Messages"
import Link from "../common/Link"

export const BlastBridgeInformations = () => {
    return <Container label="Informations" noPadding p="0" contentProps={{ minH: '400px' }}>
        <VStack w='full' spacing="4" justify="space-between">
            <WarningMessage
                alertProps={{ w: 'full' }}
                title="Bridging times"
                description={
                    <VStack spacing="0" alignItems="flex-start">
                        <Text>- From Ethereum to Blast: a few minutes usually.</Text>
                        <Text>- From Blast to Ethereum: 14 days, 3 txs required.</Text>
                        <Text>Note: Withdrawing from Blast using this UI is not fully supported yet.</Text>
                    </VStack>
                }
            />

            <InfoMessage
                description={
                    <VStack alignItems="flex-start">
                        <Box>                           
                            <Link ml="1" textDecoration="underline" href="https://blast.io/en/bridge" isExternal target="_blank">
                                The official Blast UI
                            </Link>
                        </Box>                        
                        <Box w='full'>
                            <Text display="inline">
                                For more information on using bridges with DOLA please visit:
                            </Text>
                            <Link ml="1" textDecoration="underline" href="https://docs.inverse.finance/inverse-finance/inverse-finance/product-guide/tokens/dola" isExternal={true} target="_blank">
                                DOLA docs
                            </Link>
                        </Box>
                        <Text fontWeight="bold">Blast relies mostly on the same technologies as Optimism, please perform your own due diligence.</Text>                       
                    </VStack>
                }
            />
        </VStack>
    </Container>
}