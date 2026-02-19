import { InfuraProvider, JsonRpcProvider, FallbackProvider } from "@ethersproject/providers";
import { NetworkIds } from '@app/types';
import { getRandomFromStringList } from './misc';
import { Contract } from "ethers";
import { AbiCoder } from "ethers/lib/utils";

const ALCHEMY_BASE_URLS = {
    [NetworkIds.optimism]: `https://opt-mainnet.g.alchemy.com/v2`,
    [NetworkIds.base]: `https://base-mainnet.g.alchemy.com/v2`,
    [NetworkIds.arbitrum]: `https://arb-mainnet.g.alchemy.com/v2`,
    [NetworkIds.polygon]: `https://polygon-mainnet.g.alchemy.com/v2`,
    [NetworkIds.avalanche]: `https://avax-mainnet.g.alchemy.com/v2`, 
    [NetworkIds.bsc]: `https://bnb-mainnet.g.alchemy.com/v2`,
    [NetworkIds.mainnet]: `https://eth-mainnet.g.alchemy.com/v2`,
    [NetworkIds.blast]: `https://blast-mainnet.g.alchemy.com/v2`,
    [NetworkIds.mode]: `https://mode-mainnet.g.alchemy.com/v2`,
}

export const getProvider = (chainId: string | number, specificAlchemyKey?: string, onlyAlchemy = false): FallbackProvider | JsonRpcProvider => {
    if (chainId === '31337') {
        return new JsonRpcProvider('http://127.0.0.1:8545/');
    }
    else if (chainId === NetworkIds.ftm && !specificAlchemyKey) {
        return new JsonRpcProvider('https://1rpc.io/ftm');
    }
    // else if (chainId === NetworkIds.optimism && !specificAlchemyKey) {
    //     return new JsonRpcProvider('https://mainnet.optimism.io');
    // }
    // else if (chainId === NetworkIds.bsc && !specificAlchemyKey) {
    //     return new JsonRpcProvider('https://bsc-dataseed3.binance.org');
    // }
    // else if (chainId === NetworkIds.arbitrum && !specificAlchemyKey) {
    //     return new JsonRpcProvider('https://arb1.arbitrum.io/rpc');
    // }
    // else if (chainId === NetworkIds.polygon && !specificAlchemyKey) {
    //     return new JsonRpcProvider('https://polygon-rpc.com');
    // }
    // else if (chainId === NetworkIds.avalanche && !specificAlchemyKey) {
    //     // return new JsonRpcProvider('https://rpc.ankr.com/avalanche');
    //     return new JsonRpcProvider('https://api.avax.network/ext/bc/C/rpc');
    //     // return new JsonRpcProvider('https://avalanche.drpc.org');
    // }
    // else if (chainId === NetworkIds.base && !specificAlchemyKey) {
    //     return new JsonRpcProvider('https://mainnet.base.org');
    // }
    // else if (chainId === NetworkIds.blast && !specificAlchemyKey) {
    //     return new JsonRpcProvider('https://rpc.blast.io');
    // }
    // else if (chainId === NetworkIds.mode && !specificAlchemyKey) {
    //     return new JsonRpcProvider('https://mainnet.mode.network');
    // }
    
    return new JsonRpcProvider(`${ALCHEMY_BASE_URLS[chainId as keyof typeof ALCHEMY_BASE_URLS]}/${(specificAlchemyKey || getRandomFromStringList(process.env.ALCHEMY_KEYS!))}`);
}

export const getPaidProvider = (chainId: string | number) => {
    if (chainId?.toString() === NetworkIds.mainnet || chainId?.toString() === NetworkIds.sepolia) {
        return new InfuraProvider(Number(chainId), getRandomFromStringList(process.env.INFURA_KEYS!));
    }
    return getProvider(chainId);
}

export const getCallForFunction = (contract: Contract, functionName: string, args: any[]) => {
    const functionSignature = contract.interface.getSighash(functionName);
    const functionInputTypes = contract.interface.fragments
        .find(f => f.name === functionName && f.type === 'function')?.inputs.map(i => i.type) || [];
    const callData = (new AbiCoder().encode(functionInputTypes, args)).replace('0x', '');
    return {
        to: contract.address,
        data: functionSignature + callData,
    };
}

/** provider needs to support historical data, example: AlchemyProvider */
export const getHistoricValue = (contract: Contract, block: number, functionName: string, args: any[]) => {
    return contract.provider.call(getCallForFunction(contract, functionName, args), block);
}

export const getHistoricalProvider = (chainId: string) => {
    if(!!ALCHEMY_BASE_URLS[chainId as keyof typeof ALCHEMY_BASE_URLS]){
        return new JsonRpcProvider(`${ALCHEMY_BASE_URLS[chainId as keyof typeof ALCHEMY_BASE_URLS]}/${process.env.OP_ALCHEMY_KEY}`);
    } else {
        return getProvider(chainId);
    }
}