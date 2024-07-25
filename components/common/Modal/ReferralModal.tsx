import { VStack, Text } from "@chakra-ui/react"
import ConfirmModal from "./ConfirmModal"
import { useWeb3React } from "@web3-react/core";
import { savePoaSig } from "@app/util/poa";
import { InfoMessage } from "../Messages";
import { Input } from "../Input";
import { useEffect, useState } from "react";
import { isAddress } from "ethers/lib/utils";

export const REFERRAL_MSG = 'I have been referred by: ';

export const ReferralModal = ({
    referrer,
    onOk = () => { },
    isOpen = false,
    onClose = () => { },
    onCancel = () => { },
    onSuccess = () => { },
}: {
    referrer: string,
}) => {
    const { provider, account } = useWeb3React();
    const [refAddress, setRefAddress] = useState(referrer);
    const [isInvalid, setIsInvalid] = useState(false);

    const handleRefAddress = (address: string) => {
        setRefAddress(address);
    }

    useEffect(() => {
        setIsInvalid(!refAddress ? false : !isAddress(refAddress));
    }, [refAddress]);

    const handleOk = async () => {
        if (provider && !!account) {
            const signer = provider?.getSigner();
            const sig = await signer.signMessage(REFERRAL_MSG + refAddress).catch(() => '');
            if (!!sig) {
                const saveRes = await savePoaSig(account, sig);
                console.log(saveRes);
                if (saveRes.status === 200) {
                    if (onSuccess) {
                        onSuccess();
                    }
                    onClose();
                    onOk();
                }
            }
        } else {
            onOk();
        }
    }

    return <ConfirmModal
        title={`Referral Program`}
        onClose={onClose}
        onCancel={onClose}
        onOk={() => {
            return handleOk()
        }}
        isOpen={isOpen}
        okLabel="Sign"
        modalProps={{ scrollBehavior: 'inside', minW: { base: '98vw', lg: '700px' }  }}
        okDisabled={isInvalid || !refAddress}
    >
        <VStack p='4' spacing="4" alignItems="flex-start">
            <VStack alignItems="flex-start" w='full'>
                <Text fontWeight="bold">Referrer's address:</Text>
                <Input isInvalid={isInvalid} border={isInvalid ? '1px solid red' : ''} type="string" value={refAddress} onChange={(e) => handleRefAddress(e.target.value)} />
            </VStack>
            <InfoMessage alertProps={{ w: 'full' }} description="Please sign a message with your wallet to confirm your who referred to you." />
        </VStack>
    </ConfirmModal>
}