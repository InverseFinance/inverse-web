import { ExternalProvider, JsonRpcFetchFunc, Web3Provider } from '@ethersproject/providers'
import { BLOCK_SCAN } from '@inverse/config/constants'
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

export const setPreviousChainId = (chainId: number | string): void => {
  if (typeof window === undefined) { return }
  try {
    window.localStorage.setItem('signerChainId', chainId.toString())
  } catch (e) {
    window.localStorage.clear();
    window.localStorage.setItem('signerChainId', chainId.toString());
  }
}

export const switchWalletNetwork = async (id: string | number, onSuccess?: () => void) => {
  const hexaChainId = hexValue(Number(id));
  try {
    await window?.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: hexaChainId }],
    });
    if (onSuccess) { onSuccess() }
  } catch (switchError: any) {
    console.log(switchError);
  }
}

// window.ethereum is injected by providers even if the user is not connected to our app
export const ethereumReady = async (timeout = 10000): Promise<boolean> => {
  const polling = 50;

  return new Promise((resolve) => {
    const checkReady = (nbAttempts: number) => {
      setTimeout(() => {
        if (window?.ethereum?.networkVersion) {
          resolve(true)
        } else if(nbAttempts * polling <= timeout) {
          checkReady(nbAttempts + 1);
        } else {
          resolve(false);
        }
      }, polling);
    }

    if (window?.ethereum?.networkVersion) {
      resolve(true);
    } else {
      checkReady(0);
    }
  });
}

export const getScanner = (id: string | number): string => id ? (getNetwork(id)?.scan || BLOCK_SCAN) : BLOCK_SCAN;
