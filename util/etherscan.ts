import { fetcher } from './web3'

const baseUrl = 'https://api.etherscan.io/api'

export const getRemoteAbi = async (address: string) => {
    const path = `?module=contract&action=getabi&address=${address}&apikey=A6SD2E7KYV3F7HR2KY88TH7A4H89JCFNNS`
    const res = await fetcher(`${baseUrl}${path}`);
    return res?.status === "1" ? res?.result : '[]'
}