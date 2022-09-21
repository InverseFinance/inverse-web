import { SubmitButton } from "@app/components/common/Button"
import { InfoMessage } from "@app/components/common/Messages"
import { VStack, Text, HStack } from "@chakra-ui/react"

export const F2WalkthroughIntro = ({    
    onStepChange,
}: {    
    onStepChange: (step: number) => void
}) => {
    return <>
        <InfoMessage
            alertProps={{ w: 'full' }}
            title="What is F2?"
            description={
                <VStack spacing="0" w='full' alignItems="flex-start">
                    <Text>F2 is a new <b>Innovative Lending Protocol</b> built from scratch and was developped with a strong focus on <b>Simplicity and Safety</b>.</Text>
                </VStack>
            }
        />
        {/* <InfoMessage
            alertProps={{ w: 'full' }}
            title="What are the key features?"
            description={
                <VStack spacing="0" w='full' alignItems="flex-start">
                    <Text>- Borrow DOLA stablecoin against your Collateral</Text>
                    <Text>- Fixed Borrow Rate for any amount of time</Text>
                    <Text>- Fix a Rate now, Borrow later</Text>
                    <Text>- Trade your Borrow Rate</Text>                    
                    <Text>- Voting rights are kept for Governance Tokens</Text>
                </VStack>
            }
        /> */}
        {/* <InfoMessage
            alertProps={{ w: 'full' }}
            title="What are the safety measures?"
            description={
                <VStack spacing="0" w='full' alignItems="flex-start">
                    <Text>- Isolated Markets and Liquidity</Text>
                    <Text>- User funds are not Borrowable by others</Text>
                    <Text>- Third-party contracts cannot Borrow (unless whitelisted)</Text>
                    <Text>- Flashloan attack protection</Text>
                    <Text>- Borrow caps</Text>
                </VStack>
            }
        /> */}
        {/* <InfoMessage
            alertProps={{ w: 'full' }}
            title="What are the key features and safety measures?"
            description={
                <VStack spacing="0" w='full' alignItems="flex-start">
                    <Text>- Fixed-Rate DOLA stablecoin borrowing</Text>
                    <Text>- Fix Rate now, borrow later, trade your borrow rate</Text>
                    <Text>- Isolated Markets and Liquidity, user funds not borrowable</Text>                                     
                    <Text>- Flashloan attack protection, Borrow caps</Text>                    
                </VStack>
            }
        /> */}
        <HStack w='full' justify="flex-end" pt="4">
            <SubmitButton onClick={() => onStepChange(2)}>
                Get Started
            </SubmitButton>
        </HStack>
    </>
}