import { SWR } from "@app/types"
import { useCustomSWR } from "./useCustomSWR"
import { fetcher } from "@app/util/web3"

export const useRepayments = (): SWR => {
    const { data, error } = useCustomSWR(`/api/transparency/repayments?v5`, fetcher);    
    return {
      data: data || {},
      isLoading: !error && !data,
      isError: error,
    }
  }