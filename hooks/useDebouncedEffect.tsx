import { useCallback, useEffect, useRef, type DependencyList } from "react";

export const useDebouncedEffect = (
  effect: () => void | (() => void),
  deps: DependencyList,
  delay = 300
) => {
  const cleanupRef = useRef<(() => void) | void>();
  const callback = useCallback(effect, deps);

  useEffect(() => {
    const handler = setTimeout(() => {
      // Run the effect after the delay and store its cleanup (if any)
      cleanupRef.current = callback();
    }, delay);

    return () => {
      clearTimeout(handler);
      // If the last run of the effect returned a cleanup, call it
      if (typeof cleanupRef.current === "function") {
        cleanupRef.current();
        cleanupRef.current = undefined;
      }
    };
  }, [callback, delay]);
};
