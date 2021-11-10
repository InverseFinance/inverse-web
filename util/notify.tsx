import { UseToastOptions, createStandaloneToast } from '@chakra-ui/react'
import { ToastId } from '@chakra-ui/react';
import { Notification } from '@inverse/components/common/Notification';
import theme from '@inverse/theme';
import { CustomToastOptions } from '@inverse/types';

const toast = createStandaloneToast({ theme })
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

export const showFailNotif = (e: any, isFromTx?: boolean) => {
    console.log(e);
    const msg = (e?.error?.message || e?.data?.message || e.reason || e.message || '').substring(0, 200);
    // error codes relatable to transaction cancellation by user
    if ([-32603, 4001].includes(e?.code)) {
        showToast({
            title: 'Transaction canceled',
            status: 'warning',
            description: 'User canceled transaction in wallet',
        })
    } else {
        showToast({
            title: `${isFromTx ? 'Transaction prevented' : 'Action failed'}`,
            status: 'warning',
            description: msg || undefined,
        })
    }
}