// @ts-nocheck
// TODO: Refactor this entire mess
import { isAddress } from '@ethersproject/address'
import { Web3Provider } from '@ethersproject/providers'
import { getAbis } from '@app/config/abis'
import etherJsFetcher from '@app/util/fetcher'
import { useWeb3React } from '@web3-react/core'
import { Contract } from 'ethers'
import { useEffect } from 'react'
import useSWR, { cache, mutate } from 'swr'

export { cache } from 'swr'
export type etherKeyFuncInterface = () => ethKeyInterface | ethKeysInterface
export type ethKeyInterface = [string, any?, any?, any?, any?]
export type ethKeysInterface = string[][]

export const contracts = new Map<string, Contract>()
export function getContract(address, abi, signer) {
  let contract = contracts.get(address)
  if (contract) {
    return contract
  }
  contract = new Contract(address, abi, signer)
  contracts.set(address, contract)
  return contract
}

const getArgs = (...args) => args;

// [contractAddres, function, ...parameters] or [[contractAddres, function, ...parameters], etc] or { args: sameAsBefore, abi }
function useEtherSWR(..._args) {
  // if(!_args || !_args?.length || (_args?.length === 1 && !_args[0]?.length)) {
  //   return useSWR(null);
  // }
  const { provider, chainId } = useWeb3React<Web3Provider>()

  const withCustomAbiParam = _args.length > 0 && _args[0].args;
  const args = withCustomAbiParam ? getArgs(_args[0].args) : _args;

  const ABIs = getAbis(chainId);

  if (withCustomAbiParam) {
    if (withCustomAbiParam && _args[0].args[0] && _args[0].args[0].length > 0) {
      _args[0].args.forEach((a, i) => {
        if (!_args[0].args[i]) {
          // nada
        } else if (Array.isArray(_args[0].args[i][0])) {
          ABIs.set(_args[0].args[i][0][0], _args[0].abi);
        } else {
          ABIs.set(_args[0].args[i][0], _args[0].abi);
        }
      })
    }
  }

  let _key: ethKeyInterface
  let fn: any
  let config = { subscribe: [] }
  let isMulticall = false
  if (args.length >= 1) {
    _key = args[0]
    isMulticall = Array.isArray(_key[0])
  }
  if (args.length > 2) {
    fn = args[1]
    config = args[2]
  } else {
    if (typeof args[1] === 'function') {
      fn = args[1]
    } else if (typeof args[1] === 'object') {
      config = args[1]
    }
  }

  if (fn === undefined) {
    fn = etherJsFetcher(provider, provider?.getSigner(), ABIs)
  }

  const [target] = isMulticall ? [_key[0][0]] : _key

  const serializedKey = isMulticall ? JSON.stringify(_key) : cache.serializeKey(_key)[0]

  useEffect(() => {
    if (!provider || !config.subscribe || isAddress(target) || Array.isArray(target)) {
      return () => ({})
    }

    const subscribers = Array.isArray(config.subscribe) ? config.subscribe : [config.subscribe]

    subscribers.forEach((subscribe) => {
      let filter
      const joinKey = serializedKey
      if (typeof subscribe === 'string') {
        filter = subscribe
        provider.on(filter, () => {
          mutate(joinKey, undefined, true)
        })
      } else if (typeof subscribe === 'object' && !Array.isArray(subscribe)) {
        const { name, on } = subscribe
        filter = name
        provider.on(filter, (...args) => {
          if (on) {
            on(cache.get(joinKey), ...args)
          } else {
            mutate(joinKey, undefined, true)
          }
        })
      }
    })

    return () => {
      subscribers.forEach((filter) => {
        provider.removeAllListeners(filter)
      })
    }
  }, [serializedKey, target])

  useEffect(() => {
    if (!provider || !provider.getSigner() || !config.subscribe || !isAddress(target)) {
      return () => ({})
    }

    const abi = ABIs.get(target)

    const contract = getContract(target, abi, provider.getSigner())

    const subscribers = Array.isArray(config.subscribe) ? config.subscribe : [config.subscribe]

    subscribers.forEach((subscribe) => {
      let filter
      if (typeof subscribe === 'string') {
        filter = contract.filters[subscribe]()
        contract.on(filter, (value) => {
          mutate(serializedKey, undefined, true)
        })
      } else if (typeof subscribe === 'object' && !Array.isArray(subscribe)) {
        const { name, topics, on } = subscribe
        const args = topics || []
        filter = contract.filters[name](...args)
        contract.on(filter, (...args) => {
          if (on) {
            on(cache.get(serializedKey), ...args)
          } else {
            mutate(_key, undefined, true)
          }
        })
      }
    })

    return () => {
      subscribers.forEach((filter) => {
        contract.removeAllListeners(filter)
      })
      contracts.delete(target)
    }
  }, [serializedKey, target])

  if (!provider) {
    return useSWR(null)
  }

  return useSWR(isMulticall ? serializedKey : _key, fn, config)
}

export default useEtherSWR
