import { AlchemyProvider, InfuraProvider, CloudflareProvider, JsonRpcProvider, FallbackProvider } from "@ethersproject/providers";
import { NetworkIds } from '@app/types';

export const getProvider = (chainId: string | number, specificAlchemyKey?: string, onlyAlchemy = false): FallbackProvider | JsonRpcProvider => {
    if(chainId === '31337') {
        return new JsonRpcProvider('http://localhost:8545/');
    }
    else if(chainId === NetworkIds.ftm) {
        return new JsonRpcProvider('https://rpc.ftm.tools/');
    }
    const network = Number(chainId);
    const providers = [new AlchemyProvider(network, specificAlchemyKey || process.env.ALCHEMY_API)];

    if(!onlyAlchemy) {
        // providers.push(new CloudflareProvider(network));
        providers.push(new InfuraProvider(network, process.env.INFURA_ID))
    } else {
        return providers[0]
    }

    return new FallbackProvider(providers, 1);
}