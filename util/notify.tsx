import { UseToastOptions, createStandaloneToast } from '@chakra-ui/react'
import { ToastId } from '@chakra-ui/react';
import theme from '@inverse/theme';

const toast = createStandaloneToast({ theme })

const toastRefs: { [key: string]: ToastId } = {}

const defaults: Partial<UseToastOptions> = {
    position: 'bottom-right',
    isClosable: true,
}

export const showToast = (options: UseToastOptions) => {
    const toastId = options.id || 'current';
    const mergedOptions = { id: toastId, ...defaults, ...options };

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
    // error code when user does not confirm tx
    if (e?.code === 4001) {
        showToast({
            title: 'Transaction canceled',
            status: 'warning',
            description: msg || undefined,
        })
    } else {
        showToast({
            title: `${isFromTx ? 'Transaction prevented' : 'Action failed'}`,
            status: 'warning',
            description: msg || undefined,
        })
    }
}