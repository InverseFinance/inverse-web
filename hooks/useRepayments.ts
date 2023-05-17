import { SWR } from "@app/types"
import { useCacheFirstSWR } from "./useCustomSWR"
import { fetcher, fetcher60sectimeout } from "@app/util/web3"

export const useRepayments = (): SWR => {
  const { data, error } = useCacheFirstSWR(`/api/transparency/repayments?v6`, fetcher, fetcher60sectimeout);
  return {
    data: data || {},
    isLoading: !error && !data,
    isError: error,
  }
}