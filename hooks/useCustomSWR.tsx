import { SWR } from '@app/types'
import { fetcher as defaultFetcher } from '@app/util/web3'
import useSWR from 'swr'
import useStorage from '@app/hooks/useStorage';
import { useEffect } from 'react';

export const useCustomSWR = (key: string, fetcher = defaultFetcher): SWR & { data: any, error: any } => {
  const { value, setter } = useStorage(key);
  const { data, error } = useSWR(key, fetcher);

  useEffect(() => {
    if(typeof data !== 'undefined') {
      setter(data);
    }
  }, [data]);

  return {
    data: data || value,
    isLoading: !error && !data,
    isError: error,
    error,
  }
}