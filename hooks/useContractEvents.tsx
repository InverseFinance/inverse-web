import { Contract, Event } from 'ethers';
import useSWR from 'swr';
import { useWeb3React } from '@web3-react/core';
import { Web3Provider } from '@ethersproject/providers';

export const useContractEvents = (address: string, abi: string[], method: string, args: any[] = []): { events: Event[] } => {
    const { account, library } = useWeb3React<Web3Provider>();

    const { data } = useSWR(`contract-event-${address}-${method}-${account}`, async () => {
        const contract = new Contract(address, abi, library?.getSigner());
        return await contract.queryFilter(contract.filters[method](...args));
    });

    return {
        events: data || [],
    }
}