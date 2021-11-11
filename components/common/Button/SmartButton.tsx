import { useEffect, useState } from 'react';
import { Button, ButtonProps } from '@chakra-ui/react'
import { showFailNotif } from '@inverse/util/notify';
import { handleTx } from '@inverse/util/transactions';

/**
 * "Smart" Button :
 * If the onClick function returns a Promise, we show a loader in the btn and disable the btn while the Promise is pending
 * If it's transaction Promise, we use handleTx to deal with the transaction status and notify the user
 * If there's an error there will be a notification (transaction case or not)
 *  **/
export const SmartButton = (props: ButtonProps) => {
    const [isPending, setIsPending] = useState(false);
    const [loadingText, setLoadingText] = useState(props.loadingText || props?.children);

    useEffect(() => {
        setLoadingText(props.loadingText || props?.children);
    }, [props.loadingText, props.children]);

    // wraps the onClick function given to handle promises/transactions automatically
    const handleClick = async (e: any) => {
        if (!props.onClick) { return }

        const returnedValueFromClick: any = props.onClick(e);
        if (!returnedValueFromClick) { return }

        // click returns a Promise
        if (returnedValueFromClick?.then) {
            // when pending disable btn and show loader in btn
            setIsPending(true);

            try {
                const promiseResult = await returnedValueFromClick;
                // it's a TransactionResponse => handle tx status
                if (promiseResult?.hash) {
                    await handleTx(promiseResult);
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
            {...props}
            // keep after {...props} :
            disabled={props.disabled || props.isDisabled || isPending}
            onClick={handleClick}
            isLoading={props.isLoading || isPending}
        />
    )
}