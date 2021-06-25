// @ts-nocheck
// TODO: clean up this mess
import { isAddress } from '@ethersproject/address'
import { JsonRpcSigner, Provider, Web3Provider } from '@ethersproject/providers'
import { Contract, Wallet } from 'ethers'

export const etherJsFetcher = (
  provider: Provider | Web3Provider,
  signer: Wallet | JsonRpcSigner,
  ABIs?: Map<string, any>
) => (...args) => {
  let parsed
  try {
    parsed = JSON.parse(args[0])
  } catch (e) {}
  const [arg1] = parsed || args

  const execute = (parameters: string[]): Promise<any> => {
    const [param1, param2, ...otherParams] = parameters
    if (isAddress(param1)) {
      const address = param1
      const method = param2
      const abi = ABIs.get(address)
      const contract = new Contract(address, abi, signer)
      return contract[method](...otherParams)
    }
    const method = param1

    if (['getBalance', 'getTransactionCount'].includes(method) && !isAddress(param2)) {
      const address = signer instanceof Wallet ? signer.address : signer._address
      return provider[method](address, param2, ...otherParams)
    }

    return provider[method](param2, ...otherParams)
  }

  if (Array.isArray(arg1)) {
    const calls: string[][] = parsed
    return Promise.all(
      calls.map((call) => {
        return execute(call)
      })
    )
  }
  return execute(args)
}

export default etherJsFetcher
