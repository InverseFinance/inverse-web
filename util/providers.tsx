import { AlchemyProvider, InfuraProvider, CloudflareProvider, FallbackProvider } from "@ethersproject/providers";

export const getProvider = (chainId: string | number): FallbackProvider => {
    const network = Number(chainId);

    const providers = [new CloudflareProvider(network)];

    // if(process.env.INFURA_ID) {
        // temporary
        // providers.unshift(new InfuraProvider(network, process.env.INFURA_ID))
        providers.unshift(new InfuraProvider(network, '6b35eba40d2d47c0b115b3110073faf8'))
    // }

    // if(process.env.ALCHEMY_API) {
        providers.unshift(new AlchemyProvider(network, 'YVO2GiC9kWZCnFsJBvFi-UKz_GtC5TrD'))
    // }

    return new FallbackProvider(providers);
}