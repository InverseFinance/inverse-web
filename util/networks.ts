import { TOKENS, UNDERLYING } from '@app/variables/tokens';
import { NETWORKS } from '@app/config/networks';
import { Fed, Network, NetworkConfig, NetworkIds, TokenList, Vaults, VaultTree } from '@app/types';
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
    const chainIdToGet = !isSupportedNetwork(chainId) && returnMainIfUnsupported ? NetworkIds.mainnet : chainId;
    const network = getNetwork(chainIdToGet);
    return network?.config;
}

export const getNetworks = (): Network[] => NETWORKS;
export const getSupportedNetworks = (): Network[] => NETWORKS.filter(network => network.isSupported);

export const getNetworkConfigConstants = (
    configOrChainId: NetworkConfig | string | number = NetworkIds.mainnet,
) => {
    const config = typeof configOrChainId === 'string' || typeof configOrChainId === 'number' ?
        getNetworkConfig(configOrChainId, true)! :
        isSupportedNetwork(configOrChainId.chainId) ?
            configOrChainId : getNetworkConfig(NetworkIds.mainnet)!;

    // Vaults
    const VAULT_USDC_ETH = config.vaults?.vaultUsdcEth;
    const VAULT_DAI_WBTC = config.vaults?.vaultDaiWbtc;
    const VAULT_DAI_YFI = config.vaults?.vaultDaiYfi;
    const VAULT_DAI_ETH = config.vaults?.vaultDaiEth;
    const VAULT_TOKENS = config.vaults ? Object.values(config.vaults) : [];

    const MULTISIGS = {
        // '0x6128ED9EE07D89Ba3a1E6E0e16C69488112Fc925': 'MarketingCommittee',
        '0x77C64eEF5F4781Dd6e9405a8a77D80567CFD37E0': 'Rewards Committee',
        '0x07de0318c24D67141e6758370e9D7B6d863635AA': 'Growth Working Group',
    }

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
    const WCOIN = Object.values(TOKENS).find(token => token.isWrappedChainCoin)?.address;
    const XINV = process.env.NEXT_PUBLIC_REWARD_STAKED_TOKEN;
    const XINV_V1 = process.env.NEXT_PUBLIC_REWARD_STAKED_TOKEN_OLD;
    const INV = Object.values(TOKENS).find(token => token.symbol === process.env.NEXT_PUBLIC_REWARD_TOKEN_SYMBOL)?.address;
    const DOLA = Object.values(TOKENS).find(token => token.symbol === 'DOLA')?.address!;
    const DAI = Object.values(TOKENS).find(token => token.symbol === 'DAI')?.address!;
    const USDC = Object.values(TOKENS).find(token => token.symbol === 'USDC')?.address!;
    const USDT = Object.values(TOKENS).find(token => token.symbol === 'USDT')?.address!;
    const YFI = Object.values(TOKENS).find(token => token.symbol === 'YFI')?.address!;
    const WBTC = Object.values(TOKENS).find(token => token.symbol === 'WBTC')?.address!;
    const INVDOLASLP = '0x5BA61c0a8c4DccCc200cd0ccC40a5725a426d002'
    const DOLA3POOLCRV = '0xAA5A67c256e27A5d80712c51971408db3370927D'
    const DOLA_PAYROLL = config.DOLA_PAYROLL;
    const DEPLOYER = config.DEPLOYER;

    const ANCHOR_TOKENS = Object.keys(UNDERLYING).filter(ad => ![XINV, XINV_V1].includes(ad))
    const ANCHOR_CHAIN_COIN = Object.entries(UNDERLYING).find(([key, token]) => !token.address)![0];
    const ANCHOR_DOLA = Object.entries(UNDERLYING).find(([key, token]) => token.address === process.env.NEXT_PUBLIC_DOLA)![0];

    const ALL_UNDERLYING: TokenList = {
        ...UNDERLYING,
        [VAULT_USDC_ETH]: getToken(TOKENS, 'USDC'),
        [VAULT_DAI_ETH]: getToken(TOKENS, 'DAI'),
        [VAULT_DAI_WBTC]: getToken(TOKENS, 'DAI'),
        [VAULT_DAI_YFI]: getToken(TOKENS, 'DAI'),
        // [THREECRV]: getToken(TOKENS, '3CRV'),
    }

    const NAMED_ADDRESSES: { [key: string]: string } = {
        [VAULT_USDC_ETH]: 'vaultUsdcEth',
        [VAULT_DAI_ETH]: 'vaultDaiEth',
        [VAULT_DAI_WBTC]: 'vaultDaiWbtc',
        [VAULT_DAI_YFI]: 'vaultDaiYfi',
        [DEPLOYER]: 'Deployer',
        [ESCROW]: 'Escrow',
        [COMPTROLLER]: 'Comptroller',
        [STABILIZER]: 'Stabilizer',
        [TREASURY]: 'Treasury',
        [GOVERNANCE]: 'GovMills',
        [GOVERNANCE_ALPHA]: 'GovAlpha',
        [DOLA_PAYROLL]: 'DolaPayroll',
        // Multisigs
        ...MULTISIGS,
        ...CUSTOM_NAMED_ADDRESSES,
    }

    const VAULT_TREE: VaultTree = {
        [DAI]: {
            CHAIN_COIN: VAULT_DAI_ETH,
            [WBTC]: VAULT_DAI_WBTC,
            [YFI]: VAULT_DAI_YFI,
        },
        [USDC]: {
            CHAIN_COIN: VAULT_USDC_ETH,
        },
    }

    const VAULTS: Vaults = {
        [VAULT_DAI_ETH]: {
            from: TOKENS[DAI],
            to: TOKENS.CHAIN_COIN,
        },
        [VAULT_DAI_WBTC]: {
            from: TOKENS[DAI],
            to: TOKENS[WBTC],
        },
        [VAULT_DAI_YFI]: {
            from: TOKENS[DAI],
            to: TOKENS[YFI],
        },
        [VAULT_USDC_ETH]: {
            from: TOKENS[USDC],
            to: TOKENS.CHAIN_COIN,
        },
    }

    // FEDS
    const FEDS: Fed[] = [
        { chainId: NetworkIds.mainnet, abi: FED_ABI, address: '0x5E075E40D01c82B6Bf0B0ecdb4Eb1D6984357EF7', name: 'Anchor Fed', projectImage: 'Anchor.png' },
        { chainId: NetworkIds.mainnet, abi: FED_ABI, address: '0xe3277f1102C1ca248aD859407Ca0cBF128DB0664', name: 'Fuse6 Fed', projectImage: 'Fuse.png' },
        { chainId: NetworkIds.ftm, isXchain: true, abi: XCHAIN_FED_ABI, address: '0x4d7928e993125A9Cefe7ffa9aB637653654222E2', name: 'Scream Fed', projectImage: 'Scream.webp' },
    ];

    return {
        VAULT_USDC_ETH,
        VAULT_DAI_WBTC,
        VAULT_DAI_YFI,
        VAULT_DAI_ETH,
        VAULT_TOKENS,
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
        VAULTS,
        VAULT_TREE,
        NAMED_ADDRESSES,
        DOLA_PAYROLL,
        FEDS,
        DEPLOYER,
        MULTISIGS,
    }
}