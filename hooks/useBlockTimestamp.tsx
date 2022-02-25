import useEtherSWR from './useEtherSWR';

export const useBlockTimestamp = (blockNumber: number) => {
    const { data } = useEtherSWR(
        ['getBlock', blockNumber]
    )

    return {
        timestamp: (data?.timestamp * 1000) || 0,
    }
}