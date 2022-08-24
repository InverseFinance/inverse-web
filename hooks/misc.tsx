import { Web3Provider } from '@ethersproject/providers';
import { useWeb3React } from '@web3-react/core';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

// Hook
export function useOnScreen(ref, rootMargin = "0px") {
    // State and setter for storing whether element is visible
    const [isIntersecting, setIntersecting] = useState(false);
    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                // Update our state when observer callback fires
                setIntersecting(entry.isIntersecting);
            },
            {
                rootMargin,
            }
        );
        if (ref?.current) {
            observer?.observe(ref.current);
        }
        return () => {
            if (ref?.current) {
                observer?.unobserve(ref.current);
            }
        };
    }, []); // Empty array ensures that effect is only run on mount and unmount
    return isIntersecting;
}

export const useAccount = (ad?: string) => {
    const { account } = useWeb3React<Web3Provider>();
    const { query } = useRouter();
    const viewAs = (query?.viewAddress as string);
    return  ad || viewAs ||  account;
}

