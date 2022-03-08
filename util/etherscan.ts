import { fetcher } from './web3'

const baseUrl = 'https://api.etherscan.io/api'

const ABI_PROXYS: { [key:string]: string} = {
    // comptroller
    '0x4dCf7407AE5C07f8681e1659f626E114A7667339' : '0x731b65a993c7A4fF10D304D5204AfC51033cda4c'
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