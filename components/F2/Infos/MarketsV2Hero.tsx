import LinkButton, { SubmitButton } from "@app/components/common/Button"
import { VStack, Text, Stack } from "@chakra-ui/react"

export const MarketsV2Hero = ({
    onGetStarted = () => {}
}) => {
    return <VStack w='full' spacing="8">
        <Text as='h1' fontSize='48px' fontWeight="extrabold">Markets V2</Text>
        <VStack w='full' spacing='12'>
            <VStack alignItems="flex-start" w='full' spacing='2'>
                <Text as='h2' fontSize='28px' fontWeight="extrabold">A new protocol built from scratch</Text>
                {/* <Text fontSize='18px'>An <b>Innovative Lending Protocol</b> built from scratch</Text> */}
                <Text fontSize='18px'>Focused on <b>Simplicity and Safety</b></Text>
                <Text fontSize='18px'><b>Isolated Markets</b> and <b>Personal Escrows</b></Text>
                <Text fontSize='18px'><b>Flashloan protection</b></Text>
            </VStack>
            <VStack alignItems="flex-start" w='full' spacing='2'>
                <Text fontSize='28px' fontWeight="extrabold">Introducing the <b>DOLA Borrowing Rights</b> token</Text>
                <Text fontSize='18px'>
                    DBR's purchase <b>price is the Borrowing Rate</b>
                </Text>
                <Text fontSize='18px'>
                    One DBR allows to borrow One DOLA for one year
                </Text>
                <Text fontSize='18px'>
                    <b>Fix a rate now and borrow later</b>, or <b>trade your rate</b>
                </Text>
            </VStack>
            <Stack direction={{ base: 'column', sm: 'row' }} w='full' justify='center'>
                <LinkButton w='fit-content' p='0' flexProps={{ w: 'fit-content', px: '8', h: '70px', fontSize: '18px' }} href="https://docs.google.com/document/d/1xDsuhhXTHqNLIZmlwjzCf-P7bjDvQEI72dS0Z0GGM38/edit" isOutline={true}
                >
                    Learn More
                </LinkButton>
                <SubmitButton w='fit-content' px='8' h='70px' fontSize='18px' onClick={onGetStarted}>
                    Get Started
                </SubmitButton>

            </Stack>
        </VStack>
    </VStack>
}