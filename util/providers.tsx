import { AlchemyProvider, InfuraProvider, CloudflareProvider, JsonRpcProvider, FallbackProvider } from "@ethersproject/providers";
import { NetworkIds } from '@app/types';

export const getProvider = (chainId: string | number, specificAlchemyKey?: string, onlyAlchemy = false): FallbackProvider | JsonRpcProvider => {
    if(chainId === NetworkIds.ftm) {
        return new JsonRpcProvider('https://rpc.ftm.tools/');
    }
    const network = Number(chainId);
    const providers = [new AlchemyProvider(network, specificAlchemyKey || process.env.ALCHEMY_API)];

    if(!onlyAlchemy) {
        // providers.push(new CloudflareProvider(network));
        providers.push(new InfuraProvider(network, process.env.INFURA_ID))
    }

    return new FallbackProvider(providers, 1);
}