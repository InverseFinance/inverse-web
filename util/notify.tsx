import { UseToastOptions, createStandaloneToast } from '@chakra-ui/react'
import { ToastId } from '@chakra-ui/react';

const toast = createStandaloneToast()

const toastRefs: { [key: string]: ToastId } = {}

const defaults: Partial<UseToastOptions> = {
    position: 'bottom-right',
    isClosable: true,
}

export const showToast = (options: UseToastOptions) => {
    const toastId = options.id || 'current';
    const mergedOptions = { id: toastId, ...defaults, ...options };

    if (toast.isActive(toastId)) {
        toast.update(toastRefs[toastId], options);
    } else {
        toastRefs[toastId] = toast(mergedOptions)!;
    }
    
    return toastRefs[toastId];
}