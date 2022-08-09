import { Contract, Event } from 'ethers';
import useSWR from 'swr';
import { useWeb3React } from '@web3-react/core';
import { Web3Provider } from '@ethersproject/providers';

export const useContractEvents = (address: string, abi: string[], method: string, args: any[] = [], ignoreIfArgsUndefined = false, swrKey = ''): { events: Event[], isLoading: boolean, error: any } => {
    const { account, library } = useWeb3React<Web3Provider>();

    const _swrKey = swrKey || `contract-event-${address}-${method}-${account}`;

    const { data, error } = useSWR(_swrKey, async () => {
        if(ignoreIfArgsUndefined && args?.length && args.filter(arg => arg !== undefined).length === 0) {
            return [];
        }
        const contract = new Contract(address, abi, library?.getSigner());
        return await contract.queryFilter(contract.filters[method](...args));
    });

    return {
        events: data || [],
        isLoading: !data,
        error,
    }
}