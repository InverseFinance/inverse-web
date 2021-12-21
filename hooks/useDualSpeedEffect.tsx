import { useCallback } from "react";
import { useDebouncedEffect } from './useDebouncedEffect';

/**  
 * An effect hook that can react at two different speed depending on a condition
 * Mostly used to avoid some visual "flashing effect"
 *  **/
export const useDualSpeedEffect = (effect: () => void, deps: any[], isSlowCase = false, slowDelay = 300, fastDelay = 0) => {
    const callback = useCallback(effect, deps);

    useDebouncedEffect(() => {
        if(!isSlowCase) { return }
        callback()
    }, [callback, isSlowCase], slowDelay);

    useDebouncedEffect(() => {
        if(isSlowCase) { return }
        callback()
    }, [callback, isSlowCase], fastDelay);
};