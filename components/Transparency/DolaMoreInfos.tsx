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
                        <b>TIP</b>: DOLA currently has some bad debt as a result of oracle manipulations on the now deprecated Frontier; this is actively being paid down using DAO revenues. <b>Borrowing and using DOLA on FiRM protects the user from risks of depegging below $1</b>, while also presenting the opportunity to make a profit in such situation via buying back the DOLA and repaying for a lower cost.
                    </Text>
                    <Link color="secondaryTextColor" href="https://docs.inverse.finance/inverse-finance/technical/the-dola-fed">
                        Learn more about DOLA and the Fed contracts
                    </Link>
                </VStack>
            }
        />
    )
}