import { SubmitButton } from "@app/components/common/Button"
import { InfoMessage } from "@app/components/common/Messages"
import { VStack, Text, HStack } from "@chakra-ui/react"
import { DBRShortDescription } from "@app/components/F2/Infos/DBRShortDescription"
import { useContext } from "react"
import { F2MarketContext } from "@app/components/F2/F2Contex"

export const F2WalkthroughIntro = ({    
    onStepChange,
}: {    
    onStepChange: (step: number) => void
}) => {
    const {
        step,
    } = useContext(F2MarketContext);
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
        <DBRShortDescription />
        <HStack w='full' justify="flex-end" pt="4">
            <SubmitButton onClick={() => onStepChange(step+1)}>
                Get Started
            </SubmitButton>
        </HStack>
    </>
}