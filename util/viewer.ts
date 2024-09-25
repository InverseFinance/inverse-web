import { VIEWER_CONTRACT_ADDRESS } from "@app/config/constants";
import { VIEWER_ABI } from "@app/config/viewer-abi";
import { JsonRpcSigner, Provider } from "@ethersproject/providers";
import { BigNumber, Contract } from "ethers";
import { getBnToNumber } from "./markets";

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

type MarketDataFormatted = {
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

type MarketDataRaw = {
    collateral: string;
    oracleFeed: string;
    decimals: BigNumber;
    collateralSymbol: string;
    collateralName: string;
    totalDebt: BigNumber;
    price: BigNumber;
    leftToBorrow: BigNumber;
    dailyLimit: BigNumber;
    dailyBorrows: BigNumber;
    liquidity: BigNumber;
    minDebt: BigNumber;
    collateralFactorBps: BigNumber;
    liquidationFactorBps: BigNumber;
    liquidationFeeBps: BigNumber;
    liquidationIncentiveBps: BigNumber;
    replenishmentIncentiveBps: BigNumber;
    borrowCeiling: BigNumber;
    isPaused: boolean;
};

type MarketData<T extends boolean> = T extends true ? MarketDataFormatted : MarketDataRaw;

type AccountAndMarketBreakdown = {
    market: MarketData;
    account: AccountDebtData;
    position: PositionData;
};

type AccountListAndMarketListBreakdown = {
    markets: MarketData[];
    marketPositions: PositionData[][];
    accountsDebtData: AccountDebtData[];
    tvl: number;
    debt: number;
}

type AccountListAndMarketBreakdown = {
    market: MarketData;
    marketPositions: PositionData[][];
    accountsDebtData: AccountDebtData[];
    tvl: number;
    debt: number;
}

type AccountAndMarketListBreakdown = {
    markets: MarketData[];
    marketPositions: PositionData[][];
    accountDebtData: AccountDebtData;
    tvl: number;
    debt: number;
}

type PriceData = {
    dolaPrice: number;
    dbrPrice: number;
    dbrPriceInDola: number;
    dbrPriceInInv: number;
    invPrice: number;
}

const autoFormatValue = (value: any, key = '') => {
    if (BigNumber.isBigNumber(value)) {
        return /Bps$/.test(key) ? getBnToNumber(value, 4) : /timestamp/.test(key) ? getBnToNumber(value, 0) : getBnToNumber(value);
    }
    return value;
}

const formatBps = (value: BigNumber) => {
    return getBnToNumber(value, 4);
}

const formatAccountListAndMarketListBreakdown = (accountListAndMarketListBreakdown: AccountListAndMarketListBreakdown) => {
    return {
        markets: accountListAndMarketListBreakdown.markets.map(formatMarketData),
        marketPositions: accountListAndMarketListBreakdown.marketPositions.map(positions => positions.map(formatPositionData)),
        accountsDebtData: accountListAndMarketListBreakdown.accountsDebtData.map(formatAccountDebtData),
        tvl: getBnToNumber(accountListAndMarketListBreakdown.tvl),
        debt: getBnToNumber(accountListAndMarketListBreakdown.debt),
    }
}

const formatAccountListAndMarketBreakdown = (accountListAndMarketBreakdown: AccountListAndMarketBreakdown) => {
    return {
        market: formatMarketData(accountListAndMarketBreakdown.market),
        marketPositions: accountListAndMarketBreakdown.marketPositions.map(positions => positions.map(formatPositionData)),
        accountsDebtData: accountListAndMarketBreakdown.accountsDebtData.map(formatAccountDebtData),
        tvl: getBnToNumber(accountListAndMarketBreakdown.tvl),
        debt: getBnToNumber(accountListAndMarketBreakdown.debt),
    }
}

const formatAccountAndMarketListBreakdown = (accountListAndMarketBreakdown: AccountAndMarketListBreakdown) => {
    return {
        market: formatMarketData(accountListAndMarketBreakdown.market),
        marketPositions: accountListAndMarketBreakdown.marketPositions.map(positions => positions.map(formatPositionData)),
        accountsDebtData: accountListAndMarketBreakdown.accountsDebtData.map(formatAccountDebtData),
        tvl: getBnToNumber(accountListAndMarketBreakdown.tvl),
        debt: getBnToNumber(accountListAndMarketBreakdown.debt),
    }
}

const formatMarketData = (market: MarketData) => {
    return {
        collateral: market.collateral,
        oracleFeed: market.oracleFeed,
        collateralSymbol: market.collateralSymbol,
        collateralName: market.collateralName,
        decimals: getBnToNumber(market.decimals, 0),
        totalDebt: getBnToNumber(market.totalDebt),
        leftToBorrow: getBnToNumber(market.leftToBorrow),
        dailyLimit: getBnToNumber(market.dailyLimit),
        dailyBorrows: getBnToNumber(market.dailyBorrows),
        liquidity: getBnToNumber(market.liquidity),
        minDebt: getBnToNumber(market.minDebt),
        collateralFactor: formatBps(market.collateralFactorBps),
        liquidationFactor: formatBps(market.liquidationFactorBps),
        liquidationFee: formatBps(market.liquidationFeeBps),
        liquidationIncentive: formatBps(market.liquidationIncentiveBps),
        replenishmentIncentive: formatBps(market.replenishmentIncentiveBps),
        borrowCeiling: getBnToNumber(market.borrowCeiling),
        isPaused: market.isPaused,
    }
}

const formatInvBalances = (balances: AccountInvBalancesBreakdown) => {
    return {
        inv: getBnToNumber(balances.inv),
        xinv: getBnToNumber(balances.xinv),
        firm: getBnToNumber(balances.firm),
        sInvV1: getBnToNumber(balances.sInvV1),
        sInvV2: getBnToNumber(balances.sInvV2),
        sInv: getBnToNumber(balances.sInv),
        totalStaked: getBnToNumber(balances.totalStaked),
        totalInv: getBnToNumber(balances.totalInv),
    }
}

const formatAccountGovernance = (governance: AccountGovernanceBreakdown) => {
    return {
        invDelegate: governance.invDelegate,
        xInvDelegate: governance.xInvDelegate,
        firmDelegate: governance.firmDelegate,
        invVotes: getBnToNumber(governance.invVotes),
        xInvVotes: getBnToNumber(governance.xInvVotes),
        totalVotes: getBnToNumber(governance.totalVotes),
    }
}

const formatPositionData = (position: PositionData, decimals = 18) => {
    return {
        ...position,
        balance: getBnToNumber(position.balance, decimals),
        debt: getBnToNumber(position.debt),
        collateralValue: getBnToNumber(position.collateralValue),
        creditLimit: getBnToNumber(position.creditLimit),
        creditLeft: getBnToNumber(position.creditLeft),
        withdrawalLimit: getBnToNumber(position.withdrawalLimit, decimals),
        borrowLimit: getBnToNumber(position.borrowLimit),
        liquidationPrice: getBnToNumber(position.liquidationPrice),
        monthlyBurn: getBnToNumber(position.monthlyBurn),
    }
}

const formatPricesData = (prices: PriceData) => {
    return {
        ...prices,
        dolaPrice: getBnToNumber(prices.dolaPrice),
        dbrPrice: getBnToNumber(prices.dbrPrice),
        dbrPriceInDola: getBnToNumber(prices.dbrPriceInDola),
        dbrPriceInInv: getBnToNumber(prices.dbrPriceInInv),
        invPrice: getBnToNumber(prices.invPrice),
    }
}

const formatAccountInvBreakdown = (invBreakdown: AccountInvBreakdown) => {
    return {
        balances: formatInvBalances(invBreakdown.balances),
        governance: formatAccountGovernance(invBreakdown.governance),
    }
}

const formatAccountAndMarketBreakdown = (accountAndMarketBreakdown: AccountAndMarketBreakdown) => {
    return {
        market: formatMarketData(accountAndMarketBreakdown.market),
        account: formatAccountDebtData(accountAndMarketBreakdown.account),
        position: formatPositionData(accountAndMarketBreakdown.position),
    }
}

const formatAccountDebtData = (account: AccountDebtData) => {
    return {
        ...account,
        totalDebt: getBnToNumber(account.totalDebt),
        dbrBalance: getBnToNumber(account.dbrBalance),
        dolaBalance: getBnToNumber(account.dolaBalance),
        depletionTimestamp: getBnToNumber(account.depletionTimestamp, 0) * 1000,
        monthlyBurn: getBnToNumber(account.monthlyBurn),
    }
}

export const inverseViewer = <T extends boolean>(providerOrSigner: Provider | JsonRpcSigner, format: T) => {
    const contract = new Contract(VIEWER_CONTRACT_ADDRESS, VIEWER_ABI, providerOrSigner);
    return {
        contract,
        firm: {
            getMarketBreakdownForAccountList: (market: string, accounts: string[]) => contract.getMarketBreakdownForAccountList(market, accounts).then(data => format ? formatAccountListAndMarketBreakdown(data) : data),
            getMarketAndAccountBreakdown: (market: string, account: string) => contract.getMarketAndAccountBreakdown(market, account).then(data => format ? formatAccountAndMarketBreakdown(data) : data),
            getMarketListAndAccountListBreakdown: (markets: string[], accounts: string[]) => contract.getMarketListAndAccountListBreakdown(markets, accounts).then(data => format ? formatAccountListAndMarketListBreakdown(data) : data),
            getMarketListBreakdownForAccount: (markets: string[], account: string) => contract.getMarketListBreakdownForAccount(markets, account).then(data => format ? formatAccountAndMarketListBreakdown(data) : data),
            getAccountDebtData: (account: string) => contract.getAccountDebtData(account).then(data => format ? formatAccountDebtData(data) : data),
            getAccountInvBreakdown: (account: string) => contract.getAccountInvBreakdown(account).then(data => format ? formatAccountInvBreakdown(data) : data),
            getAccountPosition: (market: string, account: string) => contract.getAccountPosition(market, account).then(data => format ? formatPositionData(data) : data),
            getMarketData: (market: string): MarketData<T> => contract.getMarketData(market).then(data => format ? formatMarketData(data) : data),
            getMarketListData: (markets: string[]) => contract.getMarketListData(markets).then(data => format ? data.map(formatMarketData) : data),
            getAccountDbrClaimableRewards: (account: string) => contract.getAccountDbrClaimableRewards(account).then(data => format ? getBnToNumber(data) : data),
            getAccountFirmDelegate: (account: string) => contract.getAccountFirmDelegate(account),
            getAccountFirmStakedInv: (account: string) => contract.getAccountFirmStakedInv(account).then(data => format ? getBnToNumber(data) : data),
            getAccountListDebtData: (accounts: string[]) => contract.getAccountListDebtData(accounts).then(data => format ? data.map(formatAccountDebtData) : data),
            getAccountPositionsForMarketList: (markets: string[], account: string) => contract.getAccountPositionsForMarketList(markets, account).then(data => format ? data.map(formatPositionData) : data),
            getDepletionTimestamp: (account: string) => contract.getDepletionTimestamp(account).then(data => format ? getBnToNumber(data, 0) * 1000 : data),
        },
        inv: {
            getAccountAssetsInSInvV1: (account: string) => contract.getAccountAssetsInSInvV1(account).then(data => format ? getBnToNumber(data) : data),
            getAccountAssetsInSInvV2: (account: string) => contract.getAccountAssetsInSInvV2(account).then(data => format ? getBnToNumber(data) : data),
            getAccountFirmDelegate: (account: string) => contract.getAccountFirmDelegate(account),
            getAccountFirmStakedInv: (account: string) => contract.getAccountFirmStakedInv(account).then(data => format ? getBnToNumber(data) : data),
            getAccountFrontierStakedInv: (account: string) => contract.getAccountFrontierStakedInv(account).then(data => format ? getBnToNumber(data) : data),
            getAccountGovBreakdown: (account: string) => contract.getAccountGovBreakdown(account).then(data => format ? formatAccountGovernance(data) : data),
            getAccountInvBalancesBreakdown: (account: string) => contract.getAccountInvBalancesBreakdown(account).then(data => format ? formatInvBalances(data) : data),
            getAccountInvVotes: (account: string) => contract.getAccountInvVotes(account).then(data => format ? getBnToNumber(data) : data),
            getAccountTotalAssetsInSInvs: (account: string) => contract.getAccountTotalAssetsInSInvs(account).then(data => format ? getBnToNumber(data) : data),
            getAccountTotalInv: (account: string) => contract.getAccountTotalInv(account).then(data => format ? getBnToNumber(data) : data),
            getAccountTotalStakedInv: (account: string) => contract.getAccountTotalStakedInv(account).then(data => format ? getBnToNumber(data) : data),
            getAccountTotalVotes: (account: string) => contract.getAccountTotalVotes(account).then(data => format ? getBnToNumber(data) : data),
            getAccountVotesAtProposalStart: (account: string, proposalId: number) => contract.getAccountVotesAtProposalStart(account, proposalId).then(data => format ? getBnToNumber(data) : data),
            getAccountXinvVotes: (account: string) => contract.getAccountXinvVotes(account).then(data => format ? getBnToNumber(data) : data),
            getTotalInvStaked: (account: string) => contract.getTotalInvStaked(account).then(data => format ? getBnToNumber(data) : data),
            getTotalSInvAssets: (account: string) => contract.getTotalSInvAssets(account).then(data => format ? getBnToNumber(data) : data),
            getTotalSInvSupply: (account: string) => contract.getTotalSInvSupply(account).then(data => format ? getBnToNumber(data) : data),
            xinvExchangeRate: () => contract.xinvExchangeRate().then(data => format ? getBnToNumber(data) : data),
        },
        prices: {
            getDbrPrice: () => contract.getDbrPrice().then(data => format ? getBnToNumber(data) : data),
            getDbrPriceInDola: () => contract.getDbrPriceInDola().then(data => format ? getBnToNumber(data) : data),
            getDbrPriceInInv: () => contract.getDbrPriceInInv().then(data => format ? getBnToNumber(data) : data),
            getDolaPrice: () => contract.getDolaPrice().then(data => format ? getBnToNumber(data) : data),
            getInvOraclePrice: () => contract.getInvOraclePrice().then(data => format ? getBnToNumber(data) : data),
            getInvPrice: () => contract.getInvPrice().then(data => format ? getBnToNumber(data) : data),
            getInverseTokensPrices: () => contract.getInverseTokensPrices().then(data => format ? formatPricesData(data) : data),
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

export const getMarketAndAccountBreakdown = async (providerOrSigner: Provider | JsonRpcSigner, market: string, account: string): Promise<AccountAndMarketBreakdown> => {
    const contract = getViewerContract(providerOrSigner);
    return contract.getMarketAndAccountBreakdown(market, account);
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