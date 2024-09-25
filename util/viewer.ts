import { VIEWER_CONTRACT_ADDRESS } from "@app/config/constants";
import { VIEWER_ABI } from "@app/config/viewer-abi";
import { JsonRpcSigner, Provider } from "@ethersproject/providers";
import { BigNumber, Contract } from "ethers";
import { getBnToNumber } from "./markets";

type BigNumberOrNumber<T extends boolean> = T extends true ? number : BigNumber;

type MarketData<T extends boolean> = {
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
    collateralFactorBps: BigNumberOrNumber<T>;
    liquidationFactorBps: BigNumberOrNumber<T>;
    liquidationFeeBps: BigNumberOrNumber<T>;
    liquidationIncentiveBps: BigNumberOrNumber<T>;
    replenishmentIncentiveBps: BigNumberOrNumber<T>;
    borrowCeiling: BigNumberOrNumber<T>;
    isPaused: boolean;
};

type AccountDebtData<T extends boolean> = {
    totalDebt: BigNumberOrNumber<T>;
    dbrBalance: BigNumberOrNumber<T>;
    dolaBalance: BigNumberOrNumber<T>;
    depletionTimestamp: BigNumberOrNumber<T>;
    monthlyBurn: BigNumberOrNumber<T>;
};

type AccountGovernanceBreakdown<T extends boolean> = {
    invDelegate: string;
    xInvDelegate: string;
    firmDelegate: string;
    invVotes: BigNumberOrNumber<T>;
    xInvVotes: BigNumberOrNumber<T>;
    totalVotes: BigNumberOrNumber<T>;
};

type AccountInvBalancesBreakdown<T extends boolean> = {
    inv: BigNumberOrNumber<T>;
    xinv: BigNumberOrNumber<T>;
    firm: BigNumberOrNumber<T>;
    sInvV1: BigNumberOrNumber<T>;
    sInvV2: BigNumberOrNumber<T>;
    sInv: BigNumberOrNumber<T>;
    totalStaked: BigNumberOrNumber<T>;
    totalInv: BigNumberOrNumber<T>;
};

type AccountInvBreakdown<T extends boolean> = {
    balances: AccountInvBalancesBreakdown<T>;
    governance: AccountGovernanceBreakdown<T>;
};

type PositionData<T extends boolean> = {
    escrow: string;
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

type AccountAndMarketBreakdown<T extends boolean> = {
    market: MarketData<T>;
    account: AccountDebtData<T>;
    position: PositionData<T>;
};

type AccountListAndMarketListBreakdown<T extends boolean> = {
    markets: MarketData<T>[];
    marketListPositions: PositionData<T>[][];
    accountsDebtData: AccountDebtData<T>[];
    tvl: BigNumberOrNumber<T>;
    debt: BigNumberOrNumber<T>;
}

type AccountListAndMarketBreakdown<T extends boolean> = {
    market: MarketData<T>;
    positions: PositionData<T>[];
    accountsDebtData: AccountDebtData<T>[];
    tvl: BigNumberOrNumber<T>;
    debt: BigNumberOrNumber<T>;
}

type AccountAndMarketListBreakdown<T extends boolean> = {
    markets: MarketData<T>[];
    positions: PositionData<T>[];
    accountDebtData: AccountDebtData<T>;
    tvl: BigNumberOrNumber<T>;
    debt: BigNumberOrNumber<T>;
}

type PriceData<T extends boolean> = {
    dolaPrice: BigNumberOrNumber<T>;
    dbrPrice: BigNumberOrNumber<T>;
    dbrPriceInDola: BigNumberOrNumber<T>;
    dbrPriceInInv: BigNumberOrNumber<T>;
    invPrice: BigNumberOrNumber<T>;
}

type InverseViewer<T extends boolean> = {
    contract: Contract,
    firm: {
        getAccountDebtData: (account: string) => Promise<AccountDebtData<T>>,        
        getAccountPosition: (market: string, account: string) => Promise<PositionData<T>>,
        getMarketData: (market: string) => Promise<MarketData<T>>,
        getMarketListData: (markets: string[]) => Promise<MarketData<T>[]>,
        getAccountDbrClaimableRewards: (account: string) => Promise<number>,
        getAccountFirmDelegate: (account: string) => Promise<string>,
        getAccountFirmStakedInv: (account: string) => Promise<number>,
        getAccountListDebtData: (accounts: string[]) => Promise<AccountDebtData<T>[]>,
        getAccountPositionsForMarketList: (markets: string[], account: string) => Promise<PositionData<T>[]>,
        getDepletionTimestamp: (account: string) => Promise<number>,
        getMarketAndAccountBreakdown: (market: string, account: string) => Promise<AccountAndMarketBreakdown<T>>,
        getMarketBreakdownForAccountList: (market: string, accounts: string[]) => Promise<AccountListAndMarketBreakdown<T>>,
        getMarketListAndAccountListBreakdown: (markets: string[], accounts: string[]) => Promise<AccountListAndMarketListBreakdown<T>>,
        getMarketListBreakdownForAccount: (markets: string[], account: string) => Promise<AccountAndMarketListBreakdown<T>>,
    },
    inv: {
        getAccountAssetsInSInvV1: (account: string) => Promise<number>,
        getAccountAssetsInSInvV2: (account: string) => Promise<number>,
        getAccountFirmDelegate: (account: string) => Promise<string>,
        getAccountFirmStakedInv: (account: string) => Promise<number>,
        getAccountFrontierStakedInv: (account: string) => Promise<number>,
        getAccountInvBreakdown: (account: string) => Promise<AccountInvBreakdown<T>>,
        getAccountGovBreakdown: (account: string) => Promise<AccountGovernanceBreakdown<T>>,
        getAccountInvBalancesBreakdown: (account: string) => Promise<AccountInvBalancesBreakdown<T>>,
        getAccountInvVotes: (account: string) => Promise<number>,
        getAccountTotalAssetsInSInvs: (account: string) => Promise<number>,
        getAccountTotalInv: (account: string) => Promise<number>,
        getAccountTotalStakedInv: (account: string) => Promise<number>,
        getAccountTotalVotes: (account: string) => Promise<number>,
        getAccountVotesAtProposalStart: (account: string, proposalId: number) => Promise<number>,
        getAccountXinvVotes: (account: string) => Promise<number>,
        getTotalInvStaked: (account: string) => Promise<number>,
        getTotalSInvAssets: (account: string) => Promise<number>,
        getTotalSInvSupply: (account: string) => Promise<number>,
        xinvExchangeRate: () => Promise<number>,
    },
    prices: {
        getDbrPrice: () => Promise<number>,
        getDbrPriceInDola: () => Promise<number>,
        getDbrPriceInInv: () => Promise<number>,
        getDolaPrice: () => Promise<number>,
        getInvOraclePrice: () => Promise<number>,
        getInvPrice: () => Promise<number>,
        getInverseTokensPrices: () => Promise<PriceData<T>>,
    }
}

const formatBps = (value: BigNumber) => {
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
        positions: accountListAndMarketBreakdown.positions.map(p => formatPositionData(p, market.decimals)),
        accountsDebtData: accountListAndMarketBreakdown.accountsDebtData.map(formatAccountDebtData),
        tvl: getBnToNumber(accountListAndMarketBreakdown.tvl),
        debt: getBnToNumber(accountListAndMarketBreakdown.debt),
    }
}

const formatAccountAndMarketListBreakdown = (accountListAndMarketBreakdown: AccountAndMarketListBreakdown<false>): AccountAndMarketListBreakdown<true> => {
    const markets = accountListAndMarketBreakdown.markets.map(formatMarketData);
    return {
        markets,
        positions: accountListAndMarketBreakdown.positions.map((p, index) => formatPositionData(p, markets[index].decimals)),
        accountDebtData: formatAccountDebtData(accountListAndMarketBreakdown.accountDebtData),
        tvl: getBnToNumber(accountListAndMarketBreakdown.tvl),
        debt: getBnToNumber(accountListAndMarketBreakdown.debt),
    }
}

const formatMarketData = (market: MarketData<false>): MarketData<true> => {
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
        collateralFactorBps: formatBps(market.collateralFactorBps),
        liquidationFactorBps: formatBps(market.liquidationFactorBps),
        liquidationFeeBps: formatBps(market.liquidationFeeBps),
        liquidationIncentiveBps: formatBps(market.liquidationIncentiveBps),
        replenishmentIncentiveBps: formatBps(market.replenishmentIncentiveBps),
        borrowCeiling: getBnToNumber(market.borrowCeiling),
        price: getBnToNumber(market.price),
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

const formatPricesData = (prices: PriceData<false>): PriceData<true> => {
    return {
        dolaPrice: getBnToNumber(prices.dolaPrice),
        dbrPrice: getBnToNumber(prices.dbrPrice),
        dbrPriceInDola: getBnToNumber(prices.dbrPriceInDola),
        dbrPriceInInv: getBnToNumber(prices.dbrPriceInInv),
        invPrice: getBnToNumber(prices.invPrice),
    }
}

const formatAccountInvBreakdown = (invBreakdown: AccountInvBreakdown<false>): AccountInvBreakdown<true> => {
    return {
        balances: formatInvBalances(invBreakdown.balances),
        governance: formatAccountGovernance(invBreakdown.governance),
    }
}

const formatAccountAndMarketBreakdown = (accountAndMarketBreakdown: AccountAndMarketBreakdown<false>): AccountAndMarketBreakdown<true> => {
    const market = formatMarketData(accountAndMarketBreakdown.market);
    return {
        market,
        account: formatAccountDebtData(accountAndMarketBreakdown.account),
        position: formatPositionData(accountAndMarketBreakdown.position, market.decimals),
    }
}

const formatAccountDebtData = (account: AccountDebtData<false>): AccountDebtData<true> => {
    return {
        totalDebt: getBnToNumber(account.totalDebt),
        dbrBalance: getBnToNumber(account.dbrBalance),
        dolaBalance: getBnToNumber(account.dolaBalance),
        depletionTimestamp: getBnToNumber(account.depletionTimestamp, 0) * 1000,
        monthlyBurn: getBnToNumber(account.monthlyBurn),
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
            getMarketListBreakdownForAccount: (markets: string[], account: string) => contract.getMarketListBreakdownForAccount(markets, account).then(data => format ? formatAccountAndMarketListBreakdown(data) : data),
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
        },
        inv: {
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