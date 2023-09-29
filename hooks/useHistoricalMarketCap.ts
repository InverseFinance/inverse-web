import { useCustomSWR } from "./useCustomSWR";

export const useHistoricalInvMarketCap = (cgId: string) => {
    const { data, error } = useCustomSWR(`/api/inv/circulating-supply-evolution`);
  
    return {
      ev: data?.prices || [],
      isLoading: !error && !data,
      isError: !!error,
    }
  }