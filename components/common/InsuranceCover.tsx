import { VStack, Text, HStack, Image, Stack, Box } from "@chakra-ui/react"
import { LinkOutlineButton } from "./Button"
import { DashBoardCard } from "../F2/UserDashboard"
import { ExternalLinkIcon } from "@chakra-ui/icons"
import { SuccessMessage } from "./Messages"

export const InsuranceCover = ({
    productName,
    productLink,
    description = "Covers smart contract exploits, severe oracle manipulations, governance attacks etc"
}: {
    productName: string,
    productLink: string,
    description?: string,
}) => {
    return <DashBoardCard px="8" py="4" minH="none">
        <Stack spacing={{ base: '4', xl: "2" }} alignItems={{ base: 'flex-start', xl: 'center' }} justify="space-between" direction={{ base: 'column', xl: 'row' }} w='full'>
            <VStack spacing="0" alignItems="flex-start">
                <Text fontSize="18px" fontWeight="extrabold">Insurance</Text>
                <Box spacing="2" display="inline-block">
                    <Text display="inline-block" mr="1" fontSize="14px">Offered by Nexus Mutual</Text>
                    <Image display="inline-block" src={"/assets/projects/nexus.ico"} w='auto' h="20px" />
                </Box>
            </VStack>
            <SuccessMessage alertProps={{ w: { base: 'full', xl: 'auto'} }} iconProps={{ height: 40, width: 40 }} description={description} />
            {/* <Text>{description}</Text> */}
            <LinkOutlineButton _hover={{ filter: 'brightness(1.5)' }} w='fit-content' target="_blank" href={productLink}>
                Buy Cover for {productName} <ExternalLinkIcon ml="1" />
            </LinkOutlineButton>
        </Stack>
    </DashBoardCard>
}

export const FirmInsuranceCover = () => {
    return <InsuranceCover productName="FiRM" productLink="https://opencover.com/app/?invite=FRENS10K&cover=207" />
}

export const SDolaInsuranceCover = () => {
    return <InsuranceCover productName="sDOLA" productLink="https://opencover.com/app/?invite=FRENS10K&cover=208" description="Covers smart contract exploits, governance attacks" />
}