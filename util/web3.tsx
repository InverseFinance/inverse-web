import { ExternalProvider, JsonRpcFetchFunc, Web3Provider } from '@ethersproject/providers'
import { getNetwork } from '@inverse/config/networks'
import { InjectedConnector } from '@web3-react/injected-connector'
import { WalletConnectConnector } from '@web3-react/walletconnect-connector'
import { hexValue } from 'ethers/lib/utils'

export const getLibrary = (provider: ExternalProvider | JsonRpcFetchFunc): Web3Provider => {
  const library = new Web3Provider(provider)
  library.pollingInterval = 12000
  return library
}

export const injectedConnector = new InjectedConnector({
  supportedChainIds: [
    1, // Mainnet
    3, // Ropsten
    4, // Rinkeby
    5, // Goerli
    42, // Kovan
  ],
})

export const walletConnectConnector = new WalletConnectConnector({
  rpc: {
    1: "https://cloudflare-eth.com"
  }
})

export const fetcher = async (input: RequestInfo, init: RequestInit) => {
  const res = await fetch(input, init)

  if (!res.ok) {
    const error = new Error('An error occurred while fetching the data.')

    // @ts-ignore
    error.info = await res.json()

    // @ts-ignore
    error.status = res.status

    throw error
  }

  return res.json()
}

export const isPreviouslyConnected = (): boolean => {
  if (typeof window === undefined) { return false }
  return JSON.parse(window.localStorage.getItem('previouslyConnected') || 'false');
}

export const setIsPreviouslyConnected = (value: boolean): void => {
  if (typeof window === undefined) { return }
  return window.localStorage.setItem('previouslyConnected', JSON.stringify(value));
}

export const switchWalletNetwork = async (id: string | number, onSuccess?: () => void) => {
  const hexaChainId = hexValue(Number(id));
  try {
    await window?.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: hexaChainId }],
    });
    if(onSuccess) { onSuccess() }
  } catch (switchError: any) {
    console.log(switchError);
  }
}