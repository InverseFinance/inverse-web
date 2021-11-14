import { AlchemyProvider, InfuraProvider, CloudflareProvider, FallbackProvider } from "@ethersproject/providers";

export const getProvider = (chainId: string | number): FallbackProvider => {
    const network = Number(chainId);

    const providers = [new CloudflareProvider(network)];

    // if(process.env.INFURA_ID) {
        // providers.unshift(new InfuraProvider(network, process.env.INFURA_ID))
        providers.unshift(new InfuraProvider(network, '9e0096c3993449c09499784d5cc6c27e'))
    // }

    // if(process.env.ALCHEMY_API) {
        // temporary
        providers.unshift(new AlchemyProvider(network, 'YVO2GiC9kWZCnFsJBvFi-UKz_GtC5TrD'))
    // }

    return new FallbackProvider(providers);
}