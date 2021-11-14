import { AlchemyProvider, InfuraProvider, CloudflareProvider, FallbackProvider } from "@ethersproject/providers";

export const getProvider = (chainId: string | number): FallbackProvider => {
    const network = Number(chainId);

    const providers = [new CloudflareProvider(network)];

    // if(process.env.INFURA_ID) {
        // temporary
        // providers.unshift(new InfuraProvider(network, process.env.INFURA_ID))
        providers.unshift(new InfuraProvider(network, '0f73c7f3cbcc4dfc80b178b346d14c73'))
    // }

    // if(process.env.ALCHEMY_API) {
        // temporary
        providers.unshift(new AlchemyProvider(network, 'Im06YX8gmXb3PDPLG7nv3ExIYGppGDvf'))
    // }

    return new FallbackProvider(providers);
}