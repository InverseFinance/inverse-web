import { Box, ButtonProps, Image, Spinner, useDisclosure, VStack } from '@chakra-ui/react';
import { generateOnRampURL } from '@coinbase/cbpay-js';
import { useState } from 'react';
import LinkButton, { SubmitButton } from '@app/components/common/Button';
import { Modal } from '@app/components/common/Modal';
import { InfoMessage } from '@app/components/common/Messages';
import { ExternalLinkIcon } from '@chakra-ui/icons';
import { RSubmitButton } from '@app/components/common/Button/RSubmitButton';

const appId = '033abd6f-0903-4abc-bc2f-fed226b408a2';

export const CoinbasePayButton = ({
    account,
    text = 'Coinbase Pay',
    children,
    ...props
}: {
    account: string
    text?: string
} & ButtonProps) => {
    const { isOpen, onClose, onOpen } = useDisclosure();
    const [url, setUrl] = useState('');

    const handleClick = () => {
        const newUrl = generateOnRampURL({
            appId,
            destinationWallets: [
                {
                    address: account,
                    blockchains: ['ethereum'],
                },
            ],
        })
        setUrl(newUrl);
        onOpen();
    };

    const handleClose = () => {
        setUrl('');
        onClose();
    }

    return <>
        <Modal
            header="On-Ramp with Coinbase Pay"
            isOpen={isOpen && !!url}
            onClose={handleClose}
            size={'2xl'}
        >
            <VStack alignItems="center" justify="center" w='full' p='6' spacing="6">
                <InfoMessage
                    alertProps={{ w: 'full' }}
                    title="You need a Coinbase Account to use Coinbase Pay"  
                    description="Coinbase Pay allows you buy tokens for your connected Wallet address with fiat funds."                  
                />
                <RSubmitButton maxW="300px" alignItems="center" href={url} isExternal target="_blank">
                    Continue to Coinbase Pay <ExternalLinkIcon ml="1" />
                </RSubmitButton>
            </VStack>
        </Modal>
        {
            children ? 
                <Box display="inherit" w='full' onClick={handleClick}>
                    {children}
                </Box> :
                <SubmitButton
                    {...props}
                    color="mainTextColor"
                    w='fit-content'
                    onClick={handleClick}
                    isLoading={isOpen && !url}
                    disabled={!account}
                >
                    {text} <Image src="/assets/projects/coinbase.svg" h="20px" ml="2" />
                </SubmitButton>
        }
    </>
};