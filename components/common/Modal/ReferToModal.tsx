import { VStack, Image, Stack, RadioGroup, Radio, Text } from "@chakra-ui/react"
import { InfoMessage, SuccessMessage } from "../Messages";
import SimpleModal from "./SimpleModal";
import { Input } from "../Input";
import { CopyIcon } from "@chakra-ui/icons";
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
        modalProps={{ minW: { base: '98vw', lg: '700px' }, scrollBehavior: 'inside' }}
    >
        <VStack p='6' spacing="8" alignItems="flex-start">
            <VStack w='full' alignItems="flex-start">
                <Text fontWeight="bold">Link destination:</Text>
                <RadioGroup w='full' bgColor="mainBackground" p="2" onChange={setRefPage} value={refPage}>
                    <Stack direction='row' w='full' spacing="4">
                        <Radio value='/'>Homepage</Radio>
                        <Radio value={router?.pathname}>Current page</Radio>
                        <Radio value='/firm'>FiRM page</Radio>
                    </Stack>
                </RadioGroup>
            </VStack>
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
                <Link href="" target="_blank" isExternal>
                    Register your application as an Affiliate
                </Link>                
                <InfoMessage
                    alertProps={{ w: 'full' }}
                    description={
                        <VStack>
                            <Text>- Rewards are paid against DBR that is spent on new DOLA loans for up to 12 months</Text>
                            <Text>- Rewards are paid against user wallet addresses with a Maximum of one Affiliate per wallet</Text>
                            <Text>- Rewards are viewable on the Affiliate Dashboard & are issued monthly directly yo your wallet</Text>
                            <Text>- Minimum loan size: $3,000. Maximum monthly payout per Affiliate: $10,000</Text>
                            <Text>- 90 days test program runs from August 15th thru November 15th. Program may be extended by Governance</Text>
                            <Text>- Refferals made from prohibited Jurisdictions, via sybil attacks or other prohibited means may be denied payment</Text>
                            <Text>- Open to approved participants only. Governance reserves the right to make changes to the program at any time</Text>
                        </VStack>
                    }
                />
            </VStack>
        </VStack>
    </SimpleModal>
}