import { Contract, Event } from 'ethers';
import useSWR from 'swr';
import { useWeb3React } from '@app/util/wallet';
import { Web3Provider } from '@ethersproject/providers';

type Props = {
    address: string, abi: string[], method: string, args?: any[], ignoreIfArgsUndefined?: boolean, swrKey?: string
}

type MultiContractEvents = { groupedEvents: Event[][], isLoading?: boolean, error?: any };

export const useContractEvents = (address: string, abi: string[], method: string, args: any[] = [], ignoreIfArgsUndefined = false, swrKey = ''): ContractEvents => {
    const { account, provider } = useWeb3React<Web3Provider>();

    const _swrKey = swrKey || `contract-event-${address}-${method}-${account}`;

    const { data, error } = useSWR(_swrKey, async () => {
        if(ignoreIfArgsUndefined && args?.length && args.filter(arg => arg !== undefined).length === 0) {
            return [];
        }
        const contract = new Contract(address, abi, provider?.getSigner());
        return await contract.queryFilter(contract.filters[method](...args));
    });

    return {
        events: data || [],
        isLoading: !data && !error,
        error,
    }
}

export const useMultiContractEvents = (params: any[], swrKey: string, from?: number, to?: number | 'latest'): MultiContractEvents => {
    const { account, provider } = useWeb3React<Web3Provider>();
    const { data, error } = useSWR(`${swrKey}--${account}`, async () => {
        return await Promise.allSettled(
            params.map(p => {
                const [address, abi, method, args, ignoreIfArgsUndefined] = p;
                if(ignoreIfArgsUndefined && args?.length && args.filter(arg => arg !== undefined).length === 0) {
                    return [];
                }
                const contract = new Contract(address, abi, provider?.getSigner());
                return contract.queryFilter(contract.filters[method](...args), from, to);
            })
        )
    });

    return {
        groupedEvents: data?.map(d => d.status === 'fulfilled' ? d.value : []) || params.map(p => []),
        isLoading: !!(!data && !error),
        error,
    }
}