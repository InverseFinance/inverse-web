import { AlchemyProvider, InfuraProvider, CloudflareProvider, FallbackProvider } from "@ethersproject/providers";

export const getProvider = (chainId: string | number): FallbackProvider => {
    const network = Number(chainId);

    const providers = [new CloudflareProvider(network)];

    if(process.env.INFURA_ID) {
        providers.unshift(new InfuraProvider(network, process.env.INFURA_ID))
    }

    if(process.env.ALCHEMY_API) {
        providers.unshift(new AlchemyProvider(network, process.env.ALCHEMY_API))
    }

    return new FallbackProvider(providers);
}