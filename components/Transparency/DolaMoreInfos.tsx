import Link from '@app/components/common/Link'
import { ShrinkableInfoMessage } from '@app/components/common/Messages'
import { Flex, VStack, Text, Image, List, ListItem } from '@chakra-ui/react'

export const DolaMoreInfos = () => {
    return (
        <ShrinkableInfoMessage
            title={
                <Flex alignItems="center">
                    <Image borderRadius="50px" mr="2" display="inline-block" src={`/assets/v2/dola-small.png`} ignoreFallback={true} w='15px' h='15px' />
                    About DOLA & Fed contracts
                </Flex>
            }
            description={
                <VStack alignItems="flex-start" spacing="0">
                    <Text pt="2" fontWeight="bold">What is DOLA?</Text>
                    <Text>
                        <b>DOLA</b> is a decentralized stablecoin pegged to the US dollar, its supply is managed via special contracts called <b>Feds</b>.
                    </Text>
                    <Text pt="2">
                        <b>TIP</b>: DOLA currently has some bad debt as a result of oracle manipulations on the now deprecated Frontier; this is actively being paid down using DAO revenues. <b>Borrowing and using DOLA on FiRM protects the user from risks of depegging below $1</b>, while also presenting the opportunity to make a profit in such situation via buying back the DOLA and repaying for a lower cost.
                    </Text>
                    <Text pt="2" fontWeight="bold">What are the Fed contracts?</Text>
                    <Text>
                        Fed contracts handle DOLA supply in protocols and liquidity pools and play an important role in the DOLA peg.
                    </Text>
                    <Text>
                        Currently there are three types of Feds:
                    </Text>
                    <List>
                        <ListItem>- Cross-Lending Feds (Frontier & Fuse)</ListItem>
                        <ListItem>- Isolated-Lending Feds (FiRM)</ListItem>
                        <ListItem>- AMM Feds</ListItem>
                    </List>
                    <Link color="secondaryTextColor" href="https://docs.inverse.finance/inverse-finance/basics/the-dola-feds">
                        Learn more about DOLA and the Fed contracts
                    </Link>
                </VStack>
            }
        />
    )
}