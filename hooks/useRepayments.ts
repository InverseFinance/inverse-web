import { SWR } from "@app/types"
import { useCacheFirstSWR } from "./useCustomSWR"
import { fetcher60sectimeout } from "@app/util/web3"

export const useRepayments = (): SWR & { data: any, isLoading: boolean, isError: boolean } => {
  const { data, error } = useCacheFirstSWR(`/api/transparency/repayments-v2?v=3`, fetcher60sectimeout);
  const _data = data || {};
  _data['totalDolaIncludingIOURepaidByDAO'] = (_data['totalDolaRepaidByDAO']||[]).concat((_data['dolaForIOUsRepaidByDAO']||[]))
  return {
    data: _data,
    isLoading: !error && !data,
    isError: error,
  }
}