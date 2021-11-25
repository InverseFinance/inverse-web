import { AlchemyProvider, InfuraProvider, CloudflareProvider, FallbackProvider } from "@ethersproject/providers";

export const getProvider = (chainId: string | number, onlyAlchemy = false): FallbackProvider => {
    const network = Number(chainId);
    const providers = [new AlchemyProvider(network, 'LgTZOKdM-WIveBwxT3m5wU78afiM8Eau' || process?.env?.ALCHEMY_API || 'YVO2GiC9kWZCnFsJBvFi-UKz_GtC5TrD')];

    if(!onlyAlchemy) {
        providers.push(new CloudflareProvider(network));
        providers.push(new InfuraProvider(network, process?.env?.INFURA_ID || '6b35eba40d2d47c0b115b3110073faf8'))
    }

    return new FallbackProvider(providers);
}