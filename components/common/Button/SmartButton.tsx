import { useEffect, useState, useRef } from 'react';
import { Button } from '@chakra-ui/react'
import { showFailNotif, showToast } from '@inverse/util/notify';
import { handleTx } from '@inverse/util/transactions';
import { SmartButtonProps } from '@inverse/types';
import { useWeb3React } from '@web3-react/core';
import { Web3Provider, TransactionResponse } from '@ethersproject/providers';
import { forceQuickAccountRefresh } from '@inverse/util/web3';
import { useRouter } from 'next/dist/client/router';

/**
 * "Smart" Button :
 * If the onClick function returns a Promise, we show a loader in the btn and disable the btn while the Promise is pending
 * If it's transaction Promise, we use handleTx to deal with the transaction status and notify the user
 * If there's an error there will be a notification (transaction case or not)
 *  **/
export const SmartButton = (props: SmartButtonProps) => {
    const { deactivate, activate, connector } = useWeb3React<Web3Provider>();
    const { query } = useRouter();
    const [isPending, setIsPending] = useState(false);
    const [loadingText, setLoadingText] = useState(props.loadingText || props?.children);
    const { onSuccess, onFail, onPending, refreshOnSuccess, ...btnProps } = props;
    const isMountedRef = useRef(true)

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
        const returnedValueFromClick: any = btnProps.onClick(e);
        if (!returnedValueFromClick) { return }

        // click returns a Promise
        if (returnedValueFromClick?.then) {
            if (query?.viewAddress) {
                showToast({
                    duration: null,
                    status: 'error',
                    title: 'Warning: Viewing Another Address',
                    description: "You're using your wallet but are seeing another's account data! We strongly recommend to cancel the transaction",
                })
            }
            // when pending disable btn and show loader in btn
            setIsPending(true);

            try {
                const promiseResult = await returnedValueFromClick;
                // it's a TransactionResponse => handle tx status
                if (promiseResult?.hash) {
                    const handleSuccess = (tx: TransactionResponse) => {
                        if (onSuccess) { onSuccess(tx) }
                        if (refreshOnSuccess) { forceQuickAccountRefresh(connector, deactivate, activate) }
                    }
                    await handleTx(promiseResult, { onSuccess: handleSuccess, onFail, onPending });
                }
            } catch (e) {
                showFailNotif(e)
            }
            if (!isMountedRef.current) { return }
            setIsPending(false);
        }
    }

    return (
        <Button
            loadingText={loadingText}
            {...btnProps}
            // keep after {...props} :
            disabled={btnProps.disabled || btnProps.isDisabled || isPending}
            onClick={handleClick}
            isLoading={btnProps.isLoading || isPending}
            lineHeight={0}
        />
    )
}