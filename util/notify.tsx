import { UseToastOptions, createStandaloneToast } from '@chakra-ui/react'
import { ToastId } from '@chakra-ui/react';
import { Notification } from '@app/components/common/Notification';
import { CustomToastOptions } from '@app/types';
import { capitalize } from './misc';

const { toast } = createStandaloneToast({})
let toastCounter = 0;

const toastRefs: { [key: string]: ToastId } = {}

const defaults: Partial<UseToastOptions> = {
    position: 'bottom-right',
    isClosable: true,
}

export const showToast = (options: CustomToastOptions) => {
    const toastId = options.id || `custom-toast-${toastCounter++}`;
    const { status, title, description, isClosable, ...toastOptions } = options;
    const handleClose = () => toast.close(toastId);

    const render = () => <Notification
        handleClose={handleClose}
        status={status}
        title={title}
        description={description}
        isClosable={isClosable} />;

    const mergedOptions: UseToastOptions = { id: toastId, ...defaults, render, ...toastOptions };

    if (toast.isActive(toastId)) {
        toast.update(toastRefs[toastId], mergedOptions);
    } else {
        toastRefs[toastId] = toast(mergedOptions)!;
    }

    return toastRefs[toastId];
}

export const showFailNotif = (_e: any, isFromTx?: boolean) => {    
    console.log('showFailNotif: ', _e);    
    const e = typeof _e === 'string' ? { reason: _e } : _e;
    const isClearReason = !!e?.reason && e?.reason?.indexOf('cannot estimate gas') === -1;
    const msg = ((isClearReason ? e?.reason : undefined) || e?.error?.message || e?.data?.message || e?.message || '').substring(0, 200);
    // error codes relatable to transaction cancellation by user
    const revertMsg = "reverted with reason string ";
    const reasonStringIdx = msg.indexOf(revertMsg);

    if ([-32603, 4001].includes(e?.code)) {
        showToast({
            title: 'Transaction canceled',
            status: 'warning',
            description: reasonStringIdx === -1 ? 'User canceled transaction in wallet' : capitalize(msg.substring(reasonStringIdx)),
        })
    } else {
        const revertMsg = "reverted with reason string ";
        const reasonStringIdx = !e?.data?.message ? -1 : e?.data?.message.indexOf(revertMsg);
        showToast({
            title: `${isFromTx ? 'Transaction prevented' : 'Action failed'}`,
            status: 'warning',
            description: reasonStringIdx === -1 ? (msg || undefined) : capitalize(msg.substring(reasonStringIdx)),
        })
    }
}

export const closeToast = (id: string) => {
    try {
        toast.close(id);
    } catch (e) {
        console.log('Error closing toast: ', e);
    }    
}