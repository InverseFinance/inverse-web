import { estimateBlockTimestamp, estimateBlocksTimestamps } from '@app/util/misc';
import useEtherSWR from './useEtherSWR';

export const useBlockTimestamp = (blockNumber: number): { timestamp: number, isUsingEstimate: boolean } => {
    const { data } = useEtherSWR(
        ['getBlock', blockNumber]
    );
    const { data: currentBlock } = useEtherSWR(
        ['getBlock', 'latest']
    );
    const estimatedTimestamp = estimateBlockTimestamp(blockNumber, currentBlock?.timestamp * 1000, currentBlock?.number);

    return {
        timestamp: (data?.timestamp * 1000) || estimatedTimestamp || 0,
        isUsingEstimate: !data,
    }
}

export const useBlocksTimestamps = (blockNumbers: number[]): { timestamps: number[], isUsingEstimate: boolean } => {
    const { data } = useEtherSWR(
        blockNumbers.map(n => ['getBlock', n])
    );
    const { data: currentBlock } = useEtherSWR(
        ['getBlock', 'latest']
    );
    const estimatedTimestamps = estimateBlocksTimestamps(blockNumbers, currentBlock?.timestamp * 1000, currentBlock?.number);
    return {
        timestamps: (data?.map(d => d.timestamp * 1000)) || estimatedTimestamps || blockNumbers.map(n => 0),
        isUsingEstimate: !data,
    }
}