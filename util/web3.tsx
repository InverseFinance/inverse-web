import { ExternalProvider, JsonRpcFetchFunc, JsonRpcSigner, Web3Provider } from '@ethersproject/providers'
import { BLOCK_SCAN } from '@app/config/constants'
import { getNetwork } from '@app/util/networks'

import { hexValue, formatUnits, parseUnits, Interface } from 'ethers/lib/utils'
import { BigNumber, Contract } from 'ethers';
import localforage from 'localforage';
import { BigNumberList, Token } from '@app/types'
import { getNewContract } from './contracts'
import { ERC20_ABI } from '@app/config/abis'
import { coinbaseWallet, metamaskInjector, walletConnectV2 } from '@app/variables/connectors'
import { getBnToNumber } from './markets'
import { roundFloorString } from './misc'
import { MetaMask } from '@web3-react/metamask';
import { WalletConnect } from '@web3-react/walletconnect-v2';
import { CoinbaseWallet } from '@web3-react/coinbase-wallet';

export const getLibrary = (provider: ExternalProvider | JsonRpcFetchFunc): Web3Provider => {
  const library = new Web3Provider(provider)
  library.pollingInterval = 12000
  return library
}

export async function fetchWithTimeout(input: RequestInfo, options: RequestInit = {}, timeout = 6000): Promise<Response> {
  return new Promise(async (resolve, reject) => {
    const controller = new AbortController();

    const id = setTimeout(async () => {
      controller.abort();
      if (typeof input === 'string') {
        const cachedResults: any = await localforage.getItem(input).catch(() => undefined);
        if (cachedResults) {
          console.log('Timed out, returning last cached data for', input);
          resolve(new Response(JSON.stringify(cachedResults), { status: 200, headers: { "Content-Type": "application/json" } }))
        }
      }
      reject('Timeout and no cache found');
    }, timeout);

    const response = await fetch(input, {
      ...options,
      signal: controller.signal
    });

    clearTimeout(id);

    resolve(response);
  });
}

function isServer() {
  return !(typeof window != 'undefined' && window.document);
}

export const fetcher60sectimeout = (input: RequestInfo, init?: RequestInit) => fetcher(input, init, 60000);
export const fetcher30sectimeout = (input: RequestInfo, init?: RequestInit) => fetcher(input, init, 30000);
export const fetcherWithFallback = (input: RequestInfo, fallbackUrl: string) => fetcher(input, undefined, 60000, fallbackUrl);

export const fetcher = async (input: RequestInfo, init?: RequestInit, timeout = 6000, fallbackUrl?: string) => {
  if (typeof input === 'string' && input.startsWith('-')) {
    return {};
  }
  const res = await fetchWithTimeout(input, init, timeout);

  if (!res?.ok) {
    // if api call fails, return cached results in browser
    if (!!fallbackUrl) {
      return fetcher(fallbackUrl, init, timeout);
    } else if (!isServer() && typeof input === 'string') {
      const cachedResults = await localforage.getItem(input).catch(() => undefined);
      if (cachedResults) {
        return cachedResults;
      }
    }

    const error = new Error('An error occurred while fetching the data.')

    // @ts-ignore
    error.info = await res.json()

    // @ts-ignore
    error.status = res.status

    throw error
  }

  const data = res.json();

  if (!isServer && typeof input === 'string') {
    await localforage.setItem(input, data).catch();
  }

  return data;
}

export const isPreviouslyConnected = (): boolean => {
  if (typeof window === undefined) { return false }
  return JSON.parse(window.localStorage.getItem('previouslyConnected') || 'false');
}

export const getPreviousConnectorType = () => {
  if (typeof window === undefined) { return false }
  return window.localStorage.getItem('previousConnectorType') || '';
}

export const setIsPreviouslyConnected = (value: boolean, connectorType = 'injected'): void => {
  if (typeof window === undefined) { return }
  if (!value) { window.localStorage.clear(); }
  window.localStorage.setItem('previousConnectorType', connectorType);
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

export const importToken = async ({
  address,
  symbol,
  decimals,
  image,
}: {
  address: string,
  symbol: string,
  decimals: number,
  image: string,
}) => {
  try {
    if (!ethereum) { return }
    // wasAdded is a boolean. Like any RPC method, an error may be thrown.
    await ethereum.request({
      method: 'wallet_watchAsset',
      params: {
        type: 'ERC20',
        options: {
          address,
          symbol,
          decimals,
          image,
        },
      },
    });
  } catch (error) {
    console.log(error);
  }
}

// window.ethereum is injected by providers even if the user is not connected to our app
export const ethereumReady = async (timeout = 10000): Promise<boolean> => {
  const polling = 50;

  return new Promise((resolve) => {
    const checkReady = (nbAttempts: number) => {
      setTimeout(() => {
        if (window?.ethereum?.chainId) {
          resolve(true)
        } else if (nbAttempts * polling <= timeout) {
          checkReady(nbAttempts + 1);
        } else {
          resolve(false);
        }
      }, polling);
    }

    if (window?.ethereum?.chainId) {
      resolve(true);
    } else {
      checkReady(0);
    }
  });
}

export const getScanner = (id: string | number): string => id ? (getNetwork(id)?.scan || BLOCK_SCAN) : BLOCK_SCAN;

export const formatBalance = (balance: BigNumber, decimals: number, symbol = '') => {
  const floatBalance = balance ? parseFloat(formatUnits(balance, decimals)) : 0;
  const precision = balance?.gt(0) ? 10 : 2;

  return `${floatBalance.toFixed(precision)} ${symbol}`.trim();
}

export const hasAllowance = (approvals: BigNumberList, address: string, decimals = 18, amount?: string): boolean => {
  const allowanceValue = approvals && approvals[address] ? getBnToNumber(approvals[address], decimals) : 0;
  if (!amount) {
    return !!allowanceValue
  }
  const _amount = (amount || '')?.toString()?.startsWith('.') ? `0${amount}` : amount;
  const value = getBnToNumber(parseUnits((roundFloorString(_amount, decimals) || '0'), decimals), decimals);
  return allowanceValue >= value;
}

export const getTokenBalance = async (token: Token, signer: JsonRpcSigner) => {
  const contract = getNewContract(token.address, ERC20_ABI, signer);
  return await contract.balanceOf(await signer.getAddress())
}

export const getParsedTokenBalance = async (token: Token, signer: JsonRpcSigner) => {
  const bnBalance = await getTokenBalance(token, signer);
  return parseFloat(formatUnits(bnBalance, token.decimals));
}

export const getConnectorFromInstance = (connector: undefined) => {
  if (connector instanceof MetaMask) {
    return metamaskInjector;
  } else if (connector instanceof WalletConnect) {
    return walletConnectV2;
  } else if (connector instanceof CoinbaseWallet) {
    return coinbaseWallet;
  }
  return null;
}

export const forceQuickAccountRefresh = (
  connector: undefined,
  onActivateError?: () => void,
) => {
  const supportedConnector = getConnectorFromInstance(connector);
  if (supportedConnector === null) { return }
  const { deactivate: _deactivate } = supportedConnector || { activate: () => { }, deactivate: () => { } };
  const deactivate = _deactivate || supportedConnector?.actions?.resetState || (() => 0);
  try {
    deactivate();
  } catch (e) {
    console.warn(e)
  }
}

export const getAllowanceOf = async (provider: JsonRpcSigner | Web3Provider, token: string, account: string, spender: string) => {
  const contract = new Contract(token, ERC20_ABI, provider);
  return contract.allowance(account, spender);
}

export const genTransactionParams = (
  to: string,
  func: string,
  args: any[],
  value = '0',
) => {  
  const contractInterface = new Interface([func]);
  let fd = Object.values(contractInterface.functions)[0];  
  return { to, data: contractInterface.encodeFunctionData(fd, args), value }
}