import { useCallback, useEffect } from "react";

export const useDebouncedEffect = (effect: () => void, deps: any[], delay = 300) => {
    const callback = useCallback(effect, deps);

    useEffect(() => {
        const handler = setTimeout(() => {
            callback();
        }, delay);

        return () => {
            clearTimeout(handler);
        };
    }, [callback, delay]);
};