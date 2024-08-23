import { VStack, Image, Stack, RadioGroup, Radio, Text } from "@chakra-ui/react"
import { InfoMessage, SuccessMessage } from "../Messages";
import SimpleModal from "./SimpleModal";
import { Input } from "../Input";
import { CopyIcon, ExternalLinkIcon } from "@chakra-ui/icons";
import { useWeb3React } from "@web3-react/core";
import { RSubmitButton } from "../Button/RSubmitButton";
import { useState } from "react";
import { useRouter } from "next/router";
import Link from "../Link";

export const ReferToModal = ({
    isOpen = false,
    onClose = () => { },
}) => {
    const { account } = useWeb3React();
    const router = useRouter();
    const [isCopied, setIsCopied] = useState(false);
    const [refPage, setRefPage] = useState('/');
    const refLink = `https://inverse.finance${refPage}?referrer=${account}`;
    const twitterShareLink = `https://x.com/intent/tweet?text=${encodeURIComponent(`Borrow at a Fixed-Rate on FiRM!\n${refLink}`)}`

    const copyRefLink = () => {
        navigator.clipboard.writeText(refLink);
        setIsCopied(true);
    }

    return <SimpleModal
        title={
            "Refer a Fren!"
        }
        onClose={onClose}
        onCancel={onClose}
        isOpen={isOpen}
        okLabel="Sign"
        modalProps={{ minW: { base: '98vw', lg: '900px' }, scrollBehavior: 'inside' }}
    >
        <VStack p='6' spacing="8" alignItems="flex-start">
            <VStack w='full' alignItems="flex-start">
                <Text fontWeight="bold">Link destination:</Text>
                <RadioGroup w='full' bgColor="mainBackground" p="2" onChange={setRefPage} value={refPage}>
                    <Stack direction='row' w='full' spacing="4">
                        <Radio value='/'>Homepage</Radio>
                        {/* <Radio value={router?.pathname}>Current page</Radio> */}
                        <Radio value='/firm'>FiRM page</Radio>
                    </Stack>
                </RadioGroup>
            </VStack>
            <Input bgColor="contrastMainTextColor" color="mainTextColor" value={refLink} disabled />
            <VStack spacing="4" w='full'>
                <Stack direction={{ base: 'column', xl: 'row' }} w='full'>
                    <RSubmitButton fontSize="18px" w={{ base: 'full', xl: '50%' }} onClick={() => copyRefLink()}>
                        Copy Referral Link <CopyIcon ml="2" />
                    </RSubmitButton>
                    <Stack w={{ base: 'full', xl: '50%' }}>
                        <a
                            target="_blank"
                            href={twitterShareLink}>
                            <RSubmitButton fontSize="18px" w='full'>
                                Share on X (Twitter) <Image ml="2" src="https://abs.twimg.com/favicons/twitter.3.ico" h="20px" w="20px" />
                            </RSubmitButton>
                        </a>
                    </Stack>
                </Stack>
                {
                    isCopied && <SuccessMessage alertProps={{ w: 'full' }} description="The Referral Link has been copied!" />
                }
                <InfoMessage
                    alertProps={{ w: 'full' }}
                    description={
                        <VStack alignItems="flex-start" spacing="0">                            
                            <Text>Once the user connects their wallet they will be able to confirm the referral with a wallet signature.</Text>
                        </VStack>
                    }
                />
            </VStack>
        </VStack>
    </SimpleModal>
}