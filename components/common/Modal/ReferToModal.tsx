import { VStack, Image, Stack } from "@chakra-ui/react"
import { SuccessMessage } from "../Messages";
import SimpleModal from "./SimpleModal";
import { Input } from "../Input";
import { CopyIcon } from "@chakra-ui/icons";
import { useWeb3React } from "@web3-react/core";
import { RSubmitButton } from "../Button/RSubmitButton";
import { useState } from "react";

export const ReferToModal = ({
    isOpen = false,
    onClose = () => { },
}) => {
    const { account } = useWeb3React();
    const [isCopied, setIsCopied] = useState(false);
    const refLink = `https://inverse.finance?referrer=${account}`;
    const twitterShareLink = `https://x.com/intent/tweet?text=${encodeURIComponent(`Borrow at a Fixed-Rate on FiRM!\nUse my Referral link to get rewards 👇\n${refLink}`)}`

    const copyRefLink = () => {
        navigator.clipboard.writeText(refLink);
        setIsCopied(true);
    }

    return <SimpleModal
        title={
            "Refer to a Fren!"
        }
        onClose={onClose}
        onCancel={onClose}
        isOpen={isOpen}
        okLabel="Sign"
        modalProps={{ minW: { base: '98vw', lg: '800px' }, scrollBehavior: 'inside' }}
    >
        <VStack p='6' spacing="4" alignItems="flex-start">
            <Input value={refLink} disabled />
            <VStack spacing="4" w='full'>
                <Stack direction={{ base: 'column', xl: 'row' }} w='full'>
                    <RSubmitButton fontSize="18px" w={{ base: 'full', xl: '50%' }} onClick={() => copyRefLink()}>
                        Copy Referral Link <CopyIcon ml="2" />
                    </RSubmitButton>
                    <Stack w={{ base: 'full', xl: '50%' }}>
                        <a
                            target="_blank"
                            href={twitterShareLink}>
                            <RSubmitButton fontSize="18px" w='full' onClick={() => copyRefLink()}>
                                Post on X (Twitter) <Image ml="2" src="https://abs.twimg.com/favicons/twitter.3.ico" h="20px" w="20px" />
                            </RSubmitButton>
                        </a>
                    </Stack>
                </Stack>
                {
                    isCopied && <SuccessMessage alertProps={{ w: 'full' }} description="The Referral Link has been copied!" />
                }
            </VStack>
        </VStack>
    </SimpleModal>
}