import { SWR } from '@app/types'
import { fetcher as defaultFetcher, fetcher30sectimeout } from '@app/util/web3'
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

export const useCacheFirstSWR = (key: string, cacheFetcher = defaultFetcher, fetcher = fetcher30sectimeout): SWR & { data: any, error: any } => {
  const { value: localCacheData, setter } = useStorage(key);
  const keyCacheFirst = key.indexOf('?') === -1 ? `${key}?cacheFirst=true` : `${key}&cacheFirst=true`
  const { data: apiCacheData } = useSWR(keyCacheFirst, cacheFetcher);
  const { data, error } = useSWR(key, fetcher30sectimeout);

  useEffect(() => {
    if(typeof data !== 'undefined') {
      setter(data);
    }
  }, [data]);

  const _data = data || apiCacheData || localCacheData;

  return {
    data: _data,
    isLoading: !error && !_data,
    isError: error,
    error,
  }
}