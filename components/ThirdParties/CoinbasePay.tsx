import { ButtonProps } from '@chakra-ui/react';
import type { CBPayInstanceType, InitOnRampParams } from '@coinbase/cbpay-js';
import { initOnRamp, generateOnRampURL } from '@coinbase/cbpay-js';
import { useEffect, useState } from 'react';
import { SubmitButton } from '../common/Button';

const appId = '033abd6f-0903-4abc-bc2f-fed226b408a2';

export const CoinbasePayButton = ({
    account,
    ...props
}: {
    account: string
} & ButtonProps) => {
    const [onrampInstance, setOnrampInstance] = useState<CBPayInstanceType | undefined>();

    useEffect(() => {
        // testing
        window['__initOnRamp'] = initOnRamp;
        window['__generateOnRampURL'] = generateOnRampURL;
        initOnRamp({
            appId,
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
            experienceLoggedIn: 'popup',
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
        const onRampURL = generateOnRampURL({
            appId,
            destinationWallets: [
                { address: account, blockchains: ["ethereum"] },
            ]
        });
        console.log(onRampURL);
        onrampInstance?.open();
    };

    return <SubmitButton {...props} color="mainTextColor" w='fit-content' onClick={handleClick} disabled={!onrampInstance}>Buy with Coinbase</SubmitButton>;
};