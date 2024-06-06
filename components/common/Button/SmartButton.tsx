import { useEffect, useState, useRef } from 'react';
import { Button } from '@chakra-ui/react'
import { showFailNotif, showToast } from '@app/util/notify';
import { handleTx } from '@app/util/transactions';
import { SmartButtonProps } from '@app/types';
import { useWeb3React } from '@web3-react/core';
import { Web3Provider, TransactionResponse } from '@ethersproject/providers';
import { forceQuickAccountRefresh } from '@app/util/web3';
import { useRouter } from 'next/dist/client/router';
import { gaEvent } from '@app/util/analytics';
import { handleApiResponse } from '@app/util/misc';
import { useMultisig } from '@app/hooks/useSafeMultisig';

/**
 * "Smart" Button :
 * If the onClick function returns a Promise, we show a loader in the btn and disable the btn while the Promise is pending
 * If it's transaction Promise, we use handleTx to deal with the transaction status and notify the user
 * If there's an error there will be a notification (transaction case or not)
 *  **/
export const SmartButton = (props: SmartButtonProps) => {
    const { isMultisig } = useMultisig();
    const { connector } = useWeb3React<Web3Provider>();

    const { query } = useRouter();
    const [isPending, setIsPending] = useState(false);
    const [loadingText, setLoadingText] = useState(props.loadingText || props?.children);
    const { onSuccess, onFail, onPending, refreshOnSuccess, themeColor, ...btnProps } = props;
    const isMountedRef = useRef(true);

    useEffect(() => {
        return () => {
            isMountedRef.current = false
        }
    }, [])

    useEffect(() => {
        setLoadingText(btnProps.loadingText || btnProps?.children);
    }, [btnProps.loadingText, btnProps.children]);

    // wraps the onClick function given to handle promises/transactions automatically
    const handleClick = async (e: any) => {
        if (!btnProps.onClick) { return }

        const submitClick = async () => {
            const btnAction = props.gaAction || e?.target.getAttribute('data-testid') || e?.target?.innerText || '';
            if (btnAction) {
                gaEvent({ action: btnAction })
            }

            const returnedValueFromClick: any = btnProps.onClick(e);
            if (!returnedValueFromClick) { return }

            // click returns a Promise
            if (returnedValueFromClick?.then) {
                if (query?.viewAddress) {
                    alert("You're in View Address Mode: we are returning you to normal mode for safety");
                    window.location.search = '';
                }
                // when pending disable btn and show loader in btn
                setIsPending(true);

                try {
                    const promiseResult = await returnedValueFromClick;
                    // it's a TransactionResponse => handle tx status
                    if (promiseResult?.hash) {
                        const handleSuccess = (tx: TransactionResponse) => {
                            if (onSuccess) { onSuccess(tx) }
                            if (refreshOnSuccess) { forceQuickAccountRefresh(connector) }
                        }
                        await handleTx(promiseResult, { onSuccess: handleSuccess, onFail, onPending });
                    } else {
                        handleApiResponse(promiseResult);
                    }
                } catch (e) {
                    showFailNotif(e)
                }
                if (!isMountedRef.current) { return }
                setIsPending(false);
            }
        }

        if(!isMultisig && btnProps.needPoaFirst) {
            const customEvent = new CustomEvent('poa-modal', { detail: { onOk: () => () => submitClick() } });
            document.dispatchEvent(customEvent);
        } else {
            submitClick();
        }
    }

    const colorFactor = (Number((themeColor?.match(/\.(.*$)/) || ['', '500'])[1]) + 100).toString();
    const themeColors = themeColor ? { bgColor: themeColor, _hover: { bgColor: `${themeColor.replace(/\..*$/, '')}.${colorFactor}` } } : {}
    const disabled = btnProps.disabled || btnProps.isDisabled || isPending;
    return (
        <Button
            loadingText={loadingText}
            {...btnProps}
            {...themeColors}
            // keep after {...props} :
            disabled={disabled}
            isDisabled={disabled}
            onClick={handleClick}
            isLoading={btnProps.isLoading || isPending}
            lineHeight={0}
        />
    )
}