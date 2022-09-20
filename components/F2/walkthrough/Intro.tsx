import { SubmitButton } from "@app/components/common/Button"
import { BigImageButton } from "@app/components/common/Button/BigImageButton"
import Container from "@app/components/common/Container"
import { InfoMessage } from "@app/components/common/Messages"
import { F2Market } from "@app/types"
import { VStack, Text, HStack } from "@chakra-ui/react"

export const F2WalkthroughIntro = ({
    market,
    onStepChange,
}: {
    market: F2Market
    onStepChange: (step: string) => void
}) => {
    return <Container
        noPadding
        p="0"
        label={`Getting Started`}
        description={`Quick and Easy Fixed-Rate Borrowing - Learn More`}
        href="https://docs.inverse.finance/inverse-finance/about-inverse"
        contentProps={{ p: '8' }}
    // contentBgColor={'lightPrimaryAlpha'}
    // image={isSmallerThan728 ? undefined : <BigImageButton bg={`url('/assets/dola.png')`} h="50px" w="80px" />}
    >
        <VStack w='full' alignItems="flex-start">
            <InfoMessage
                alertProps={{ w: 'full' }}
                title="What is F2?"
                description={
                    <VStack spacing="0" w='full' alignItems="flex-start">
                        <Text>F2 is a new <b>Innovative Lending Protocol</b> built from scratch and was developped with a strong focus on <b>Simplicity and Safety</b>.</Text>
                    </VStack>
                }
            />
            <InfoMessage
                alertProps={{ w: 'full' }}
                title="What are the key features?"
                description={
                    <VStack spacing="0" w='full' alignItems="flex-start">
                        <Text>- Borrow DOLA stablecoin against your Collateral</Text>
                        <Text>- Fixed Borrow Rate for any amount of time</Text>
                        <Text>- Fix a Rate now, Borrow later</Text>
                        <Text>- Trade your Borrow Rate</Text>
                        {/* <Text>- Yield Strategies</Text> */}
                        <Text>- Voting rights are kept for Governance Tokens</Text>
                    </VStack>
                }
            />
            <InfoMessage
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
            />
            <HStack w='full' justify="flex-end">
                <SubmitButton onClick={() => onStepChange('2')}>
                    Continue
                </SubmitButton>
            </HStack>
        </VStack>
    </Container>
}