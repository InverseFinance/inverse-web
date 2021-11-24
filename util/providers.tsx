import { AlchemyProvider, InfuraProvider, CloudflareProvider, FallbackProvider } from "@ethersproject/providers";

export const getProvider = (chainId: string | number): FallbackProvider => {
    const network = Number(chainId);

    const providers = [new CloudflareProvider(network)];
    providers.unshift(new InfuraProvider(network, process?.env?.INFURA_ID || '6b35eba40d2d47c0b115b3110073faf8'))
    providers.unshift(new AlchemyProvider(network, process?.env?.ALCHEMY_API || 'YVO2GiC9kWZCnFsJBvFi-UKz_GtC5TrD'))

    return new FallbackProvider(providers);
}