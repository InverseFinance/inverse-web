import { useCustomSWR } from "./useCustomSWR";

export const useHistoricalInvMarketCap = () => {
    const { data, error } = useCustomSWR(`/api/inv/circulating-supply-evolution?v1`);
  
    return {
      evolution: (data?.evolution||[]).map((v, i) => ({ circSupply: v, timestamp: data?.timestampsSec[i] * 1000 })),
      isLoading: !error && !data,
      isError: !!error,
    }
  }