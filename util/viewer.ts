import { TOKENS_VIEWER, FIRM_VIEWER } from "@app/config/constants";
import { VIEWER_ABI } from "@app/config/viewer-abi";
import { JsonRpcSigner, Provider } from "@ethersproject/providers";
import { BigNumber, Contract } from "ethers";
import { getBnToNumber } from "./markets";

const bigFormatter = getBnToNumber;

const formatBps = (value: BigType) => {
    return bigFormatter(value, 4);
}

type BigType = BigNumber;

type FormattedBigType = number;

type BigOrNot<T extends boolean> = T extends true ? FormattedBigType : BigType;

type FormattedOrUndefined<T extends boolean> = T extends true ? FormattedBigType : undefined;
type BigOrUndefined<T extends boolean> = T extends true ? undefined : BigType;

export type MarketData<T extends boolean> = {
    market: string;
    collateral: string;
    oracle: string;
    borrowController: string;
    oracleFeed: string;
    decimals: BigOrNot<T>;
    collateralSymbol: string;
    collateralName: string;
    totalDebt: BigOrNot<T>;
    price: BigOrNot<T>;
    leftToBorrow: BigOrNot<T>;
    dailyLimit: BigOrNot<T>;
    dailyBorrows: BigOrNot<T>;
    dolaLiquidity: BigOrNot<T>;
    minDebt: BigOrNot<T>;
    collateralFactorBps: BigOrUndefined<T>;
    liquidationFactorBps: BigOrUndefined<T>;
    liquidationFeeBps: BigOrUndefined<T>;
    liquidationIncentiveBps: BigOrUndefined<T>;
    replenishmentIncentiveBps: BigOrUndefined<T>;
    collateralFactor: FormattedOrUndefined<T>;
    liquidationFactor: FormattedOrUndefined<T>;
    liquidationFee: FormattedOrUndefined<T>;
    liquidationIncentive: FormattedOrUndefined<T>;
    replenishmentIncentive: FormattedOrUndefined<T>;
    ceiling: BigOrNot<T>;
    borrowPaused: boolean;
};

export type AccountDebtData<T extends boolean> = {
    totalDebt: BigOrNot<T>;
    dbrBalance: BigOrNot<T>;
    dolaBalance: BigOrNot<T>;
    depletionTimestamp: BigOrNot<T>;
    monthlyBurn: BigOrNot<T>;
};

export type AccountGovernanceBreakdown<T extends boolean> = {
    invDelegate: string;
    xInvDelegate: string;
    firmDelegate: string;
    invVotes: BigOrNot<T>;
    xInvVotes: BigOrNot<T>;
    totalVotes: BigOrNot<T>;
};

export type AccountInvBalancesBreakdown<T extends boolean> = {
    inv: BigOrNot<T>;
    xinv: BigOrNot<T>;
    firm: BigOrNot<T>;
    sInvV1: BigOrNot<T>;
    sInvV2: BigOrNot<T>;
    sInv: BigOrNot<T>;
    totalStaked: BigOrNot<T>;
    totalInv: BigOrNot<T>;
};

export type AccountInvBreakdown<T extends boolean> = {
    balances: AccountInvBalancesBreakdown<T>;
    governance: AccountGovernanceBreakdown<T>;
};

export type PositionData<T extends boolean> = {
    escrow: string;
    market: string;
    account: string;
    balance: BigOrNot<T>;
    debt: BigOrNot<T>;
    collateralValue: BigOrNot<T>;
    creditLimit: BigOrNot<T>;
    creditLeft: BigOrNot<T>;
    withdrawalLimit: BigOrNot<T>;
    borrowLimit: BigOrNot<T>;
    liquidationPrice: BigOrNot<T>;
    monthlyBurn: BigOrNot<T>;
};

export type AccountAndMarketBreakdown<T extends boolean> = {
    market: MarketData<T>;
    accountDebtData: AccountDebtData<T>;
    position: PositionData<T>;
};

export type AccountListAndMarketListBreakdown<T extends boolean> = {
    markets: MarketData<T>[];
    marketListPositions: PositionData<T>[][];
    accountsDebtData: AccountDebtData<T>[];
    tvl: BigOrNot<T>;
    debt: BigOrNot<T>;
}

export type AccountListAndMarketBreakdown<T extends boolean> = {
    market: MarketData<T>;
    positions: PositionData<T>[];
    accountsDebtData: AccountDebtData<T>[];
    tvl: BigOrNot<T>;
    debt: BigOrNot<T>;
}

export type AccountAndMarketListBreakdown<T extends boolean> = {
    markets: MarketData<T>[];
    positions: PositionData<T>[];
    accountDebtData: AccountDebtData<T>;
    tvl: BigOrNot<T>;
    debt: BigOrNot<T>;
}

export type PriceData<T extends boolean> = {
    dolaPrice: BigOrNot<T>;
    dbrPrice: BigOrNot<T>;
    dbrPriceInDola: BigOrNot<T>;
    dbrPriceInInv: BigOrNot<T>;
    invPrice: BigOrNot<T>;
}

export type DbrDistributorData<T extends boolean> = {
    rewardRate: BigOrNot<T>;
    invStaked: BigOrNot<T>;
    yearlyRewardRate: BigOrNot<T>;
    dbrApr: BigOrNot<T>;
    dbrInvExRate: BigOrNot<T>;
}

export type InvDbrAprsData<T extends boolean> = {
    invApr: BigOrNot<T>;
    dbrApr: BigOrNot<T>;
}

export type InverseViewer<T extends boolean> = {
    firmContract: Contract,
    tokensContract: Contract,
    firm: {
        getAccountDebtData: (account: string) => Promise<AccountDebtData<T>>,        
        getAccountPosition: (market: string, account: string) => Promise<PositionData<T>>,
        getMarketData: (market: string) => Promise<MarketData<T>>,
        getMarketListData: (markets: string[]) => Promise<MarketData<T>[]>,
        getAccountDbrClaimableRewards: (account: string) => Promise<BigOrNot<T>>,
        getAccountFirmDelegate: (account: string) => Promise<string>,
        getAccountFirmStakedInv: (account: string) => Promise<BigOrNot<T>>,
        getAccountListDebtData: (accounts: string[]) => Promise<AccountDebtData<T>[]>,
        getAccountPositionsForMarketList: (markets: string[], account: string) => Promise<PositionData<T>[]>,
        getDepletionTimestamp: (account: string) => Promise<BigOrNot<T>>,
        getMarketAndAccountBreakdown: (market: string, account: string) => Promise<AccountAndMarketBreakdown<T>>,
        getMarketBreakdownForAccountList: (market: string, accounts: string[]) => Promise<AccountListAndMarketBreakdown<T>>,
        getMarketListAndAccountListBreakdown: (markets: string[], accounts: string[]) => Promise<AccountListAndMarketListBreakdown<T>>,
        getMarketListForAccountBreakdown: (markets: string[], account: string) => Promise<AccountAndMarketListBreakdown<T>>,
        getInvApr: () => Promise<BigOrNot<T>>,
        getDbrApr: () => Promise<BigOrNot<T>>,
        getInvDbrAprs: () => Promise<InvDbrAprsData<T>>,
    },
    tokens: {
        getAccountAssetsInSInvV1: (account: string) => Promise<BigOrNot<T>>,
        getAccountAssetsInSInvV2: (account: string) => Promise<BigOrNot<T>>,
        getAccountFirmDelegate: (account: string) => Promise<string>,
        getAccountFirmStakedInv: (account: string) => Promise<BigOrNot<T>>,
        getAccountFrontierStakedInv: (account: string) => Promise<BigOrNot<T>>,
        getAccountInvBreakdown: (account: string) => Promise<AccountInvBreakdown<T>>,
        getAccountGovBreakdown: (account: string) => Promise<AccountGovernanceBreakdown<T>>,
        getAccountInvBalancesBreakdown: (account: string) => Promise<AccountInvBalancesBreakdown<T>>,
        getAccountInvVotes: (account: string) => Promise<BigOrNot<T>>,
        getAccountTotalAssetsInSInvs: (account: string) => Promise<BigOrNot<T>>,
        getAccountTotalInv: (account: string) => Promise<BigOrNot<T>>,
        getAccountTotalStakedInv: (account: string) => Promise<BigOrNot<T>>,
        getAccountTotalVotes: (account: string) => Promise<BigOrNot<T>>,
        getAccountVotesAtProposalStart: (account: string, proposalId: number) => Promise<BigOrNot<T>>,
        getAccountXinvVotes: (account: string) => Promise<BigOrNot<T>>,
        getTotalInvStaked: (account: string) => Promise<BigOrNot<T>>,
        getTotalSInvAssets: (account: string) => Promise<BigOrNot<T>>,
        getTotalSInvSupply: (account: string) => Promise<BigOrNot<T>>,
        xinvExchangeRate: () => Promise<BigOrNot<T>>,
        getDbrPrice: () => Promise<BigOrNot<T>>,
        getDbrPriceInDola: () => Promise<BigOrNot<T>>,
        getDbrPriceInInv: () => Promise<BigOrNot<T>>,
        getDolaPrice: () => Promise<BigOrNot<T>>,
        getInvOraclePrice: () => Promise<BigOrNot<T>>,
        getInvPrice: () => Promise<BigOrNot<T>>,
        getInverseTokensPrices: () => Promise<PriceData<T>>,
        getInvApr: () => Promise<BigOrNot<T>>,
        getDbrApr: () => Promise<BigOrNot<T>>,
        getInvDbrAprs: () => Promise<InvDbrAprsData<T>>,
    },
}

const formatAccountListAndMarketListBreakdown = (accountListAndMarketListBreakdown: AccountListAndMarketListBreakdown<false>): AccountListAndMarketListBreakdown<true> => {
    const markets = accountListAndMarketListBreakdown.markets.map(formatMarketData);
    return {
        markets,
        marketListPositions: accountListAndMarketListBreakdown.marketListPositions.map((marketPositions, index) => marketPositions.map(p => formatPositionData(p, markets[index].decimals))),
        accountsDebtData: accountListAndMarketListBreakdown.accountsDebtData.map(formatAccountDebtData),
        tvl: bigFormatter(accountListAndMarketListBreakdown.tvl),
        debt: bigFormatter(accountListAndMarketListBreakdown.debt),
    }
}

const formatAccountListAndMarketBreakdown = (accountListAndMarketBreakdown: AccountListAndMarketBreakdown<false>): AccountListAndMarketBreakdown<true> => {
    const market = formatMarketData(accountListAndMarketBreakdown.market);
    return {
        market,
        positions: accountListAndMarketBreakdown.positions.map(p => formatPositionData(p, market.decimals.float)),
        accountsDebtData: accountListAndMarketBreakdown.accountsDebtData.map(formatAccountDebtData),
        tvl: bigFormatter(accountListAndMarketBreakdown.tvl),
        debt: bigFormatter(accountListAndMarketBreakdown.debt),
    }
}

export const formatAccountAndMarketListBreakdown = (accountListAndMarketBreakdown: AccountAndMarketListBreakdown<false>): AccountAndMarketListBreakdown<true> => {
    const markets = accountListAndMarketBreakdown.markets.map(formatMarketData);
    return {
        markets,
        positions: accountListAndMarketBreakdown.positions.map((p, index) => formatPositionData(p, markets[index].decimals.float)),
        accountDebtData: formatAccountDebtData(accountListAndMarketBreakdown.accountDebtData),
        tvl: bigFormatter(accountListAndMarketBreakdown.tvl),
        // debt: bigFormatter(accountListAndMarketBreakdown.debt),
    }
}

export const formatMarketData = (market: MarketData<false>): MarketData<true> => {
    const decimals = bigFormatter(market.decimals, 0);
    return {
        market: market.market,
        collateral: market.collateral,
        oracle: market.oracle,
        oracleFeed: market.oracleFeed,
        borrowController: market.borrowController,
        collateralSymbol: market.collateralSymbol,
        collateralName: market.collateralName,
        decimals,
        totalDebt: bigFormatter(market.totalDebt),
        leftToBorrow: bigFormatter(market.leftToBorrow),
        dailyLimit: bigFormatter(market.dailyLimit),
        dailyBorrows: bigFormatter(market.dailyBorrows),
        dolaLiquidity: bigFormatter(market.dolaLiquidity),
        minDebt: bigFormatter(market.minDebt),
        collateralFactor: formatBps(market.collateralFactorBps),
        liquidationFactor: formatBps(market.liquidationFactorBps),
        liquidationFee: formatBps(market.liquidationFeeBps),
        liquidationIncentive: formatBps(market.liquidationIncentiveBps),
        replenishmentIncentive: formatBps(market.replenishmentIncentiveBps),
        ceiling: bigFormatter(market.ceiling),
        price: bigFormatter(market.price, (36 - decimals)),
        borrowPaused: market.borrowPaused,
    }
}

const formatInvBalances = (balances: AccountInvBalancesBreakdown<false>): AccountInvBalancesBreakdown<true> => {
    return {
        inv: bigFormatter(balances.inv),
        xinv: bigFormatter(balances.xinv),
        firm: bigFormatter(balances.firm),
        sInvV1: bigFormatter(balances.sInvV1),
        sInvV2: bigFormatter(balances.sInvV2),
        sInv: bigFormatter(balances.sInv),
        totalStaked: bigFormatter(balances.totalStaked),
        totalInv: bigFormatter(balances.totalInv),
    }
}

const formatAccountGovernance = (governance: AccountGovernanceBreakdown<false>): AccountGovernanceBreakdown<true> => {
    return {
        invDelegate: governance.invDelegate,
        xInvDelegate: governance.xInvDelegate,
        firmDelegate: governance.firmDelegate,
        invVotes: bigFormatter(governance.invVotes),
        xInvVotes: bigFormatter(governance.xInvVotes),
        totalVotes: bigFormatter(governance.totalVotes),
    }
}

const formatPositionData = (position: PositionData<false>, decimals = 18): PositionData<true> => {
    return {
        market: position.market,
        account: position.account,
        escrow: position.escrow,
        balance: bigFormatter(position.balance, decimals),
        debt: bigFormatter(position.debt),
        collateralValue: bigFormatter(position.collateralValue),
        creditLimit: bigFormatter(position.creditLimit),
        creditLeft: bigFormatter(position.creditLeft),
        withdrawalLimit: bigFormatter(position.withdrawalLimit, decimals),
        borrowLimit: bigFormatter(position.borrowLimit),
        liquidationPrice: bigFormatter(position.liquidationPrice),
        monthlyBurn: bigFormatter(position.monthlyBurn),
    }
}

export const formatPricesData = (prices: PriceData<false>): PriceData<true> => {
    return {
        dolaPrice: bigFormatter(prices.dolaPrice),
        dbrPrice: bigFormatter(prices.dbrPrice),
        dbrPriceInDola: bigFormatter(prices.dbrPriceInDola),
        dbrPriceInInv: bigFormatter(prices.dbrPriceInInv),
        invPrice: bigFormatter(prices.invPrice),
    }
}

export const formatDistributorData = (distributorData: DbrDistributorData<false>): DbrDistributorData<true> => {
    return {
        rewardRate: bigFormatter(distributorData.rewardRate),
        yearlyRewardRate: bigFormatter(distributorData.yearlyRewardRate),
        dbrApr: bigFormatter(distributorData.dbrApr),
        dbrInvExRate: bigFormatter(distributorData.dbrInvExRate),
        invStaked: bigFormatter(distributorData.invStaked),
    }
}

export const formatAccountInvBreakdown = (invBreakdown: AccountInvBreakdown<false>): AccountInvBreakdown<true> => {
    return {
        balances: formatInvBalances(invBreakdown.balances),
        governance: formatAccountGovernance(invBreakdown.governance),
    }
}

export const formatAccountAndMarketBreakdown = (accountAndMarketBreakdown: AccountAndMarketBreakdown<false>): AccountAndMarketBreakdown<true> => {
    const market = formatMarketData(accountAndMarketBreakdown.market);
    return {
        market,
        accountDebtData: formatAccountDebtData(accountAndMarketBreakdown.accountDebtData),
        position: formatPositionData(accountAndMarketBreakdown.position, market.decimals.float),
    }
}

export const formatAccountDebtData = (account: AccountDebtData<false>): AccountDebtData<true> => {
    return {
        totalDebt: bigFormatter(account.totalDebt),
        dbrBalance: bigFormatter(account.dbrBalance),
        dolaBalance: bigFormatter(account.dolaBalance),
        depletionTimestamp: bigFormatter(account.depletionTimestamp, 0),
        monthlyBurn: bigFormatter(account.monthlyBurn),
    }
}

export const formatInvDbrAprsData = (invDbrAprs: InvDbrAprsData<false>): InvDbrAprsData<true> => {
    return {
        invApr: bigFormatter(invDbrAprs.invApr),
        dbrApr: bigFormatter(invDbrAprs.dbrApr),
    }
}

export const inverseViewer = (providerOrSigner: Provider | JsonRpcSigner) => inverseViewerService(providerOrSigner, true);
export const inverseViewerRaw = (providerOrSigner: Provider | JsonRpcSigner) => inverseViewerService(providerOrSigner, false);

export const inverseViewerService = <T extends boolean>(providerOrSigner: Provider | JsonRpcSigner, format?: T): InverseViewer<T> => {
    const tokensContract = new Contract(TOKENS_VIEWER, VIEWER_ABI, providerOrSigner);
    const firmContract = new Contract(FIRM_VIEWER, VIEWER_ABI, providerOrSigner);
    return {        
        firmContract,
        tokensContract,
        firm: {
            getMarketBreakdownForAccountList: (market: string, accounts: string[]) => firmContract.getMarketBreakdownForAccountList(market, accounts).then(data => format ? formatAccountListAndMarketBreakdown(data) : data),
            getMarketAndAccountBreakdown: (market: string, account: string) => firmContract.getMarketAndAccountBreakdown(market, account).then(data => format ? formatAccountAndMarketBreakdown(data) : data),
            getMarketListAndAccountListBreakdown: (markets: string[], accounts: string[]) => firmContract.getMarketListAndAccountListBreakdown(markets, accounts).then(data => format ? formatAccountListAndMarketListBreakdown(data) : data),
            getMarketListForAccountBreakdown: (markets: string[], account: string) => firmContract.getMarketListForAccountBreakdown(markets, account).then(data => format ? formatAccountAndMarketListBreakdown(data) : data),
            getAccountDebtData: (account: string) => firmContract.getAccountDebtData(account).then(data => format ? formatAccountDebtData(data) : data),            
            getAccountPosition: (market: string, account: string, decimals?: number) => firmContract.getAccountPosition(market, account).then(data => format ? formatPositionData(data, decimals) : data),
            getMarketData: (market: string) => firmContract.getMarketData(market).then(data => format ? formatMarketData(data) : data),
            getMarketListData: (markets: string[]) => firmContract.getMarketListData(markets).then(data => format ? data.map(formatMarketData) : data),
            getAccountDbrClaimableRewards: (account: string) => firmContract.getAccountDbrClaimableRewards(account).then(data => format ? bigFormatter(data) : data),
            getAccountFirmDelegate: (account: string) => firmContract.getAccountFirmDelegate(account),
            getAccountFirmStakedInv: (account: string) => firmContract.getAccountFirmStakedInv(account).then(data => format ? bigFormatter(data) : data),
            getAccountListDebtData: (accounts: string[]) => firmContract.getAccountListDebtData(accounts).then(data => format ? data.map(formatAccountDebtData) : data),
            getAccountPositionsForMarketList: (markets: string[], account: string, decimals?: number[]) => firmContract.getAccountPositionsForMarketList(markets, account).then(data => format ? data.map((p, index) => formatPositionData(p, decimals[index])) : data),
            getDepletionTimestamp: (account: string) => firmContract.getDepletionTimestamp(account).then(data => format ? bigFormatter(data, 0) * 1000 : data),
            getInvApr: () => tokensContract.getInvApr().then(data => format ? bigFormatter(data) : data),
            getDbrApr: () => tokensContract.getDbrApr().then(data => format ? bigFormatter(data) : data),
            getInvDbrAprs: () => tokensContract.getInvDbrAprs().then(data => format ? formatInvDbrAprsData(data) : data),
        },
        tokens: {
            getAccountInvBreakdown: (account: string) => tokensContract.getAccountInvBreakdown(account).then(data => format ? formatAccountInvBreakdown(data) : data),
            getAccountAssetsInSInvV1: (account: string) => tokensContract.getAccountAssetsInSInvV1(account).then(data => format ? bigFormatter(data) : data),
            getAccountAssetsInSInvV2: (account: string) => tokensContract.getAccountAssetsInSInvV2(account).then(data => format ? bigFormatter(data) : data),
            getAccountFirmDelegate: (account: string) => tokensContract.getAccountFirmDelegate(account),
            getAccountFirmStakedInv: (account: string) => tokensContract.getAccountFirmStakedInv(account).then(data => format ? bigFormatter(data) : data),
            getAccountFrontierStakedInv: (account: string) => tokensContract.getAccountFrontierStakedInv(account).then(data => format ? bigFormatter(data) : data),
            getAccountGovBreakdown: (account: string) => tokensContract.getAccountGovBreakdown(account).then(data => format ? formatAccountGovernance(data) : data),
            getAccountInvBalancesBreakdown: (account: string) => tokensContract.getAccountInvBalancesBreakdown(account).then(data => format ? formatInvBalances(data) : data),
            getAccountInvVotes: (account: string) => tokensContract.getAccountInvVotes(account).then(data => format ? bigFormatter(data) : data),
            getAccountTotalAssetsInSInvs: (account: string) => tokensContract.getAccountTotalAssetsInSInvs(account).then(data => format ? bigFormatter(data) : data),
            getAccountTotalInv: (account: string) => tokensContract.getAccountTotalInv(account).then(data => format ? bigFormatter(data) : data),
            getAccountTotalStakedInv: (account: string) => tokensContract.getAccountTotalStakedInv(account).then(data => format ? bigFormatter(data) : data),
            getAccountTotalVotes: (account: string) => tokensContract.getAccountTotalVotes(account).then(data => format ? bigFormatter(data) : data),
            getAccountVotesAtProposalStart: (account: string, proposalId: number) => tokensContract.getAccountVotesAtProposalStart(account, proposalId).then(data => format ? bigFormatter(data) : data),
            getAccountXinvVotes: (account: string) => tokensContract.getAccountXinvVotes(account).then(data => format ? bigFormatter(data) : data),
            getTotalInvStaked: (account: string) => tokensContract.getTotalInvStaked(account).then(data => format ? bigFormatter(data) : data),
            getTotalSInvAssets: (account: string) => tokensContract.getTotalSInvAssets(account).then(data => format ? bigFormatter(data) : data),
            getTotalSInvSupply: (account: string) => tokensContract.getTotalSInvSupply(account).then(data => format ? bigFormatter(data) : data),
            xinvExchangeRate: () => tokensContract.xinvExchangeRate().then(data => format ? bigFormatter(data) : data),
            getDbrPrice: () => tokensContract.getDbrPrice().then(data => format ? bigFormatter(data) : data),
            getDbrPriceInDola: () => tokensContract.getDbrPriceInDola().then(data => format ? bigFormatter(data) : data),
            getDbrPriceInInv: () => tokensContract.getDbrPriceInInv().then(data => format ? bigFormatter(data) : data),
            getDolaPrice: () => tokensContract.getDolaPrice().then(data => format ? bigFormatter(data) : data),
            getInvOraclePrice: () => tokensContract.getInvOraclePrice().then(data => format ? bigFormatter(data) : data),
            getInvPrice: () => tokensContract.getInvPrice().then(data => format ? bigFormatter(data) : data),
            getInverseTokensPrices: () => tokensContract.getInverseTokensPrices().then(data => format ? formatPricesData(data) : data),
            getInvApr: () => tokensContract.getInvApr().then(data => format ? bigFormatter(data) : data),
            getDbrApr: () => tokensContract.getDbrApr().then(data => format ? bigFormatter(data) : data),
            getInvDbrAprs: () => tokensContract.getInvDbrAprs().then(data => format ? formatInvDbrAprsData(data) : data),
        },
    }
}