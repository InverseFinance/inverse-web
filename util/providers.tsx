import { AlchemyProvider, InfuraProvider, CloudflareProvider, JsonRpcProvider, FallbackProvider } from "@ethersproject/providers";
import { NetworkIds } from '@app/types';
import { getRandomFromStringList } from './misc';
import { Contract } from "ethers";
import { AbiCoder } from "ethers/lib/utils";

export const getProvider = (chainId: string | number, specificAlchemyKey?: string, onlyAlchemy = false): FallbackProvider | JsonRpcProvider => {
    if (chainId === '31337') {
        return new JsonRpcProvider('http://localhost:8545/');
    }
    else if (chainId === NetworkIds.ftm && !specificAlchemyKey) {
        return new JsonRpcProvider('https://rpc.ftm.tools/');
    }
    else if (chainId === NetworkIds.optimism && !specificAlchemyKey) {
        return new JsonRpcProvider('https://optimism.llamarpc.com');
    }
    else if (chainId === NetworkIds.bsc && !specificAlchemyKey) {
        return new JsonRpcProvider('https://bsc-dataseed3.binance.org');
    }
    else if (chainId === NetworkIds.arbitrum && !specificAlchemyKey) {
        return new JsonRpcProvider('https://arb1.arbitrum.io/rpc');
    }
    else if (chainId === NetworkIds.polygon && !specificAlchemyKey) {
        return new JsonRpcProvider('https://polygon.llamarpc.com');
    }
    else if (chainId === NetworkIds.avalanche && !specificAlchemyKey) {
        return new JsonRpcProvider('https://rpc.ankr.com/avalanche');
    }
    else if (chainId === NetworkIds.base && !specificAlchemyKey) {
        return new JsonRpcProvider('https://mainnet.base.org');
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
    if (chainId?.toString() === NetworkIds.optimism) {
        return new AlchemyProvider(Number(chainId), process.env.OP_ALCHEMY_KEY);
    }
    return getProvider(chainId);
}