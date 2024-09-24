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

export const getMarketsData = async (providerOrSigner: Provider | JsonRpcSigner): Promise<MarketData[]> => {
    const contract = getViewerContract(providerOrSigner);
    return contract.getMarketsData();
};