import { VIEWER_CONTRACT_ADDRESS } from "@app/config/constants";
import { VIEWER_ABI } from "@app/config/viewer-abi";
import { JsonRpcSigner, Provider } from "@ethersproject/providers";
import { Contract } from "ethers";

type AccountDebtData = {
    totalDebt: number;
    dbrBalance: number;
    dolaBalance: number;
    depletionTimestamp: number;
    monthlyBurn: number;
};

type AccountGovernanceBreakdown = {
    invDelegate: string;
    xInvDelegate: string;
    firmDelegate: string;
    invVotes: number;
    xInvVotes: number;
    totalVotes: number;
};

type AccountInvBalancesBreakdown = {
    inv: number;
    xinv: number;
    firm: number;
    sInvV1: number;
    sInvV2: number;
    sInv: number;
    totalStaked: number;
    totalInv: number;
};

type AccountInvBreakdown = {
    balances: AccountInvBalancesBreakdown;
    governance: AccountGovernanceBreakdown;
};

type PositionData = {
    escrow: string;
    balance: number;
    debt: number;
    collateralValue: number;
    creditLimit: number;
    creditLeft: number;
    withdrawalLimit: number;
    borrowLimit: number;
    liquidationPrice: number;
    monthlyBurn: number;
};

type MarketData = {
    collateral: string;
    oracleFeed: string;
    decimals: number;
    collateralSymbol: string;
    collateralName: string;
    totalDebt: number;
    price: number;
    leftToBorrow: number;
    dailyLimit: number;
    dailyBorrows: number;
    liquidity: number;
    minDebt: number;
    collateralFactorBps: number;
    liquidationFactorBps: number;
    liquidationFeeBps: number;
    liquidationIncentiveBps: number;
    replenishmentIncentiveBps: number;
    borrowCeiling: number;
    isPaused: boolean;
};

type PriceData = {
    dolaPrice: number;
    dbrPrice: number;
    dbrPriceInDola: number;
    dbrPriceInInv: number;
    invPrice: number;
}

export const inverseViewer = (providerOrSigner: Provider | JsonRpcSigner) => {
    const contract = new Contract(VIEWER_CONTRACT_ADDRESS, VIEWER_ABI, providerOrSigner);
    return {
        contract,
        firm: {
            getMarketListAndAccountListBreakdown: contract.getMarketListAndAccountListBreakdown,
            getAccountDebtData: contract.getAccountDebtData,
            getAccountInvBreakdown: contract.getAccountInvBreakdown,
            getPositionData: contract.getAccountPosition,
            getMarketData: contract.getMarketData,
            getMarketListData: contract.getMarketListData,
            getAccountPosition: contract.getAccountPosition,
            getAccountDbrClaimableRewards: contract.getAccountDbrClaimableRewards,
            getAccountFirmDelegate: contract.getAccountFirmDelegate,
            getAccountFirmStakedInv: contract.getAccountFirmStakedInv,
            getAccountListDebtData: contract.getAccountListDebtData,
            getAccountPositionsForMarketList: contract.getAccountPositionsForMarketList,
            getDepletionTimestamp: contract.getDepletionTimestamp,
        },
        inv: {
            getAccountAssetsInSInvV1: contract.getAccountAssetsInSInvV1,
            getAccountAssetsInSInvV2: contract.getAccountAssetsInSInvV2,
            getAccountFirmDelegate: contract.getAccountFirmDelegate,
            getAccountFirmStakedInv: contract.getAccountFirmStakedInv,
            getAccountFrontierStakedInv: contract.getAccountFrontierStakedInv,
            getAccountGovBreakdown: contract.getAccountGovBreakdown,
            getAccountInvBalancesBreakdown: contract.getAccountInvBalancesBreakdown,
            getAccountInvVotes: contract.getAccountInvVotes,
            getAccountTotalAssetsInSInvs: contract.getAccountTotalAssetsInSInvs,
            getAccountTotalInv: contract.getAccountTotalInv,
            getAccountTotalStakedInv: contract.getAccountTotalStakedInv,
            getAccountTotalVotes: contract.getAccountTotalVotes,
            getAccountVotesAtProposalStart: contract.getAccountVotesAtProposalStart,
            getAccountXinvVotes: contract.getAccountXinvVotes,
            getTotalInvStaked: contract.getTotalInvStaked,
            getTotalSInvAssets: contract.getTotalSInvAssets,
            getTotalSInvSupply: contract.getTotalSInvSupply,
            xinvExchangeRate: contract.xinvExchangeRate,
        },
        prices: {
            getDbrPrice: contract.getDbrPrice,
            getDbrPriceInDola: contract.getDbrPriceInDola,
            getDbrPriceInInv: contract.getDbrPriceInInv,
            getDolaPrice: contract.getDolaPrice,
            getInvOraclePrice: contract.getInvOraclePrice,
            getInvPrice: contract.getInvPrice,
            getInverseTokensPrices: contract.getInverseTokensPrices,
        }
    };
};

export const getViewerContract = (providerOrSigner: Provider | JsonRpcSigner) => {
    return new Contract(VIEWER_CONTRACT_ADDRESS, VIEWER_ABI, providerOrSigner);
};

// Implement getter functions
export const getAccountDebtData = async (providerOrSigner: Provider | JsonRpcSigner, account: string): Promise<AccountDebtData> => {
    const contract = getViewerContract(providerOrSigner);
    return contract.getAccountDebtData(account);
};

export const getAccountInvBreakdown = async (providerOrSigner: Provider | JsonRpcSigner, account: string): Promise<AccountInvBreakdown> => {
    const contract = getViewerContract(providerOrSigner);
    return contract.getAccountInvBreakdown(account);
};

export const getPositionData = async (providerOrSigner: Provider | JsonRpcSigner, market: string, account: string): Promise<PositionData> => {
    const contract = getViewerContract(providerOrSigner);
    return contract.getAccountPosition(market, account);
};

export const getMarketData = async (providerOrSigner: Provider | JsonRpcSigner, market: string): Promise<MarketData> => {
    const contract = getViewerContract(providerOrSigner);
    return contract.getMarketData(market);
};

export const getMarketListData = async (providerOrSigner: Provider | JsonRpcSigner, markets: string[]): Promise<MarketData[]> => {
    const contract = getViewerContract(providerOrSigner);
    return contract.getMarketListData(markets);
};

export const getAccountPosition = async (providerOrSigner: Provider | JsonRpcSigner, market: string, account: string): Promise<PositionData> => {
    const contract = getViewerContract(providerOrSigner);
    return contract.getAccountPosition(market, account);
};

// Add the following new functions:

export const getAccountAssetsInSInvV1 = async (providerOrSigner: Provider | JsonRpcSigner, account: string): Promise<number> => {
    const contract = getViewerContract(providerOrSigner);
    return contract.getAccountAssetsInSInvV1(account);
};

export const getAccountAssetsInSInvV2 = async (providerOrSigner: Provider | JsonRpcSigner, account: string): Promise<number> => {
    const contract = getViewerContract(providerOrSigner);
    return contract.getAccountAssetsInSInvV2(account);
};

export const getAccountDbrClaimableRewards = async (providerOrSigner: Provider | JsonRpcSigner, account: string): Promise<number> => {
    const contract = getViewerContract(providerOrSigner);
    return contract.getAccountDbrClaimableRewards(account);
};

export const getAccountFirmDelegate = async (providerOrSigner: Provider | JsonRpcSigner, account: string): Promise<string> => {
    const contract = getViewerContract(providerOrSigner);
    return contract.getAccountFirmDelegate(account);
};

export const getAccountFirmStakedInv = async (providerOrSigner: Provider | JsonRpcSigner, account: string): Promise<number> => {
    const contract = getViewerContract(providerOrSigner);
    return contract.getAccountFirmStakedInv(account);
};

export const getAccountFrontierStakedInv = async (providerOrSigner: Provider | JsonRpcSigner, account: string): Promise<number> => {
    const contract = getViewerContract(providerOrSigner);
    return contract.getAccountFrontierStakedInv(account);
};

export const getAccountGovBreakdown = async (providerOrSigner: Provider | JsonRpcSigner, account: string): Promise<AccountGovernanceBreakdown> => {
    const contract = getViewerContract(providerOrSigner);
    return contract.getAccountGovBreakdown(account);
};

export const getAccountInvBalancesBreakdown = async (providerOrSigner: Provider | JsonRpcSigner, account: string): Promise<AccountInvBalancesBreakdown> => {
    const contract = getViewerContract(providerOrSigner);
    return contract.getAccountInvBalancesBreakdown(account);
};

export const getAccountInvVotes = async (providerOrSigner: Provider | JsonRpcSigner, account: string): Promise<number> => {
    const contract = getViewerContract(providerOrSigner);
    return contract.getAccountInvVotes(account);
};

export const getAccountListDebtData = async (providerOrSigner: Provider | JsonRpcSigner, accounts: string[]): Promise<AccountDebtData[]> => {
    const contract = getViewerContract(providerOrSigner);
    return contract.getAccountListDebtData(accounts);
};

export const getAccountPositionsForMarketList = async (providerOrSigner: Provider | JsonRpcSigner, markets: string[], account: string): Promise<PositionData[]> => {
    const contract = getViewerContract(providerOrSigner);
    return contract.getAccountPositionsForMarketList(markets, account);
};

export const getAccountTotalAssetsInSInvs = async (providerOrSigner: Provider | JsonRpcSigner, account: string): Promise<number> => {
    const contract = getViewerContract(providerOrSigner);
    return contract.getAccountTotalAssetsInSInvs(account);
};

export const getAccountTotalInv = async (providerOrSigner: Provider | JsonRpcSigner, account: string): Promise<number> => {
    const contract = getViewerContract(providerOrSigner);
    return contract.getAccountTotalInv(account);
};

export const getAccountTotalStakedInv = async (providerOrSigner: Provider | JsonRpcSigner, account: string): Promise<number> => {
    const contract = getViewerContract(providerOrSigner);
    return contract.getAccountTotalStakedInv(account);
};

export const getAccountTotalVotes = async (providerOrSigner: Provider | JsonRpcSigner, account: string): Promise<number> => {
    const contract = getViewerContract(providerOrSigner);
    return contract.getAccountTotalVotes(account);
};

export const getAccountVotesAtProposalStart = async (providerOrSigner: Provider | JsonRpcSigner, account: string, proposalId: number): Promise<number> => {
    const contract = getViewerContract(providerOrSigner);
    return contract.getAccountVotesAtProposalStart(account, proposalId);
};

export const getAccountXinvVotes = async (providerOrSigner: Provider | JsonRpcSigner, account: string): Promise<number> => {
    const contract = getViewerContract(providerOrSigner);
    return contract.getAccountXinvVotes(account);
};

export const getDbrPrice = async (providerOrSigner: Provider | JsonRpcSigner): Promise<number> => {
    const contract = getViewerContract(providerOrSigner);
    return contract.getDbrPrice();
};

export const getDbrPriceInDola = async (providerOrSigner: Provider | JsonRpcSigner): Promise<number> => {
    const contract = getViewerContract(providerOrSigner);
    return contract.getDbrPriceInDola();
};

export const getDbrPriceInInv = async (providerOrSigner: Provider | JsonRpcSigner): Promise<number> => {
    const contract = getViewerContract(providerOrSigner);
    return contract.getDbrPriceInInv();
};

export const getDepletionTimestamp = async (providerOrSigner: Provider | JsonRpcSigner, account: string): Promise<number> => {
    const contract = getViewerContract(providerOrSigner);
    return contract.getDepletionTimestamp(account);
};

export const getDolaPrice = async (providerOrSigner: Provider | JsonRpcSigner): Promise<number> => {
    const contract = getViewerContract(providerOrSigner);
    return contract.getDolaPrice();
};

export const getInvOraclePrice = async (providerOrSigner: Provider | JsonRpcSigner): Promise<number> => {
    const contract = getViewerContract(providerOrSigner);
    return contract.getInvOraclePrice();
};

export const getInvPrice = async (providerOrSigner: Provider | JsonRpcSigner): Promise<number> => {
    const contract = getViewerContract(providerOrSigner);
    return contract.getInvPrice();
};

export const getInverseTokensPrices = async (providerOrSigner: Provider | JsonRpcSigner): Promise<PriceData> => {
    const contract = getViewerContract(providerOrSigner);
    return contract.getInverseTokensPrices();
};

export const getTotalSInvAssets = async (providerOrSigner: Provider | JsonRpcSigner): Promise<number> => {
    const contract = getViewerContract(providerOrSigner);
    return contract.getTotalSInvAssets();
};

export const getTotalSInvSupply = async (providerOrSigner: Provider | JsonRpcSigner): Promise<number> => {
    const contract = getViewerContract(providerOrSigner);
    return contract.getTotalSInvSupply();
};

export const getTotalInvStaked = async (providerOrSigner: Provider | JsonRpcSigner): Promise<number> => {
    const contract = getViewerContract(providerOrSigner);
    return contract.getTotalInvStaked();
};

export const xinvExchangeRate = async (providerOrSigner: Provider | JsonRpcSigner): Promise<number> => {
    const contract = getViewerContract(providerOrSigner);
    return contract.xinvExchangeRate();
};