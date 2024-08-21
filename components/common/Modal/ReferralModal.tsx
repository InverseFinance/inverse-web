import { VStack, Text } from "@chakra-ui/react"
import ConfirmModal from "./ConfirmModal"
import { useWeb3React } from "@web3-react/core";
import { InfoMessage, SuccessMessage } from "../Messages";
import { Input } from "../Input";
import { useEffect, useState } from "react";
import { isAddress } from "ethers/lib/utils";
import { useRouter } from "next/router";
import useStorage from "@app/hooks/useStorage";

export const getReferralMsg = (account: string, referrer: string) => {
    return `Referral proof signature\n\nMy account:\n${account}\n\nMy referrer:\n ` + referrer;
}

export const saveReferral = async (referrer: string, account: string, sig: string) => {
    const res = await fetch(`/api/referral?r=${referrer}&account=${account}`, {
        method: 'POST',
        body: JSON.stringify({ sig }),
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
    });
    return res;
}

export const ReferralModal = ({
    referrer,
    onOk = () => { },
    isOpen = false,
    onOpen = () => { },
    onClose = () => { },
    onCancel = () => { },
}: {
    referrer: string,
}) => {
    const { query } = useRouter();
    const { provider, account } = useWeb3React();
    const [refAddress, setRefAddress] = useState(referrer);
    const [isInvalid, setIsInvalid] = useState(false);
    const [isInited, setIsInited] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const { value: alreadyConfirmedRef, setter: saveConfirmedRef } = useStorage('confirmed-referral-v1');

    const isOwnAccount = !!account && !!refAddress && refAddress?.toLowerCase() === account?.toLowerCase();

    const handleRefAddress = (address: string) => {
        setRefAddress(address);
    }

    useEffect(() => {
        setIsInvalid(!refAddress ? false : !isAddress(refAddress) || isOwnAccount);
    }, [refAddress]);

    useEffect(() => {
        console.log('--')
        console.log(alreadyConfirmedRef)
        console.log(refAddress)
        console.log(isInited)
        console.log(query?.referrer )
        if (alreadyConfirmedRef === null && !isInited && !refAddress && !!query?.referrer && isAddress(query?.referrer)) {
            setIsInited(true);
            setRefAddress(query.referrer);
            onOpen();
        }
    }, [query, refAddress, isInited, alreadyConfirmedRef]);

    const onSuccess = () => {
        setIsSuccess(true);
        saveConfirmedRef(true);
        setTimeout(() => {
            // onClose();
            // onOk();
            window.location.replace(window.location.href.replace('referrer=', 'wasReferredBy='));
        }, 1300);
    }

    const handleOk = async () => {
        if (provider && !!account) {
            const signer = provider?.getSigner();
            const sig = await signer.signMessage(getReferralMsg(account, refAddress)).catch(() => '');
            if (!!sig) {
                const saveRes = await saveReferral(refAddress, account, sig);
                if (saveRes.status === 200) {
                    onSuccess();
                }
            }
        } else {
            onOk();
        }
    }

    return <ConfirmModal
        title={`Referral Program 🤝`}
        onClose={onClose}
        onCancel={onClose}
        onOk={() => {
            return handleOk()
        }}
        isOpen={isOpen}
        okLabel="Sign"
        modalProps={{ scrollBehavior: 'inside', minW: { base: '98vw', lg: '700px' } }}
        okDisabled={isInvalid || !refAddress}
    >
        <VStack p='6' spacing="4" alignItems="flex-start">
            {
                isSuccess ? <SuccessMessage alertProps={{ fontSize: '18px', fontWeight: 'bold', w: 'full' }} iconProps={{ height: 50, width: 50 }} description="Referrer registration complete!" />
                    : <>
                        <VStack alignItems="flex-start" w='full'>
                            <Text fontWeight="bold">You followed a referral link, your referrer is:</Text>
                            <Input textAlign="left" isInvalid={isInvalid} border={isInvalid ? '1px solid red' : ''} type="string" value={refAddress} onChange={(e) => handleRefAddress(e.target.value)} />
                        </VStack>

                        {
                            isOwnAccount && <InfoMessage alertProps={{ w: 'full' }} description={
                                <VStack spacing="0" alignItems="flex-start">
                                    <Text>You cannot refer to yourself :)</Text>
                                </VStack>
                            } />
                        }

                        <InfoMessage alertProps={{ w: 'full' }} description={
                            <VStack spacing="0" alignItems="flex-start">
                                <Text>If you want to confirm the referral, please sign a message with your wallet.</Text>
                                <Text>This action does not cost you anything.</Text>
                            </VStack>
                        } />
                    </>
            }
        </VStack>
    </ConfirmModal>
}