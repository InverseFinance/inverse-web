import { VStack, Text, HStack } from "@chakra-ui/react"
import { InfoMessage } from "../Messages";
import SimpleModal from "./SimpleModal";
import Link from "../Link";
import { Steps } from "../Step";
import { ExternalLinkIcon } from "@chakra-ui/icons";
import { useState } from "react";
import { Input } from "../Input";

const steps = [
    {
        text: <HStack spacing="1">
            <Text>Check eligible markets and current rewards:</Text>
            <Link href="https://docs.google.com/spreadsheets/d/1SLZpszD2ghdu11goE9tjJ4r4Kw0bCsitMYDvYcUocQo/edit?gid=557914745#gid=557914745" isExternal target="_blank" textDecoration="underline">Access Spreadsheet <ExternalLinkIcon /></Link>
        </HStack>
    },
    {
        text: <Text>Apply for the grant</Text>
    },
    {
        text: <HStack spacing="1">
            <Text>Be amongst the three first unique liquidators of an eligible market</Text>
        </HStack>
    },
];

export const LiquidationGrantsModal = ({
    isOpen = false,
    onClose = () => { },
}) => {
    const [bool, setBool] = useState(false);
    const [contact, setContact] = useState('');
    return <SimpleModal
        title={
            <HStack spacing="2">
                <Text>Apply to the Liquidation Grants Program</Text>
            </HStack>
        }
        onClose={onClose}
        onCancel={onClose}
        isOpen={isOpen}
        okLabel="Sign"
        modalProps={{ minW: { base: '98vw', lg: '800px' }, scrollBehavior: 'inside' }}
    >
        <VStack p='6' spacing="4" alignItems="flex-start">
            <InfoMessage
                alertProps={{ w: 'full' }}
                description={
                    <VStack alignItems="flex-start" spacing="1">
                        <Text>FiRM offers <b>exotic collateral</b> types such as illiquid tokens, niche DeFi derivatives, and real-world assets (RWAs) that <b>may not be monitored by traditional liquidators</b>. These assets pose risks of delayed liquidation due to their illiquidity or lack of clear liquidation routes.</Text>
                        <Text fontWeight="bold">The Liquidator Grant Program aims to:</Text>
                        <Text>- Attract liquidators to monitor and liquidate exotic collateral markets.</Text>
                        <Text>- Establish direct communication with liquidators for ongoing engagement and updates.</Text>
                    </VStack>
                }
            />
            <Steps steps={steps} />
            <VStack w='full' spacing="2">
                <Text>Are you ready to apply?</Text>
                <Checkbox isChecked={bool} onChange={() => setBool(!bool)}>I agree to be contacted by FiRM</Checkbox>
            </VStack>
            <VStack w='full' spacing="2">
                <Text>Your contact (email, discord or telegram)</Text>
                <Input value={contact} onChange={(e) => setContact(e.target.value)} />
                <Text>Not required but can be useful. Alternatively, just stop into the Inverse Finance Discord Risk channel.</Text>
            </VStack>
        </VStack>
    </SimpleModal>
}