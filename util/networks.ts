import { TOKENS, UNDERLYING } from '@app/variables/tokens';
import { NETWORKS } from '@app/config/networks';
import { Fed, Network, NetworkConfig, NetworkIds, TokenList } from '@app/types';
import { getToken } from '@app/util/markets';
import { CUSTOM_NAMED_ADDRESSES } from '@app/variables/names';
import { FED_ABI, XCHAIN_FED_ABI } from '@app/config/abis';

export const getNetworkImage = (chainId: string) => {
    const { image, codename } = getNetwork(chainId);
    return image || `/assets/networks/${codename}.png`;
}

export const isSupportedNetwork = (chainId?: string | number): boolean => {
    return !!chainId && !!getNetwork(chainId)?.isSupported;
}

export const getNetwork = (chainId: string | number): Network => {
    return NETWORKS.find(network => network.id === chainId?.toString())
        || {
        name: 'Unknown',
        id: chainId?.toString(),
        codename: 'unknown',
        coinSymbol: '',
    };
}

export const getNetworkConfig = (chainId: string | number, returnMainIfUnsupported = false): NetworkConfig | undefined => {
    const chainIdToGet = !isSupportedNetwork(chainId) && returnMainIfUnsupported ? process.env.NEXT_PUBLIC_CHAIN_ID! : chainId;
    const network = getNetwork(chainIdToGet);
    return network?.config;
}

export const getNetworks = (): Network[] => NETWORKS;
export const getSupportedNetworks = (): Network[] => NETWORKS
    // .filter(network => network.isSupported)
    .filter(network => network.id === process.env.NEXT_PUBLIC_CHAIN_ID)


export const getNetworkConfigConstants = (
    configOrChainId: NetworkConfig | string | number = process.env.NEXT_PUBLIC_CHAIN_ID!,
) => {
    const config = typeof configOrChainId === 'string' || typeof configOrChainId === 'number' ?
        getNetworkConfig(configOrChainId, true)! :
        isSupportedNetwork(configOrChainId.chainId) ?
            configOrChainId : getNetworkConfig(process.env.NEXT_PUBLIC_CHAIN_ID!)!;

    const MULTISIGS = config.multisigs;

    const SECONDS_PER_BLOCK = config.SECONDS_PER_BLOCK;

    // Anchor
    const LENS = config.anchor.lens;
    const COMPTROLLER = config.anchor.comptroller;
    const ORACLE = config.anchor.oracle;
    const STABILIZER = config.stabilizer;
    const TREASURY = config.anchor.treasury;
    const AN_CHAIN_COIN_REPAY_ALL = config.anchor.anChainCoinRepayAll;

    const GOVERNANCE = config.governance;
    const GOVERNANCE_ALPHA = config.governanceAlpha;
    const MULTI_DELEGATOR = config.multiDelegator;

    // Harvester
    const HARVESTER = config.harvester;

    // Escrow
    const ESCROW_OLD = config.escrow_old;
    const ESCROW = config.escrow;

    // Tokens
    const WCOIN = Object.values(TOKENS).find(token => token.isWrappedChainCoin)?.address!;
    const XINV = process.env.NEXT_PUBLIC_REWARD_STAKED_TOKEN!;
    const XINV_V1 = process.env.NEXT_PUBLIC_REWARD_STAKED_TOKEN_OLD;
    const INV = Object.values(TOKENS).find(token => token.symbol === process.env.NEXT_PUBLIC_REWARD_TOKEN_SYMBOL)?.address!;
    const DOLA = Object.values(TOKENS).find(token => token.symbol === 'DOLA')?.address!;
    const DAI = Object.values(TOKENS).find(token => token.symbol === 'DAI')?.address!;
    const MIM = Object.values(TOKENS).find(token => token.symbol === 'MIM')?.address!;
    const USDC = Object.values(TOKENS).find(token => token.symbol === 'USDC')?.address!;
    const USDT = Object.values(TOKENS).find(token => token.symbol === 'USDT')?.address!;
    const YFI = Object.values(TOKENS).find(token => token.symbol === 'YFI')?.address!;
    const WBTC = Object.values(TOKENS).find(token => token.symbol === 'WBTC')?.address!;
    const INVDOLASLP = Object.values(TOKENS).find(token => token.symbol === 'INV-DOLA-SLP')?.address!;
    const DOLA3POOLCRV = Object.values(TOKENS).find(token => token.symbol === 'DOLA-3POOL')?.address!;
    const DOLA_PAYROLL = config.DOLA_PAYROLL;
    const DEPLOYER = config.DEPLOYER;

    const ANCHOR_TOKENS = Object.keys(UNDERLYING).filter(ad => ![XINV, XINV_V1].includes(ad));
    const ANCHOR_CHAIN_COIN = Object.entries(UNDERLYING).find(([key, token]) => !token.address)![0];
    const ANCHOR_DOLA = Object.entries(UNDERLYING).find(([key, token]) => token.address === process.env.NEXT_PUBLIC_DOLA)![0];

    const ALL_UNDERLYING: TokenList = {
        ...UNDERLYING,
    }

    const NAMED_ADDRESSES: { [key: string]: string } = {
        [DEPLOYER]: 'Deployer',
        [ESCROW]: 'Escrow',
        [COMPTROLLER]: 'Comptroller',
        [STABILIZER]: 'Stabilizer',
        [TREASURY]: 'Treasury',
        [GOVERNANCE]: 'GovMills',
        [GOVERNANCE_ALPHA]: 'GovAlpha',
        [DOLA_PAYROLL]: 'DolaPayroll',
        ...CUSTOM_NAMED_ADDRESSES,
    }
    MULTISIGS.forEach(m => NAMED_ADDRESSES[m.address] = m.name)

    // FEDS
    const FEDS: Fed[] = [
        { chainId: NetworkIds.mainnet, abi: FED_ABI, address: '0x5E075E40D01c82B6Bf0B0ecdb4Eb1D6984357EF7', name: 'Anchor Fed', projectImage: '/assets/projects/Anchor.png' },
        { chainId: NetworkIds.mainnet, abi: FED_ABI, address: '0xe3277f1102C1ca248aD859407Ca0cBF128DB0664', name: 'Fuse6 Fed', projectImage: '/assets/projects/Fuse.png' },
        { chainId: NetworkIds.mainnet, abi: FED_ABI, address: '0x7765996dAe0Cf3eCb0E74c016fcdFf3F055A5Ad8', name: 'Badger Fed', projectImage: '/assets/projects/Badger.jpg' },
        { chainId: NetworkIds.mainnet, abi: FED_ABI, address: '0x5Fa92501106d7E4e8b4eF3c4d08112b6f306194C', name: '0xb1 Fed', projectImage: 'https://unavatar.io/twitter/0x_b1' },
        { chainId: NetworkIds.ftm, isXchain: true, abi: XCHAIN_FED_ABI, address: '0x4d7928e993125A9Cefe7ffa9aB637653654222E2', name: 'Scream Fed', projectImage: '/assets/projects/Scream.webp' },
    ];

    return {
        LENS,
        AN_CHAIN_COIN_REPAY_ALL,
        COMPTROLLER,
        ORACLE,
        STABILIZER,
        TREASURY,
        ANCHOR_CHAIN_COIN,
        ANCHOR_DOLA,
        ANCHOR_TOKENS,
        GOVERNANCE,
        GOVERNANCE_ALPHA,
        MULTI_DELEGATOR,
        HARVESTER,
        ESCROW_OLD,
        ESCROW,
        INV,
        DOLA,
        DAI,
        MIM,
        USDC,
        USDT,
        WCOIN,
        YFI,
        WBTC,
        XINV_V1,
        XINV,
        INVDOLASLP,
        DOLA3POOLCRV,
        UNDERLYING: ALL_UNDERLYING,
        TOKENS,
        NAMED_ADDRESSES,
        DOLA_PAYROLL,
        FEDS,
        DEPLOYER,
        MULTISIGS,
        SECONDS_PER_BLOCK,
        POLICY_COMMITTEE: config.policyCommittee,
        XINV_MANAGER: config.xinvManager,
        OP_BOND_MANAGER: config.opBondManager,
        XINV_VESTOR_FACTORY: config.xinvVestorFactory,
        VESTERS: config.vesters,
        SWAP_ROUTER: config.swapRouter,
    }
}