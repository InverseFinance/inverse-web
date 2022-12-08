import { InfoMessage } from "@app/components/common/Messages"
import { VStack, Text } from "@chakra-ui/react"

export const DBRShortDescription = () => {
    return <InfoMessage
    alertProps={{ w: 'full' }}
    title="What is the DBR?"
    description={
        <VStack spacing="0" w='full' alignItems="flex-start">
            <Text>
                - DBR is token that serves as a <b>Borrowing Right</b> for the DOLA stablecoin
            </Text>
            <Text>
                - 1 DBR allows to borrow 1 DOLA for one year (or 2 DOLAs for 6 months, etc)
            </Text>
            <Text>
                - DBRs remain in your wallet, they are not staked
            </Text>
            <Text>
                - DBRs are spent over time when you have a DOLA loan (no gas cost as a borrower)
            </Text>
            <Text>
                - If you run out of DBR while having a debt to repay, someone can top-up your DBR balance at a higher price than the DBR market price
            </Text>
            <Text>
                - The price of DBR is the "Borrowing Rate", meaning you can get a fixed Borrow-Rate and use it later
            </Text>
            <Text>
                - You can get DBRs on DEXes or automatically by enabling the auto-buy feature in the form
            </Text>
            {/* <Text>DBR is speculation on future interest rates and the current price is the current interest rate</Text> */}
        </VStack>
    }
    />
}