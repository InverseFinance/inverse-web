import { fetcher } from './web3'

const baseUrl = 'https://api.etherscan.io/api'

const ABI_PROXYS: { [key:string]: string} = {
    // comptroller
    '0x4dCf7407AE5C07f8681e1659f626E114A7667339' : '0x48c5e896d241Afd1Aee73ae19259A2e234256A85'
}

export const getRemoteAbi = async (address: string) => {
    const addressOrProxyAddress = ABI_PROXYS[address] || address;
    const path = `?module=contract&action=getabi&address=${addressOrProxyAddress}&apikey=A6SD2E7KYV3F7HR2KY88TH7A4H89JCFNNS`
    const res = await fetcher(`${baseUrl}${path}`);
    return res?.status === "1" ? res?.result : '[]'
}

export const getGasPrice = async () => {
    const path = `?module=gastracker&action=gasoracle&apikey=A6SD2E7KYV3F7HR2KY88TH7A4H89JCFNNS`
    const res = await fetcher(`${baseUrl}${path}`);
    return res?.status === "1" ? res?.result : '{"result":{"SafeGasPrice":"0","ProposeGasPrice":"0","FastGasPrice":"0"}}'
}

export const getTransactions = async (address: string, startBlock = 0) => {
    const path = `?module=account&action=txlist&address=${address}&startblock=${startBlock}&endblock=99999999&sort=desc&apikey=A6SD2E7KYV3F7HR2KY88TH7A4H89JCFNNS`
    const res = await fetcher(`${baseUrl}${path}`);
    return res?.status === "1" ? res?.result : [];
}