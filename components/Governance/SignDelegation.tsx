import { useState, useEffect } from 'react';
import { Text, Textarea, VStack, useClipboard } from '@chakra-ui/react';
import { EditIcon, CopyIcon } from '@chakra-ui/icons';
import { InfoMessage } from '@app/components/common/Messages';
import { SubmitButton } from '@app/components/common/Button';
import { getDelegationSig } from '@app/util/governance';
import { JsonRpcSigner } from '@ethersproject/providers';

export const SignDelegation = ({
    signDisabled,
    delegateAddress,
    isSelf,
    signer,
}: {
    signDisabled: boolean,
    delegateAddress: string,
    isSelf: boolean,
    signer?: JsonRpcSigner,
}) => {
    const [signature, setSignature] = useState('')
    const [hasLastSigCopied, setHasLastSigCopied] = useState(false)
    const { hasCopied, onCopy } = useClipboard(signature)

    useEffect(() => {
        if (!hasCopied) { return }
        setHasLastSigCopied(true);
    }, [hasCopied]);

    useEffect(() => {
        setHasLastSigCopied(false);
    }, [signature]);

    const handleDelegation = async () => {
        if (!signer) { return }
        const sig = await getDelegationSig(signer, delegateAddress);
        setSignature(sig);
    }

    return (
        <>
            <InfoMessage
                description={
                    <>
                        Do you want to delegate your <b>voting power</b> to {isSelf ? 'yourself' : 'the address above'} ?
                        <Text mt="2" mb="2">This action will <b>not cost you any gas fees</b>.</Text>
                        Previous delegations to other addresses (including yours) will be withdrawn.
                        You can also change your delegate at any time in the future.
                        <Text mt="2" mb="2" fontWeight="bold">
                            Delegation will apply for both {process.env.NEXT_PUBLIC_REWARD_TOKEN_SYMBOL} and x{process.env.NEXT_PUBLIC_REWARD_TOKEN_SYMBOL}.
                        </Text>
                        <Text textDecoration="underline" mt="2" mb="2" fontWeight="bold">
                            Once signed, you will need to {
                                isSelf ?
                                    'submit the signature data' :
                                    'send the signature data to the delegatee whom will then finish the process'
                            }
                        </Text>
                    </>
                } />

            <SubmitButton mt="2" onClick={handleDelegation} disabled={signDisabled} alignItems="center">
                <EditIcon mr="2" boxSize={3} />
                {signDisabled ? 'Please connect to Mainnet first' : 'Sign Delegation'}
            </SubmitButton>

            {
                signature ?
                    <VStack spacing="4" mt="3" alignItems="flex-start">
                        <Text fontWeight="bold" align="left">Delegation Signature :</Text>
                        <Textarea value={signature} readOnly borderWidth="0px" fontSize="sm" p={1.5} />
                        <SubmitButton onClick={onCopy} alignItems="center">
                            <CopyIcon mr="2" boxSize={3} /> {hasLastSigCopied ? 'Copied !' : 'Copy'}
                        </SubmitButton>
                    </VStack>
                    : null
            }
            {
                hasLastSigCopied &&
                <InfoMessage
                    alertProps={{ mt: "5", fontSize: '16px', w: 'full', fontWeight: 'bold' }}
                    description={
                        isSelf ?
                            'You can now submit your signature via the "SUBMIT SIGNATURES" button, the process is the same as delegation signatures'
                            :
                            'Now please send the copied signature to your delegatee, the Delegation Change will take effect once your delegatee submits the signature on-chain'
                    }
                />
            }
        </>
    )
}