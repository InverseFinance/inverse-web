import { VIEWER_CONTRACT_ADDRESS } from "@app/config/constants";
import { VIEWER_ABI } from "@app/config/viewer-abi";
import { JsonRpcSigner, Provider } from "@ethersproject/providers";
import { BigNumber, Contract } from "ethers";
import { getBnToNumber } from "./markets";

type BigNumberOrNumber<T extends boolean> = T extends true ? number : BigNumber;
type NumberOrUndefined<T extends boolean> = T extends true ? number : undefined;
type BigNumberOrUndefined<T extends boolean> = T extends true ? undefined : BigNumber;

export type MarketData<T extends boolean> = {
    market: string;
    collateral: string;
    oracleFeed: string;
    decimals: BigNumberOrNumber<T>;
    collateralSymbol: string;
    collateralName: string;
    totalDebt: BigNumberOrNumber<T>;
    price: BigNumberOrNumber<T>;
    leftToBorrow: BigNumberOrNumber<T>;
    dailyLimit: BigNumberOrNumber<T>;
    dailyBorrows: BigNumberOrNumber<T>;
    liquidity: BigNumberOrNumber<T>;
    minDebt: BigNumberOrNumber<T>;
    collateralFactorBps: BigNumberOrUndefined<T>;
    liquidationFactorBps: BigNumberOrUndefined<T>;
    liquidationFeeBps: BigNumberOrUndefined<T>;
    liquidationIncentiveBps: BigNumberOrUndefined<T>;
    replenishmentIncentiveBps: BigNumberOrUndefined<T>;
    collateralFactor: NumberOrUndefined<T>;
    liquidationFactor: NumberOrUndefined<T>;
    liquidationFee: NumberOrUndefined<T>;
    liquidationIncentive: NumberOrUndefined<T>;
    replenishmentIncentive: NumberOrUndefined<T>;
    borrowCeiling: BigNumberOrNumber<T>;
    isPaused: boolean;
};

export type AccountDebtData<T extends boolean> = {
    totalDebt: BigNumberOrNumber<T>;
    dbrBalance: BigNumberOrNumber<T>;
    dolaBalance: BigNumberOrNumber<T>;
    depletionTimestamp: BigNumberOrNumber<T>;
    monthlyBurn: BigNumberOrNumber<T>;
};

export type AccountGovernanceBreakdown<T extends boolean> = {
    invDelegate: string;
    xInvDelegate: string;
    firmDelegate: string;
    invVotes: BigNumberOrNumber<T>;
    xInvVotes: BigNumberOrNumber<T>;
    totalVotes: BigNumberOrNumber<T>;
};

export type AccountInvBalancesBreakdown<T extends boolean> = {
    inv: BigNumberOrNumber<T>;
    xinv: BigNumberOrNumber<T>;
    firm: BigNumberOrNumber<T>;
    sInvV1: BigNumberOrNumber<T>;
    sInvV2: BigNumberOrNumber<T>;
    sInv: BigNumberOrNumber<T>;
    totalStaked: BigNumberOrNumber<T>;
    totalInv: BigNumberOrNumber<T>;
};

export type AccountInvBreakdown<T extends boolean> = {
    balances: AccountInvBalancesBreakdown<T>;
    governance: AccountGovernanceBreakdown<T>;
};

export type PositionData<T extends boolean> = {
    escrow: string;
    market: string;
    account: string;
    balance: BigNumberOrNumber<T>;
    debt: BigNumberOrNumber<T>;
    collateralValue: BigNumberOrNumber<T>;
    creditLimit: BigNumberOrNumber<T>;
    creditLeft: BigNumberOrNumber<T>;
    withdrawalLimit: BigNumberOrNumber<T>;
    borrowLimit: BigNumberOrNumber<T>;
    liquidationPrice: BigNumberOrNumber<T>;
    monthlyBurn: BigNumberOrNumber<T>;
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
    tvl: BigNumberOrNumber<T>;
    debt: BigNumberOrNumber<T>;
}

export type AccountListAndMarketBreakdown<T extends boolean> = {
    market: MarketData<T>;
    positions: PositionData<T>[];
    accountsDebtData: AccountDebtData<T>[];
    tvl: BigNumberOrNumber<T>;
    debt: BigNumberOrNumber<T>;
}

export type AccountAndMarketListBreakdown<T extends boolean> = {
    markets: MarketData<T>[];
    positions: PositionData<T>[];
    accountDebtData: AccountDebtData<T>;
    tvl: BigNumberOrNumber<T>;
    debt: BigNumberOrNumber<T>;
}

export type PriceData<T extends boolean> = {
    dolaPrice: BigNumberOrNumber<T>;
    dbrPrice: BigNumberOrNumber<T>;
    dbrPriceInDola: BigNumberOrNumber<T>;
    dbrPriceInInv: BigNumberOrNumber<T>;
    invPrice: BigNumberOrNumber<T>;
}

export type DbrDistributorData<T extends boolean> = {
    rewardRate: BigNumberOrNumber<T>;
    invStaked: BigNumberOrNumber<T>;
    yearlyRewardRate: BigNumberOrNumber<T>;
    dbrApr: BigNumberOrNumber<T>;
    dbrInvExRate: BigNumberOrNumber<T>;
}

export type InvDbrAprsData<T extends boolean> = {
    invApr: BigNumberOrNumber<T>;
    dbrApr: BigNumberOrNumber<T>;
}

export type InverseViewer<T extends boolean> = {
    contract: Contract,
    firm: {
        getAccountDebtData: (account: string) => Promise<AccountDebtData<T>>,        
        getAccountPosition: (market: string, account: string) => Promise<PositionData<T>>,
        getMarketData: (market: string) => Promise<MarketData<T>>,
        getMarketListData: (markets: string[]) => Promise<MarketData<T>[]>,
        getAccountDbrClaimableRewards: (account: string) => Promise<BigNumberOrNumber<T>>,
        getAccountFirmDelegate: (account: string) => Promise<string>,
        getAccountFirmStakedInv: (account: string) => Promise<BigNumberOrNumber<T>>,
        getAccountListDebtData: (accounts: string[]) => Promise<AccountDebtData<T>[]>,
        getAccountPositionsForMarketList: (markets: string[], account: string) => Promise<PositionData<T>[]>,
        getDepletionTimestamp: (account: string) => Promise<BigNumberOrNumber<T>>,
        getMarketAndAccountBreakdown: (market: string, account: string) => Promise<AccountAndMarketBreakdown<T>>,
        getMarketBreakdownForAccountList: (market: string, accounts: string[]) => Promise<AccountListAndMarketBreakdown<T>>,
        getMarketListAndAccountListBreakdown: (markets: string[], accounts: string[]) => Promise<AccountListAndMarketListBreakdown<T>>,
        getMarketListForAccountBreakdown: (markets: string[], account: string) => Promise<AccountAndMarketListBreakdown<T>>,
        getInvApr: () => Promise<BigNumberOrNumber<T>>,
        getDbrApr: () => Promise<BigNumberOrNumber<T>>,
        getInvDbrAprs: () => Promise<InvDbrAprsData<T>>,
    },
    tokens: {
        getAccountAssetsInSInvV1: (account: string) => Promise<BigNumberOrNumber<T>>,
        getAccountAssetsInSInvV2: (account: string) => Promise<BigNumberOrNumber<T>>,
        getAccountFirmDelegate: (account: string) => Promise<string>,
        getAccountFirmStakedInv: (account: string) => Promise<BigNumberOrNumber<T>>,
        getAccountFrontierStakedInv: (account: string) => Promise<BigNumberOrNumber<T>>,
        getAccountInvBreakdown: (account: string) => Promise<AccountInvBreakdown<T>>,
        getAccountGovBreakdown: (account: string) => Promise<AccountGovernanceBreakdown<T>>,
        getAccountInvBalancesBreakdown: (account: string) => Promise<AccountInvBalancesBreakdown<T>>,
        getAccountInvVotes: (account: string) => Promise<BigNumberOrNumber<T>>,
        getAccountTotalAssetsInSInvs: (account: string) => Promise<BigNumberOrNumber<T>>,
        getAccountTotalInv: (account: string) => Promise<BigNumberOrNumber<T>>,
        getAccountTotalStakedInv: (account: string) => Promise<BigNumberOrNumber<T>>,
        getAccountTotalVotes: (account: string) => Promise<BigNumberOrNumber<T>>,
        getAccountVotesAtProposalStart: (account: string, proposalId: number) => Promise<BigNumberOrNumber<T>>,
        getAccountXinvVotes: (account: string) => Promise<BigNumberOrNumber<T>>,
        getTotalInvStaked: (account: string) => Promise<BigNumberOrNumber<T>>,
        getTotalSInvAssets: (account: string) => Promise<BigNumberOrNumber<T>>,
        getTotalSInvSupply: (account: string) => Promise<BigNumberOrNumber<T>>,
        xinvExchangeRate: () => Promise<BigNumberOrNumber<T>>,
        getDbrPrice: () => Promise<BigNumberOrNumber<T>>,
        getDbrPriceInDola: () => Promise<BigNumberOrNumber<T>>,
        getDbrPriceInInv: () => Promise<BigNumberOrNumber<T>>,
        getDolaPrice: () => Promise<BigNumberOrNumber<T>>,
        getInvOraclePrice: () => Promise<BigNumberOrNumber<T>>,
        getInvPrice: () => Promise<BigNumberOrNumber<T>>,
        getInverseTokensPrices: () => Promise<PriceData<T>>,
        getInvApr: () => Promise<BigNumberOrNumber<T>>,
        getDbrApr: () => Promise<BigNumberOrNumber<T>>,
        getInvDbrAprs: () => Promise<InvDbrAprsData<T>>,
    },
}

const formatBps = (value: bigint) => {
    return getBnToNumber(value, 4);
}

const formatAccountListAndMarketListBreakdown = (accountListAndMarketListBreakdown: AccountListAndMarketListBreakdown<false>): AccountListAndMarketListBreakdown<true> => {
    const markets = accountListAndMarketListBreakdown.markets.map(formatMarketData);
    return {
        markets,
        marketListPositions: accountListAndMarketListBreakdown.marketListPositions.map((marketPositions, index) => marketPositions.map(p => formatPositionData(p, markets[index].decimals))),
        accountsDebtData: accountListAndMarketListBreakdown.accountsDebtData.map(formatAccountDebtData),
        tvl: getBnToNumber(accountListAndMarketListBreakdown.tvl),
        debt: getBnToNumber(accountListAndMarketListBreakdown.debt),
    }
}

const formatAccountListAndMarketBreakdown = (accountListAndMarketBreakdown: AccountListAndMarketBreakdown<false>): AccountListAndMarketBreakdown<true> => {
    const market = formatMarketData(accountListAndMarketBreakdown.market);
    return {
        market,
        positions: accountListAndMarketBreakdown.positions.map(p => formatPositionData(p, market.decimals.float)),
        accountsDebtData: accountListAndMarketBreakdown.accountsDebtData.map(formatAccountDebtData),
        tvl: getBnToNumber(accountListAndMarketBreakdown.tvl),
        debt: getBnToNumber(accountListAndMarketBreakdown.debt),
    }
}

export const formatAccountAndMarketListBreakdown = (accountListAndMarketBreakdown: AccountAndMarketListBreakdown<false>): AccountAndMarketListBreakdown<true> => {
    const markets = accountListAndMarketBreakdown.markets.map(formatMarketData);
    return {
        markets,
        positions: accountListAndMarketBreakdown.positions.map((p, index) => formatPositionData(p, markets[index].decimals.float)),
        accountDebtData: formatAccountDebtData(accountListAndMarketBreakdown.accountDebtData),
        tvl: getBnToNumber(accountListAndMarketBreakdown.tvl),
        // debt: getBnToNumber(accountListAndMarketBreakdown.debt),
    }
}

export const formatMarketData = (market: MarketData<false>): MarketData<true> => {
    const decimals = getBnToNumber(market.decimals, 0);
    return {
        market: market.market,
        collateral: market.collateral,
        oracleFeed: market.oracleFeed,
        collateralSymbol: market.collateralSymbol,
        collateralName: market.collateralName,
        decimals,
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
        price: getBnToNumber(market.price, (36 - decimals)),
        isPaused: market.isPaused,
    }
}

const formatInvBalances = (balances: AccountInvBalancesBreakdown<false>): AccountInvBalancesBreakdown<true> => {
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

const formatAccountGovernance = (governance: AccountGovernanceBreakdown<false>): AccountGovernanceBreakdown<true> => {
    return {
        invDelegate: governance.invDelegate,
        xInvDelegate: governance.xInvDelegate,
        firmDelegate: governance.firmDelegate,
        invVotes: getBnToNumber(governance.invVotes),
        xInvVotes: getBnToNumber(governance.xInvVotes),
        totalVotes: getBnToNumber(governance.totalVotes),
    }
}

const formatPositionData = (position: PositionData<false>, decimals = 18): PositionData<true> => {
    return {
        market: position.market,
        account: position.account,
        escrow: position.escrow,
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

export const formatPricesData = (prices: PriceData<false>): PriceData<true> => {
    return {
        dolaPrice: getBnToNumber(prices.dolaPrice),
        dbrPrice: getBnToNumber(prices.dbrPrice),
        dbrPriceInDola: getBnToNumber(prices.dbrPriceInDola),
        dbrPriceInInv: getBnToNumber(prices.dbrPriceInInv),
        invPrice: getBnToNumber(prices.invPrice),
    }
}

export const formatDistributorData = (distributorData: DbrDistributorData<false>): DbrDistributorData<true> => {
    return {
        rewardRate: getBnToNumber(distributorData.rewardRate),
        yearlyRewardRate: getBnToNumber(distributorData.yearlyRewardRate),
        dbrApr: getBnToNumber(distributorData.dbrApr),
        dbrInvExRate: getBnToNumber(distributorData.dbrInvExRate),
        invStaked: getBnToNumber(distributorData.invStaked),
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
        totalDebt: getBnToNumber(account.totalDebt),
        dbrBalance: getBnToNumber(account.dbrBalance),
        dolaBalance: getBnToNumber(account.dolaBalance),
        depletionTimestamp: getBnToNumber(account.depletionTimestamp, 0),
        monthlyBurn: getBnToNumber(account.monthlyBurn),
    }
}

export const formatInvDbrAprsData = (invDbrAprs: InvDbrAprsData<false>): InvDbrAprsData<true> => {
    return {
        invApr: getBnToNumber(invDbrAprs.invApr),
        dbrApr: getBnToNumber(invDbrAprs.dbrApr),
    }
}

export const inverseViewer = (providerOrSigner: Provider | JsonRpcSigner) => inverseViewerService(providerOrSigner, true);
export const inverseViewerRaw = (providerOrSigner: Provider | JsonRpcSigner) => inverseViewerService(providerOrSigner, false);

export const inverseViewerService = <T extends boolean>(providerOrSigner: Provider | JsonRpcSigner, format?: T): InverseViewer<T> => {
    const contract = new Contract(VIEWER_CONTRACT_ADDRESS, VIEWER_ABI, providerOrSigner);
    return {
        contract,
        firm: {
            getMarketBreakdownForAccountList: (market: string, accounts: string[]) => contract.getMarketBreakdownForAccountList(market, accounts).then(data => format ? formatAccountListAndMarketBreakdown(data) : data),
            getMarketAndAccountBreakdown: (market: string, account: string) => contract.getMarketAndAccountBreakdown(market, account).then(data => format ? formatAccountAndMarketBreakdown(data) : data),
            getMarketListAndAccountListBreakdown: (markets: string[], accounts: string[]) => contract.getMarketListAndAccountListBreakdown(markets, accounts).then(data => format ? formatAccountListAndMarketListBreakdown(data) : data),
            getMarketListForAccountBreakdown: (markets: string[], account: string) => contract.getMarketListForAccountBreakdown(markets, account).then(data => format ? formatAccountAndMarketListBreakdown(data) : data),
            getAccountDebtData: (account: string) => contract.getAccountDebtData(account).then(data => format ? formatAccountDebtData(data) : data),            
            getAccountPosition: (market: string, account: string, decimals?: number) => contract.getAccountPosition(market, account).then(data => format ? formatPositionData(data, decimals) : data),
            getMarketData: (market: string) => contract.getMarketData(market).then(data => format ? formatMarketData(data) : data),
            getMarketListData: (markets: string[]) => contract.getMarketListData(markets).then(data => format ? data.map(formatMarketData) : data),
            getAccountDbrClaimableRewards: (account: string) => contract.getAccountDbrClaimableRewards(account).then(data => format ? getBnToNumber(data) : data),
            getAccountFirmDelegate: (account: string) => contract.getAccountFirmDelegate(account),
            getAccountFirmStakedInv: (account: string) => contract.getAccountFirmStakedInv(account).then(data => format ? getBnToNumber(data) : data),
            getAccountListDebtData: (accounts: string[]) => contract.getAccountListDebtData(accounts).then(data => format ? data.map(formatAccountDebtData) : data),
            getAccountPositionsForMarketList: (markets: string[], account: string, decimals?: number[]) => contract.getAccountPositionsForMarketList(markets, account).then(data => format ? data.map((p, index) => formatPositionData(p, decimals[index])) : data),
            getDepletionTimestamp: (account: string) => contract.getDepletionTimestamp(account).then(data => format ? getBnToNumber(data, 0) * 1000 : data),
            getInvApr: () => contract.getInvApr().then(data => format ? getBnToNumber(data) : data),
            getDbrApr: () => contract.getDbrApr().then(data => format ? getBnToNumber(data) : data),
            getInvDbrAprs: () => contract.getInvDbrAprs().then(data => format ? formatInvDbrAprsData(data) : data),
        },
        tokens: {
            getAccountInvBreakdown: (account: string) => contract.getAccountInvBreakdown(account).then(data => format ? formatAccountInvBreakdown(data) : data),
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
            getDbrPrice: () => contract.getDbrPrice().then(data => format ? getBnToNumber(data) : data),
            getDbrPriceInDola: () => contract.getDbrPriceInDola().then(data => format ? getBnToNumber(data) : data),
            getDbrPriceInInv: () => contract.getDbrPriceInInv().then(data => format ? getBnToNumber(data) : data),
            getDolaPrice: () => contract.getDolaPrice().then(data => format ? getBnToNumber(data) : data),
            getInvOraclePrice: () => contract.getInvOraclePrice().then(data => format ? getBnToNumber(data) : data),
            getInvPrice: () => contract.getInvPrice().then(data => format ? getBnToNumber(data) : data),
            getInverseTokensPrices: () => contract.getInverseTokensPrices().then(data => format ? formatPricesData(data) : data),
            getInvApr: () => contract.getInvApr().then(data => format ? getBnToNumber(data) : data),
            getDbrApr: () => contract.getDbrApr().then(data => format ? getBnToNumber(data) : data),
            getInvDbrAprs: () => contract.getInvDbrAprs().then(data => format ? formatInvDbrAprsData(data) : data),
        },
    };
};

export const getViewerContract = (providerOrSigner: Provider | JsonRpcSigner) => {
    return new Contract(VIEWER_CONTRACT_ADDRESS, VIEWER_ABI, providerOrSigner);
};