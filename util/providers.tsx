import { AlchemyProvider, InfuraProvider, CloudflareProvider, JsonRpcProvider, FallbackProvider } from "@ethersproject/providers";
import { NetworkIds } from '@app/types';
import { getRandomFromStringList } from './misc';
import { Contract } from "ethers";
import { AbiCoder } from "ethers/lib/utils";

export const getProvider = (chainId: string | number, specificAlchemyKey?: string, onlyAlchemy = false): FallbackProvider | JsonRpcProvider => {
    if(chainId === '31337') {
        return new JsonRpcProvider('http://localhost:8545/');
    }
    else if(chainId === NetworkIds.ftm) {
        return new JsonRpcProvider('https://rpc.ftm.tools/');
    }
    else if(chainId === NetworkIds.optimism) {
        return new JsonRpcProvider('https://rpc.ankr.com/optimism');
    } 
    else if(chainId === NetworkIds.bsc) {
        return new JsonRpcProvider('https://bsc-dataseed3.binance.org');
    }
    else if(chainId === NetworkIds.arbitrum) {
        return new JsonRpcProvider('https://arb1.arbitrum.io/rpc');
    }
    else if(chainId === NetworkIds.polygon) {
        return new JsonRpcProvider('https://polygon.llamarpc.com');
    }    
    else if(chainId === NetworkIds.avalanche) {
        return new JsonRpcProvider('https://rpc.ankr.com/avalanche');
    }
    const network = Number(chainId);
    const providers = [new AlchemyProvider(network, specificAlchemyKey || getRandomFromStringList(process.env.ALCHEMY_KEYS!))];

    return providers[0]
    // if(!onlyAlchemy) {
    //     // providers.push(new CloudflareProvider(network));
    //     providers.push(new InfuraProvider(network, getRandomFromStringList(process.env.INFURA_KEYS!)))
    // } else {
    //     return providers[0]
    // }
    // return new FallbackProvider(providers, 1);
}

/** provider needs to support historical data, example: AlchemyProvider */
export const getHistoricValue = (contract: Contract, block: number, functionName: string, args: any[]) => {
    const functionSignature = contract.interface.getSighash(functionName);
    const functionInputTypes = contract.interface.fragments
        .find(f => f.name === functionName && f.type === 'function')?.inputs.map(i => i.type) || [];
    const callData = (new AbiCoder().encode(functionInputTypes, args)).replace('0x', '');
    return contract.provider.call({
        to: contract.address,
        data: functionSignature + callData,
    }, block);
}