import { TOKENS, UNDERLYING } from '@app/variables/tokens';
import { NETWORKS } from '@app/config/networks';
import { Fed, Multisig, Network, NetworkConfig, NetworkIds, TokenList } from '@app/types';
import { CUSTOM_NAMED_ADDRESSES } from '@app/variables/names';
import { FED_ABI, FIRM_FED_ABI, XCHAIN_FED_ABI } from '@app/config/abis';

export const getNetworkImage = (chainId: string) => {
    const { image, codename } = getNetwork(chainId);
    return image || `/assets/networks/${codename}.png`;
}

export const isSupportedNetwork = (chainId?: string | number): boolean => {
    return !!chainId && !!getNetwork(chainId)?.isSupported;
}

export const getNetwork = (chainIdOrCodename: string | number): Network => {
    return NETWORKS.find(network => network.id === chainIdOrCodename?.toString() || chainIdOrCodename === network.codename)
        || {
        name: 'Unknown',
        id: chainIdOrCodename?.toString(),
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
    let config = typeof configOrChainId === 'string' || typeof configOrChainId === 'number' ?
        getNetworkConfig(configOrChainId, true)! :
        isSupportedNetwork(configOrChainId.chainId) ?
            configOrChainId : getNetworkConfig(process.env.NEXT_PUBLIC_CHAIN_ID!)!;

    if(!['1', '31337'].includes(process.env.NEXT_PUBLIC_CHAIN_ID) && config === undefined) {
        config = { anchor: {} };
    }
    if(!config) {
        config = getNetworkConfig(NetworkIds.mainnet)
    }
    const MULTISIGS: Multisig[] = config?.multisigs || [];
    
    // Anchor
    const LENS = config.anchor.lens;
    const COMPTROLLER = config.anchor.comptroller;
    const ORACLE = config.anchor.oracle;
    const STABILIZER = config.stabilizer;
    const TREASURY = config.anchor.treasury;

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
    const FRAX = Object.values(TOKENS).find(token => token.symbol === 'FRAX')?.address!;
    const YFI = Object.values(TOKENS).find(token => token.symbol === 'YFI')?.address!;
    const WBTC = Object.values(TOKENS).find(token => token.symbol === 'WBTC')?.address!;
    const INVDOLASLP = Object.values(TOKENS).find(token => token.symbol === 'INV-DOLA-SLP')?.address!;
    const DOLA3POOLCRV = Object.values(TOKENS).find(token => token.symbol === 'DOLA-3POOL')?.address!;
    const DOLAFRAXCRV = Object.values(TOKENS).find(token => token.symbol === 'DOLA-FRAXBP')?.address!;
    const DOLA_PAYROLL = config.DOLA_PAYROLL;
    const DEPLOYER = config.DEPLOYER;

    const ANCHOR_TOKENS = Object.keys(UNDERLYING).filter(ad => ![XINV, XINV_V1].includes(ad));
    const ANCHOR_CHAIN_COIN = '0x8e103Eb7a0D01Ab2b2D29C91934A9aD17eB54b86'//Object.entries(UNDERLYING).find(([key, token]) => !token.address)![0];
    const ANCHOR_CHAIN_COINS = ['0x8e103Eb7a0D01Ab2b2D29C91934A9aD17eB54b86', '0x697b4acAa24430F254224eB794d2a85ba1Fa1FB8'];
    const findAnchorDola = Object.entries(UNDERLYING).find(([key, token]) => token.address === process.env.NEXT_PUBLIC_DOLA)!;
    const ANCHOR_DOLA = findAnchorDola?.length > 0 ? findAnchorDola[0] : '';

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
        [DOLA_PAYROLL]: 'DolaPayroll-v1',
        ...CUSTOM_NAMED_ADDRESSES,
    }
    MULTISIGS?.forEach(m => NAMED_ADDRESSES[m.address] = m.name)

    // FEDS
    const FEDS: Fed[] = (config.feds||[]).map((fed) => {
        return { ...fed, abi: fed.isXchain ? XCHAIN_FED_ABI : fed.isFirm ? FIRM_FED_ABI :  FED_ABI }
    });
    const FEDS_WITH_ALL = [{ name: 'All Feds', projectImage: '/assets/projects/eth-ftm.webp', address: '', chainId: NetworkIds.ethftm }]
        .concat(FEDS)

    return {
        LENS,
        COMPTROLLER,
        ORACLE,
        STABILIZER,
        TREASURY,
        ANCHOR_CHAIN_COIN,
        ANCHOR_CHAIN_COINS,
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
        FRAX,
        WCOIN,
        YFI,
        WBTC,
        XINV_V1,
        XINV,
        INVDOLASLP,
        DOLA3POOLCRV,
        DOLAFRAXCRV,
        UNDERLYING: ALL_UNDERLYING,
        TOKENS,
        NAMED_ADDRESSES,
        DOLA_PAYROLL,
        FEDS,
        FEDS_WITH_ALL,
        DEPLOYER,
        MULTISIGS,
        POLICY_COMMITTEE: config.policyCommittee,
        XINV_MANAGER: config.xinvManager,
        OP_BOND_MANAGER: config.opBondManager,
        XINV_VESTOR_FACTORY: config.xinvVestorFactory,
        SWAP_ROUTER: config.swapRouter,
        DISPERSE_APP: config.disperseApp,
        DEBT_REPAYER: config.debtRepayer,
        DEBT_CONVERTER: config.debtConverter,
        DBR: config.dbr,
        DBR_AIRDROP: config.dbrAirdrop,
        DBR_DISTRIBUTOR: config.dbrDistributor,
        F2_CONTROLLER: config.f2controller,
        F2_HELPER: config.f2helper,
        F2_DBR_REWARDS_HELPER: config.f2dbrRewardsHelper,
        F2_ORACLE: config.f2Oracle,
        F2_MARKETS: config.f2markets||[],
        F2_ALE: config.f2ale,
    }
}