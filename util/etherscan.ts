import { fetcher } from './web3'

const baseUrl = 'https://api.etherscan.io/v2/api'

const ABI_PROXYS: { [key:string]: string} = {
    // comptroller
    '0x4dCf7407AE5C07f8681e1659f626E114A7667339' : '0x48c5e896d241Afd1Aee73ae19259A2e234256A85'
}

export const getRemoteAbi = async (address: string, chainId = 1) => {
    const addressOrProxyAddress = ABI_PROXYS[address] || address;
    const path = `?chainid=${chainId}&module=contract&action=getabi&address=${addressOrProxyAddress}&apikey=DTIA41KB2WXUKK8DY8H59YJFIQD246SH4V`
    const res = await fetcher(`${baseUrl}${path}`);
    return res?.status === "1" ? res?.result : '[]'
}

export const getGasPrice = async (chainId = 1) => {
    const path = `?chainid=${chainId}&module=gastracker&action=gasoracle&apikey=DTIA41KB2WXUKK8DY8H59YJFIQD246SH4V`
    const res = await fetcher(`${baseUrl}${path}`);
    return res?.status === "1" ? res?.result : '{"result":{"SafeGasPrice":"0","ProposeGasPrice":"0","FastGasPrice":"0"}}'
}

export const getTransactions = async (address: string, startBlock = 0, chainId = 1) => {
    const path = `?chainid=${chainId}&module=account&action=txlist&address=${address}&startblock=${startBlock}&endblock=99999999&sort=desc&apikey=DTIA41KB2WXUKK8DY8H59YJFIQD246SH4V`
    const res = await fetcher(`${baseUrl}${path}`);
    return res?.status === "1" ? res?.result : [];
}