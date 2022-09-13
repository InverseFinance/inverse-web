import { ButtonProps } from '@chakra-ui/react';
import type { CBPayInstanceType, InitOnRampParams } from '@coinbase/cbpay-js';
import { initOnRamp } from '@coinbase/cbpay-js';
import { useEffect, useState } from 'react';
import { SubmitButton } from '../common/Button';

export const CoinbasePayButton = ({
    account,
    ...props
}: {
    account: string
} & ButtonProps) => {    
    const [onrampInstance, setOnrampInstance] = useState<CBPayInstanceType | undefined>();

    useEffect(() => {
        initOnRamp({
            appId: '033abd6f-0903-4abc-bc2f-fed226b408a2',
            clientName: 'Inverse Finance',
            widgetParameters: {
                destinationWallets: [
                    {
                        address: account,
                        blockchains: ['ethereum'],
                        // assets: [],
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
            experienceLoggedIn: 'embedded',
            experienceLoggedOut: 'popup',
            closeOnExit: true,
            closeOnSuccess: true,
        }, (_, instance) => {
            setOnrampInstance(instance);
        });

        return () => {
            onrampInstance?.destroy();
        };
    }, [account]);

    const handleClick = () => {
        onrampInstance?.open();
    };

    return <SubmitButton {...props} color="mainTextColor" w='fit-content' onClick={handleClick} disabled={!onrampInstance}>Buy with Coinbase</SubmitButton>;
};