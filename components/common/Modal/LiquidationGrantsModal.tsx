import { VStack, Text, HStack, RadioGroup, Stack, Radio } from "@chakra-ui/react"
import { InfoMessage, SuccessMessage } from "../Messages";
import SimpleModal from "./SimpleModal";
import Link from "../Link";
import { Steps } from "../Step";
import { ExternalLinkIcon } from "@chakra-ui/icons";
import { useEffect, useState } from "react";
import { Input } from "../Input";
import { RSubmitButton } from "../Button/RSubmitButton";
import { useWeb3React } from "@app/util/wallet";
import { shortenAddress } from "@app/util";
import { CAMPAIGNS_SETTINGS, LIQUIDATION_GRANTS_MSG_TO_SIGN } from "@app/config/campaigns.config";

const liquidationCampaignId = `liquidation-grants-v1.0.1`;

const saveSig = async (account: string, form: any, sig: string) => {
    return fetch(`/api/campaigns?campaign=${liquidationCampaignId}&address=${account}`, {
        method: 'POST',
        body: JSON.stringify({ sig, form }),
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
    });
}

const checkSig = async (account: string) => {
    const localCacheFirst = localStorage.getItem(`${liquidationCampaignId}-${account}`);
    if (localCacheFirst === 'true') {
        return { applied: true };
    }
    const res = await fetch(`/api/campaigns?campaign=${liquidationCampaignId}&address=${account}`);
    return res.json();
}

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
    const { provider, account } = useWeb3React();
    const [liquidatorType, setLiquidatorType] = useState('bot');
    const [isSuccess, setIsSuccess] = useState(false);
    const [contact, setContact] = useState('');
    const [txHash, setTxHash] = useState('');
    const [isInvalidForm, setIsInvalidForm] = useState(false);

    const apply = async () => {
        if (provider && !!account) {
            const signer = provider?.getSigner();
            const sig = await signer.signMessage(LIQUIDATION_GRANTS_MSG_TO_SIGN + account.toLowerCase()).catch(() => '');
            if (!!sig) {
                return saveSig(account, { liquidatorType, contact, txHash }, sig);
            }
        }
    }

    const onSuccess = (result) => {
        localStorage.setItem(`${liquidationCampaignId}-${account}`, 'true');
        setIsSuccess(true);
    }

    useEffect(() => {
        if (!account) return;
        setIsSuccess(false);
        checkSig(account).then((res) => {
            setIsSuccess(!!res?.applied);
        });
    }, [account]);

    useEffect(() => {
        setIsInvalidForm(!CAMPAIGNS_SETTINGS[liquidationCampaignId].fieldsSettings.txHash.isValid(txHash));
    }, [txHash]);

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
            {
                isSuccess ? <SuccessMessage
                    alertProps={{ w: 'full' }}
                    description={<Text>{shortenAddress(account)} has successfully applied!</Text>}
                /> : !account ? <InfoMessage
                    alertProps={{ w: 'full' }}
                    description={<Text>Please connect your wallet first</Text>}
                /> : <>
                    <VStack alignItems="flex-start" w='full' spacing="2">
                        <Text fontWeight="bold">Please provide one transaction hash were you did an eligible liquidation</Text>
                        <Input placeholder="0x0000000000000000000000000000000000000000000000000000000000000000" fontSize="14px" value={txHash} onChange={(e) => setTxHash(e.target.value)} />
                    </VStack>
                    <VStack alignItems="flex-start" w='full' spacing="2">
                        <Text fontWeight="bold">Is this liquidating account an EOA or are you the operator of the MEV liquidator?</Text>
                        <RadioGroup w='full' bgColor="mainBackground" p="2" onChange={setLiquidatorType} value={liquidatorType}>
                            <Stack direction='row' w='full' spacing="4">
                                <Radio value='eoa'>EOA</Radio>
                                <Radio value='bot'>Operator</Radio>
                            </Stack>
                        </RadioGroup>
                    </VStack>
                    <VStack alignItems="flex-start" w='full' spacing="2">
                        <Text fontWeight="bold">Your contact (email, discord or telegram):</Text>
                        <Input value={contact} onChange={(e) => setContact(e.target.value)} />
                        <Text color="mainTextColorLight">
                            Not required but can be useful. Alternatively, just stop into the Inverse Finance Discord Risk channel.
                        </Text>
                    </VStack>
                    <RSubmitButton isDisabled={isInvalidForm} onSuccess={onSuccess} onClick={apply}>
                        Apply by signing with wallet
                    </RSubmitButton>
                </>
            }
        </VStack>
    </SimpleModal>
}

function setIsFormInvalid(arg0: boolean) {
    throw new Error("Function not implemented.");
}
