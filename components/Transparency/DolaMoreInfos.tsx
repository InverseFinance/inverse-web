import Link from '@app/components/common/Link'
import { ShrinkableInfoMessage } from '@app/components/common/Messages'
import { VStack, Text } from '@chakra-ui/react'

export const DolaMoreInfos = () => {
    return (
        <ShrinkableInfoMessage
            description={
                <VStack alignItems="flex-start">
                    <Text>
                        <b>DOLA</b> is a decentralized stablecoin pegged to the US dollar, its supply is managed via special contracts called <b>Feds</b>.
                    </Text>
                    <Text>
                        NB: DOLA has some bad debt, the safest way to get and use DOLA is by <b>borrowing it on FiRM</b>, that way you could even make a profit in the case of a depeg by repaying it for a lower cost.
                    </Text>
                    <Link color="secondaryTextColor" href="https://docs.inverse.finance/inverse-finance/technical/the-dola-fed">
                        Learn more about DOLA and the Fed contracts
                    </Link>
                </VStack>
            }
        />
    )
}