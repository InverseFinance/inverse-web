import { useEffect, useState } from 'react';
import { Button } from '@chakra-ui/react'
import { showFailNotif } from '@inverse/util/notify';
import { handleTx } from '@inverse/util/transactions';
import { SmartButtonProps } from '@inverse/types';
import { useWeb3React } from '@web3-react/core';
import { Web3Provider, TransactionResponse } from '@ethersproject/providers';
import { forceQuickAccountRefresh } from '@inverse/util/web3';

/**
 * "Smart" Button :
 * If the onClick function returns a Promise, we show a loader in the btn and disable the btn while the Promise is pending
 * If it's transaction Promise, we use handleTx to deal with the transaction status and notify the user
 * If there's an error there will be a notification (transaction case or not)
 *  **/
export const SmartButton = (props: SmartButtonProps) => {
    const { deactivate, activate, connector } = useWeb3React<Web3Provider>();
    const [isPending, setIsPending] = useState(false);
    const [loadingText, setLoadingText] = useState(props.loadingText || props?.children);
    const { onSuccess, onFail, onPending, refreshOnSuccess, ...btnProps } = props;

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
            // when pending disable btn and show loader in btn
            setIsPending(true);

            try {
                const promiseResult = await returnedValueFromClick;
                // it's a TransactionResponse => handle tx status
                if (promiseResult?.hash) {
                    const handleSuccess = (tx: TransactionResponse) => {
                        if(onSuccess) { onSuccess(tx) }
                        if(refreshOnSuccess) { forceQuickAccountRefresh(connector, deactivate, activate) }
                    }
                    await handleTx(promiseResult, { onSuccess: handleSuccess, onFail, onPending });
                }
            } catch (e) {
                showFailNotif(e)
            }

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