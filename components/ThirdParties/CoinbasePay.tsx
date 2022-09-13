import { ButtonProps, Image } from '@chakra-ui/react';
import type { CBPayInstanceType } from '@coinbase/cbpay-js';
import { initOnRamp } from '@coinbase/cbpay-js';
import { useEffect, useState } from 'react';
import { SubmitButton } from '../common/Button';

const appId = '033abd6f-0903-4abc-bc2f-fed226b408a2';

export const CoinbasePayButton = ({
    account,
    text = 'Coinbase Pay',
    ...props
}: {
    account: string
    text: string
} & ButtonProps) => {
    const [onrampInstance, setOnrampInstance] = useState<CBPayInstanceType | undefined>();

    useEffect(() => {        
        const options = {
            appId,
            target: '#coinbase-pay-container',
            widgetParameters: {
                destinationWallets: [
                    {
                        address: account,
                        blockchains: ['ethereum'],
                        assets: [],
                    },
                ],
            },
            onSuccess: () => {
                console.log('success');
            },
            onExit: () => {
                console.log('exit');
            },
            onEvent: (event) => {
                console.log('event', event);
            },
            experienceLoggedIn: 'popup',
            experienceLoggedOut: 'popup',
            closeOnExit: true,
            closeOnSuccess: true,
        };        
        initOnRamp(options, (_, instance) => {
            setOnrampInstance(instance);
        });

        return () => {
            onrampInstance?.destroy();
        };
    }, [account]);

    const handleClick = () => {        
        onrampInstance?.open();
    };

    return <SubmitButton {...props} color="mainTextColor" w='fit-content' onClick={handleClick} isLoading={!onrampInstance} disabled={!onrampInstance}>
        {text} <Image src="/assets/projects/coinbase.svg" h="20px" ml="2" />
    </SubmitButton>
};