import { AlchemyProvider, InfuraProvider, CloudflareProvider, FallbackProvider } from "@ethersproject/providers";

export const getProvider = (chainId: string | number, specificAlchemyKey?: string, onlyAlchemy = false): FallbackProvider => {
    const network = Number(chainId);
    const providers = [new AlchemyProvider(network, specificAlchemyKey || process.env.ALCHEMY_API)];

    if(!onlyAlchemy) {
        // providers.push(new CloudflareProvider(network));
        providers.push(new InfuraProvider(network, process.env.INFURA_ID))
    }

    return new FallbackProvider(providers, 1);
}