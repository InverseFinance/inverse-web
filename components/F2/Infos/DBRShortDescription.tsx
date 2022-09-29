import { InfoMessage } from "@app/components/common/Messages"
import { VStack, Text } from "@chakra-ui/react"

export const DBRShortDescription = () => {
    return <InfoMessage
    alertProps={{ w: 'full' }}
    title="The Dola Borrowing Rights token"
    description={
        <VStack spacing="0" w='full' alignItems="flex-start">
            <Text>
                DBR is a new token available on open markets, the Fixed Borrowing Rate you will get for your loan is directly linked to the price at which you will get DBR tokens, when borrowing they will stay in your wallet but will be burned over time.
            </Text>
        </VStack>
    }
    />
}