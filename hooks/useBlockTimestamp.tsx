import useEtherSWR from './useEtherSWR';

export const useBlockTimestamp = (blockNumber: number) => {
    const { data } = useEtherSWR(
        ['getBlock', blockNumber]
    )

    return {
        timestamp: (data?.timestamp * 1000) || 0,
    }
}

export const useBlocksTimestamps = (blockNumbers: number[]): { timestamps: number[] } => {
    const { data } = useEtherSWR(
        blockNumbers.map(n => ['getBlock', n])
    )

    return {
        timestamps: (data?.map(d => d.timestamp * 1000)) || blockNumbers.map(n => 0),
    }
}