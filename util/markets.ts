import { CHAIN_TOKENS, TOKENS } from '@app/variables/tokens';
import { BigNumberList, Market, NetworkIds, TokenList } from '@app/types';
import { BigNumber, Contract } from 'ethers';
import { formatUnits, commify, isAddress, parseUnits, parseEther } from 'ethers/lib/utils';
import { ETH_MANTISSA, BLOCKS_PER_YEAR, DAYS_PER_YEAR, BLOCKS_PER_DAY, ONE_DAY_SECS, WEEKS_PER_YEAR, ONE_DAY_MS } from '@app/config/constants';

import { getAvgOnLastItems, getNextThursdayTimestamp, lowercaseObjectKeys, removeTrailingZeros, toFixed } from './misc';
import { getProvider } from './providers';
import { NETWORKS_BY_NAME } from '@app/config/networks';
import { fetchWithTimeout } from './web3';
import { getEnsoData } from './enso';

const DEFI_LLAMA_POOL_IDS = {
    STETH: '747c1d2a-c668-4682-b9f9-296708a3dd90',
    CVX_CRV: 'ef32dd3b-a03b-4f79-9b65-8420d7e04ad0',
    DSR: 'c8a24fee-ec00-4f38-86c0-9f6daebc4225',
    ST_CVX: '777032e6-e815-4f44-90b4-abb98f0f9632',
    CRVUSD_DOLA: 'e85c4caf-f504-4ffe-932d-b2054ac0e2bb',
    SUSDE_DOLA: '85407c01-6f16-4cef-9ef2-1b2bf2556183',
    FRAX_PYUSD_DOLA: '0ae6a3d1-5aed-460e-bfb7-bbd855f0bc21',
    FRAX_BP_DOLA: 'd05cb04d-f1e5-451d-95a2-6a3a9da001ad',
    SFRAX: '55de30c3-bf9f-4d4e-9e0b-536a8ef5ab35',
} as const;

const YEARN_VAULT_IDS = {
    YCRV: '0x27B5739e22ad9033bcBf192059122d163b60349D',
    CRVUSD_DOLA: '0xfb5137Aa9e079DB4b7C2929229caf503d0f6DA96',
    SUSDE_DOLA: '0x1Fc80CfCF5B345b904A0fB36d4222196Ed9eB8a5',
    FRAX_PYUSD_DOLA: '0xcC2EFb8bEdB6eD69ADeE0c3762470c38D4730C50',
    FRAX_BP_DOLA: '0xe5F625e8f4D2A038AE9583Da254945285E5a77a4',
} as const;

export const getDefiLlamaApy = async (poolId: string, strictAvg = true) => {
    try {
        const data = await getPoolYield(poolId, strictAvg);
        return { apy: (data?.apy || 0), apy30d: data?.apy30d, apy60d: data?.apy60d, apy90d: data?.apy90d, apy180d: data?.apy180d, apy365d: data?.apy365d };
    } catch (e) {
        console.log(`Failed to fetch APY for pool ${poolId}:`, e);
        return { apy: 0 };
    }
};

export const getMonthlyRate = (balance: number, apy: number) => {
    return (balance || 0) * (apy || 0) / 100 / 12;
}

export const getBnToNumber = (bn: BigNumber, decimals = 18) => {
    return bn ? parseFloat(formatUnits(bn, decimals)) : 0;
}

export const getNumberToBn = (num: number, decimals = 18) => {
    return num ? parseUnits(toFixed(num, decimals), decimals) : BigNumber.from('0');
}

export const getParsedBalance = (balances: BigNumberList, address: string, decimals = 18) => {
    return balances && balances[address] ? parseFloat(formatUnits(balances[address], decimals)) : 0;
}

export const getMarketMonthlyRate = (balances: BigNumberList, address: string, decimals = 18, apy: number) => {
    return getMonthlyRate(getParsedBalance(balances, address, decimals), apy);
}

export const getMarketMonthlyUsdRate = (balances: BigNumberList, address: string, decimals = 18, apy: number, priceUsd: number) => {
    return getMarketMonthlyRate(balances, address, decimals, apy) * priceUsd;
}

export const getMonthlyUsdRate = (balance: number, apy: number, priceUsd: number) => {
    return getMonthlyRate(balance, apy) * priceUsd;
}

export const getBalanceInInv = (
    balances: BigNumberList,
    address: string,
    exchangeRates: BigNumberList,
    priceUsd: number,
    invPriceUsd: number,
    underlyingDecimals: number,
) => {
    // balance in anchor version of token
    const anTokenBalance = getParsedBalance(balances, address, underlyingDecimals);
    // exRate between anchor version and underlying token
    const anTokenToTokenExRate = exchangeRates ? parseFloat(formatUnits(exchangeRates[address])) : 0;
    // balance in underlying token
    const tokenBalance = anTokenBalance * anTokenToTokenExRate;
    return tokenBalance * priceUsd / invPriceUsd;
}

// supply balances are in anTokens, borrow balances are already in underlying token balance
// get monthly interests in USD
export const getTotalInterests = (markets: Market[], anSupplyBalances: BigNumberList, borrowBalances: BigNumberList, exchangeRates: BigNumberList, invPriceUsd: number) => {
    return markets?.reduce((prevValue, { token, underlying, borrowApy, supplyApy, rewardApr, priceUsd }) => {
        const interestPrice = underlying.symbol === 'INV' ? invPriceUsd : priceUsd;
        const borrowInterests = -getMarketMonthlyUsdRate(borrowBalances, token, underlying.decimals, borrowApy, interestPrice);

        const anTokenToTokenExRate = exchangeRates ? parseFloat(formatUnits(exchangeRates[token])) : 0;
        const supplyUsdInterests = getMarketMonthlyUsdRate(anSupplyBalances, token, underlying.decimals, supplyApy, interestPrice) * anTokenToTokenExRate;
        const invUsdInterests = getMarketMonthlyUsdRate(anSupplyBalances, token, underlying.decimals, rewardApr, interestPrice) * anTokenToTokenExRate;

        return {
            supplyUsdInterests: prevValue.supplyUsdInterests + supplyUsdInterests,
            invUsdInterests: prevValue.invUsdInterests + invUsdInterests,
            borrowInterests: prevValue.borrowInterests + borrowInterests,
            total: prevValue.total + supplyUsdInterests + borrowInterests + invUsdInterests,
            totalPositive: prevValue.totalPositive + supplyUsdInterests + invUsdInterests,
        };
    }, { supplyUsdInterests: 0, invUsdInterests: 0, borrowInterests: 0, total: 0, totalPositive: 0 });
}

export const dollarify = (value: number, precision = 2, showPlusSign = false, showMinPrecision = false): string => {
    if (typeof value !== 'number' && value !== NaN) { return '$' }
    const signPrefix = value > 0 ? showPlusSign ? '+' : '' : value < 0 ? '-' : ''
    try {
        const minValue = getValueOrMinPrecisionValue(value, precision)
        const content = minValue !== Math.abs(value) && showMinPrecision ? `<$${minValue}` : `$${commify(Math.abs(value)?.toFixed(precision))}`
        return `${signPrefix}${content}`
    } catch (e) {
        console.log(value);
    }
    return '$';
}

export const getMinPrecisionValue = (precision = 2) => {
    return 1 / Math.pow(10, precision);
}

export const getValueOrMinPrecisionValue = (value: number, precision = 2) => {
    const minPrecisionValue = getMinPrecisionValue(precision);
    const isLowerThanMinPrecision = Math.abs(value) > 0 && Math.abs(value) < minPrecisionValue
    return isLowerThanMinPrecision ? minPrecisionValue : value;
}

export const shortenNumber = (value: number, precision = 2, isDollar = false, showMinPrecision = false) => {
    if (typeof value !== 'number' || isNaN(value)) { return `${isDollar ? '$' : ''}` + (0).toFixed(precision) }
    let suffix = ''
    const dividers: { [key: string]: number } = { 'k': 1000, 'M': 1000000, 'B': 1000000000, 'T': 1000000000000 };
    const absValue = Math.abs(value);
    if (absValue >= 1000000000000) { suffix = 'T' }
    else if (absValue >= 1000000000) { suffix = 'B' }
    else if (absValue >= 1000000) { suffix = 'M' }
    else if (absValue >= 1000) { suffix = 'k' }
    const divider: number = dividers[suffix] || 1
    const shortValue = value / divider;
    const numResult = isDollar ? dollarify(shortValue, precision, false, showMinPrecision) : shortValue.toFixed(precision)
    const minPrecisionValue = getMinPrecisionValue(precision)
    const minValue = getValueOrMinPrecisionValue(value, precision)
    const content = minValue !== Math.abs(value) && Math.abs(value) < minPrecisionValue && showMinPrecision && !isDollar ? `<${value < 0 ? '0' : minValue}` : numResult;
    return `${content}${suffix}`
}

export const smartShortNumber = (value: number, precision = 2, isDollar = false, showMinPrecision = false) => {
    const num = shortenNumber(value, precision, isDollar, showMinPrecision);
    return removeTrailingZeros(num);
}

// Precision grows with value
function getSmartPrecision(value: number, cap = 6) {
    const absValue = Math.abs(value);
    if (absValue <= 1.01) return 0;
    return Math.min(cap, Math.floor(Math.log10(absValue)));
}

// format an amount with higher precision if price of the asset is higher
export const smartAutoNumber = (value: number, price: number, cap? :number) => {
    return value?.toFixed(getSmartPrecision(price, cap));
}

// format an amount with higher precision if price of the asset is higher
export const smartAutoShortNumber = (value: number, price: number, cap? :number, isDollar = false, showMinPrecision = false) => {
    return smartShortNumber(value, getSmartPrecision(price, cap), isDollar, showMinPrecision);
}

export const getToken = (tokens: TokenList, symbolOrAddress: string) => {
    return Object.entries(tokens)
        .map(([address, token]) => token)
        .find(token => isAddress(symbolOrAddress) ? token.address === symbolOrAddress : token.symbol === symbolOrAddress)
}

export const getBorrowLimitLabel = (newBorrowLimit: number, isReduceLimitCase = false) => {
    const newBorrowLimitLabel = newBorrowLimit > 100 || (newBorrowLimit < 0 && !isReduceLimitCase) ?
        '+100' :
        (newBorrowLimit < 0 && isReduceLimitCase) ?
            '0' : newBorrowLimit.toFixed(2)
    return newBorrowLimitLabel;
}

export const getBorrowInfosAfterSupplyChange = ({
    market,
    amount,
    prices,
    usdBorrow,
    usdBorrowable,
}: {
    market: Market,
    amount: number | undefined,
    prices: { [key: string]: BigNumber },
    usdBorrow: number,
    usdBorrowable: number,
}) => {
    const change =
        prices && amount
            ? market.collateralFactor *
            amount *
            parseFloat(formatUnits(prices[market.token], BigNumber.from(36).sub(market.underlying.decimals)))
            : 0

    const borrowable = usdBorrow + usdBorrowable
    const newBorrowable = borrowable + change

    const newBorrowLimit = (newBorrowable !== 0
        ? (usdBorrow / newBorrowable) * 100
        : 0
    )

    const newBorrowLimitLabel = getBorrowLimitLabel(newBorrowLimit, (amount || 0) > 0)
    const cleanPerc = Number(newBorrowLimitLabel.replace(/'+'/, ''))

    return { newBorrowLimit, borrowable, newBorrowable, newBorrowLimitLabel, newPerc: cleanPerc }
}

export const getRewardToken = () => {
    return getToken(TOKENS, process.env.NEXT_PUBLIC_REWARD_TOKEN!)
}

export const toApr = (rate: number) => rate / ETH_MANTISSA * BLOCKS_PER_YEAR * 100

// Compounded
export const toApy = (rate: number) =>
    (Math.pow((rate / ETH_MANTISSA) * BLOCKS_PER_DAY + 1, DAYS_PER_YEAR) - 1) *
    100;

// apr input directly in %, not decimal
export const aprToApy = (apr: number, compoundingsPerYear: number) =>
    !compoundingsPerYear ? apr : (Math.pow(1 + (apr / 100) / compoundingsPerYear, compoundingsPerYear) - 1) * 100;

export const getYearnVaults = async () => {
    try {
        const results = await fetch('https://d28fcsszptni1s.cloudfront.net/v1/chains/1/vaults/all');
        return results.json();
    } catch (e) { console.log(e) }
    return [];
}

export const getStYcrvData = async () => {
    try {
        const results = await fetch('https://ydaemon.yearn.fi/1/vault/0x27B5739e22ad9033bcBf192059122d163b60349D');
        const data = await results.json();
        const netAPR = data.apr.netAPR;
        const estimatedApy = aprToApy(100 * (netAPR + (data.apr.fees.performance + data.apr.fees.management) * netAPR), 365);
        return { apy: estimatedApy };
    } catch (e) { console.log(e) }
    return [];
}

export const getSavingsCrvUsdData = async () => {
    try {
        const [results, defillama] = await Promise.all([
            fetch('https://prices.curve.fi/v1/crvusd/savings/statistics'),
            getDefiLlamaApy("5fd328af-4203-471b-bd16-1705c726d926"),
        ]);
        const data = await results.json();
        return { apy: data.proj_apr, apy30d: defillama?.apy30d };
    } catch (e) { console.log(e) }
    return [];
}

export const getSavingsUSDData = async () => {
    try {
        const [results, defillama] = await Promise.all([
            fetch('https://info-sky.blockanalitica.com/api/v1/overall/?format=json'),
            getDefiLlamaApy("d3694b72-5bc4-44c9-8ab6-1fc7941d216a"),
        ]);
        const data = await results.json();
        return { apy: data[0].sky_savings_rate_apy * 100, apy30d: defillama?.apy30d };
    } catch (e) { console.log(e) }
    return [];
}

export const getSavingsdeUSDData = async () => {
    try {
        const [results] = await Promise.all([
            fetch('https://api-deusd-prod-public.elixir.xyz/public/deusd_apy'),
        ]);
        const data = await results.json();
        return { apy: data.deusd_apy };
    } catch (e) { console.log(e) }
    return [];
}

export const getSavingsUSDzData = async () => {
    try {
        const results = await fetch('https://anzen-ponder-idx.up.railway.app/stats/susdz');
        const data = await results.json();
        return { apy: parseFloat(data.impliedApy) };
    } catch (e) { console.log(e) }
    return [];
}

export const getSUSDEData = async (provider, alsoGet30d = false) => {
    let apy30d = undefined;
    if (alsoGet30d) {
        const defiLlamaData = await getDefiLlamaApy("66985a81-9c51-46ca-9977-42b4fe7bc6df");
        apy30d = defiLlamaData?.apy30d;
    }
    try {
        const results = await fetchWithTimeout('https://simple-proxy-server.onrender.com/ethena', undefined, 3000);
        const data = await results.json();
        return { apy: data.stakingYield.value, apy30d };
    } catch (e) {
        console.log('usde err', e)
    }
    // fallback
    try {
        const susdeContract = new Contract('0x9D39A5DE30e57443BfF2A8307A4256c8797A3497', [
            "function totalAssets() public view returns (uint)",
            "event RewardsReceived(uint amount)",
        ], provider);
        const [totalAssets, currentBlock] = await Promise.all([
            susdeContract.totalAssets(),
            provider.getBlockNumber(),
        ]);
        // last events with some margin
        const rewardEvents = await susdeContract.queryFilter(susdeContract.filters.RewardsReceived(), currentBlock - Math.ceil(BLOCKS_PER_DAY) * 24);
        // around 8h per reward event, we want avg on last 7 days, so last 21 events
        // edit: just take last event
        const nbEvents = 1;
        const filteredEvents = rewardEvents.slice(rewardEvents.length - nbEvents);
        const nbItems = filteredEvents.length;
        const rewardsReceivedPer8hLast7dayAvg = filteredEvents.reduce((acc, event) => acc + getBnToNumber(event.args.amount), 0) / nbItems;
        const apr = rewardsReceivedPer8hLast7dayAvg * 3 * 365 / getBnToNumber(totalAssets) * 100;
        // weekly compounding
        const apy = aprToApy(apr, WEEKS_PER_YEAR);
        return { apy, apy30d };
    } catch (e) { console.log(e) }
    return [];
}

export const getCrvUSDDOLAConvexData = () => getDefiLlamaApy(DEFI_LLAMA_POOL_IDS.CRVUSD_DOLA);

export const getSUSDeDOLAConvexData = () => getDefiLlamaApy(DEFI_LLAMA_POOL_IDS.SUSDE_DOLA);

export const getFraxPyusdDOLAConvexData = () => getDefiLlamaApy(DEFI_LLAMA_POOL_IDS.FRAX_PYUSD_DOLA);

export const getFraxBPDOLAConvexData = () => getDefiLlamaApy(DEFI_LLAMA_POOL_IDS.FRAX_BP_DOLA);

export const getSFraxData = async (provider) => {
    return getDefiLlamaApy('55de30c3-bf9f-4d4e-9e0b-536a8ef5ab35');
    //   try {
    //     const contract = new Contract('0xA663B02CF0a4b149d2aD41910CB81e23e1c41c32', [{ "inputs": [{ "internalType": "contract IERC20", "name": "_underlying", "type": "address" }, { "internalType": "string", "name": "_name", "type": "string" }, { "internalType": "string", "name": "_symbol", "type": "string" }, { "internalType": "uint32", "name": "_rewardsCycleLength", "type": "uint32" }, { "internalType": "uint256", "name": "_maxDistributionPerSecondPerAsset", "type": "uint256" }, { "internalType": "address", "name": "_timelockAddress", "type": "address" }], "stateMutability": "nonpayable", "type": "constructor" }, { "inputs": [{ "internalType": "address", "name": "pendingTimelockAddress", "type": "address" }, { "internalType": "address", "name": "actualAddress", "type": "address" }], "name": "AddressIsNotPendingTimelock", "type": "error" }, { "inputs": [{ "internalType": "address", "name": "timelockAddress", "type": "address" }, { "internalType": "address", "name": "actualAddress", "type": "address" }], "name": "AddressIsNotTimelock", "type": "error" }, { "anonymous": false, "inputs": [{ "indexed": true, "internalType": "address", "name": "owner", "type": "address" }, { "indexed": true, "internalType": "address", "name": "spender", "type": "address" }, { "indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256" }], "name": "Approval", "type": "event" }, { "anonymous": false, "inputs": [{ "indexed": true, "internalType": "address", "name": "caller", "type": "address" }, { "indexed": true, "internalType": "address", "name": "owner", "type": "address" }, { "indexed": false, "internalType": "uint256", "name": "assets", "type": "uint256" }, { "indexed": false, "internalType": "uint256", "name": "shares", "type": "uint256" }], "name": "Deposit", "type": "event" }, { "anonymous": false, "inputs": [{ "indexed": false, "internalType": "uint256", "name": "rewardsToDistribute", "type": "uint256" }], "name": "DistributeRewards", "type": "event" }, { "anonymous": false, "inputs": [{ "indexed": false, "internalType": "uint256", "name": "oldMax", "type": "uint256" }, { "indexed": false, "internalType": "uint256", "name": "newMax", "type": "uint256" }], "name": "SetMaxDistributionPerSecondPerAsset", "type": "event" }, { "anonymous": false, "inputs": [{ "indexed": false, "internalType": "uint40", "name": "cycleEnd", "type": "uint40" }, { "indexed": false, "internalType": "uint40", "name": "lastSync", "type": "uint40" }, { "indexed": false, "internalType": "uint216", "name": "rewardCycleAmount", "type": "uint216" }], "name": "SyncRewards", "type": "event" }, { "anonymous": false, "inputs": [{ "indexed": true, "internalType": "address", "name": "previousTimelock", "type": "address" }, { "indexed": true, "internalType": "address", "name": "newTimelock", "type": "address" }], "name": "TimelockTransferStarted", "type": "event" }, { "anonymous": false, "inputs": [{ "indexed": true, "internalType": "address", "name": "previousTimelock", "type": "address" }, { "indexed": true, "internalType": "address", "name": "newTimelock", "type": "address" }], "name": "TimelockTransferred", "type": "event" }, { "anonymous": false, "inputs": [{ "indexed": true, "internalType": "address", "name": "from", "type": "address" }, { "indexed": true, "internalType": "address", "name": "to", "type": "address" }, { "indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256" }], "name": "Transfer", "type": "event" }, { "anonymous": false, "inputs": [{ "indexed": true, "internalType": "address", "name": "caller", "type": "address" }, { "indexed": true, "internalType": "address", "name": "receiver", "type": "address" }, { "indexed": true, "internalType": "address", "name": "owner", "type": "address" }, { "indexed": false, "internalType": "uint256", "name": "assets", "type": "uint256" }, { "indexed": false, "internalType": "uint256", "name": "shares", "type": "uint256" }], "name": "Withdraw", "type": "event" }, { "inputs": [], "name": "DOMAIN_SEPARATOR", "outputs": [{ "internalType": "bytes32", "name": "", "type": "bytes32" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "PRECISION", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "REWARDS_CYCLE_LENGTH", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "UNDERLYING_PRECISION", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "acceptTransferTimelock", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "", "type": "address" }, { "internalType": "address", "name": "", "type": "address" }], "name": "allowance", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "spender", "type": "address" }, { "internalType": "uint256", "name": "amount", "type": "uint256" }], "name": "approve", "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [], "name": "asset", "outputs": [{ "internalType": "contract ERC20", "name": "", "type": "address" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "", "type": "address" }], "name": "balanceOf", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "components": [{ "internalType": "uint40", "name": "cycleEnd", "type": "uint40" }, { "internalType": "uint40", "name": "lastSync", "type": "uint40" }, { "internalType": "uint216", "name": "rewardCycleAmount", "type": "uint216" }], "internalType": "struct LinearRewardsErc4626.RewardsCycleData", "name": "_rewardsCycleData", "type": "tuple" }, { "internalType": "uint256", "name": "_deltaTime", "type": "uint256" }], "name": "calculateRewardsToDistribute", "outputs": [{ "internalType": "uint256", "name": "_rewardToDistribute", "type": "uint256" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "uint256", "name": "shares", "type": "uint256" }], "name": "convertToAssets", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "uint256", "name": "assets", "type": "uint256" }], "name": "convertToShares", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "decimals", "outputs": [{ "internalType": "uint8", "name": "", "type": "uint8" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "uint256", "name": "_assets", "type": "uint256" }, { "internalType": "address", "name": "_receiver", "type": "address" }], "name": "deposit", "outputs": [{ "internalType": "uint256", "name": "_shares", "type": "uint256" }], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "uint256", "name": "_assets", "type": "uint256" }, { "internalType": "address", "name": "_receiver", "type": "address" }, { "internalType": "uint256", "name": "_deadline", "type": "uint256" }, { "internalType": "bool", "name": "_approveMax", "type": "bool" }, { "internalType": "uint8", "name": "_v", "type": "uint8" }, { "internalType": "bytes32", "name": "_r", "type": "bytes32" }, { "internalType": "bytes32", "name": "_s", "type": "bytes32" }], "name": "depositWithSignature", "outputs": [{ "internalType": "uint256", "name": "_shares", "type": "uint256" }], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [], "name": "lastRewardsDistribution", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "", "type": "address" }], "name": "maxDeposit", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "maxDistributionPerSecondPerAsset", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "", "type": "address" }], "name": "maxMint", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "owner", "type": "address" }], "name": "maxRedeem", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "owner", "type": "address" }], "name": "maxWithdraw", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "uint256", "name": "_shares", "type": "uint256" }, { "internalType": "address", "name": "_receiver", "type": "address" }], "name": "mint", "outputs": [{ "internalType": "uint256", "name": "_assets", "type": "uint256" }], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [], "name": "name", "outputs": [{ "internalType": "string", "name": "", "type": "string" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "", "type": "address" }], "name": "nonces", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "pendingTimelockAddress", "outputs": [{ "internalType": "address", "name": "", "type": "address" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "owner", "type": "address" }, { "internalType": "address", "name": "spender", "type": "address" }, { "internalType": "uint256", "name": "value", "type": "uint256" }, { "internalType": "uint256", "name": "deadline", "type": "uint256" }, { "internalType": "uint8", "name": "v", "type": "uint8" }, { "internalType": "bytes32", "name": "r", "type": "bytes32" }, { "internalType": "bytes32", "name": "s", "type": "bytes32" }], "name": "permit", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "uint256", "name": "assets", "type": "uint256" }], "name": "previewDeposit", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "previewDistributeRewards", "outputs": [{ "internalType": "uint256", "name": "_rewardToDistribute", "type": "uint256" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "uint256", "name": "shares", "type": "uint256" }], "name": "previewMint", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "uint256", "name": "shares", "type": "uint256" }], "name": "previewRedeem", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "previewSyncRewards", "outputs": [{ "components": [{ "internalType": "uint40", "name": "cycleEnd", "type": "uint40" }, { "internalType": "uint40", "name": "lastSync", "type": "uint40" }, { "internalType": "uint216", "name": "rewardCycleAmount", "type": "uint216" }], "internalType": "struct LinearRewardsErc4626.RewardsCycleData", "name": "_newRewardsCycleData", "type": "tuple" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "uint256", "name": "assets", "type": "uint256" }], "name": "previewWithdraw", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "pricePerShare", "outputs": [{ "internalType": "uint256", "name": "_pricePerShare", "type": "uint256" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "uint256", "name": "_shares", "type": "uint256" }, { "internalType": "address", "name": "_receiver", "type": "address" }, { "internalType": "address", "name": "_owner", "type": "address" }], "name": "redeem", "outputs": [{ "internalType": "uint256", "name": "_assets", "type": "uint256" }], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [], "name": "renounceTimelock", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [], "name": "rewardsCycleData", "outputs": [{ "internalType": "uint40", "name": "cycleEnd", "type": "uint40" }, { "internalType": "uint40", "name": "lastSync", "type": "uint40" }, { "internalType": "uint216", "name": "rewardCycleAmount", "type": "uint216" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "uint256", "name": "_maxDistributionPerSecondPerAsset", "type": "uint256" }], "name": "setMaxDistributionPerSecondPerAsset", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [], "name": "storedTotalAssets", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "symbol", "outputs": [{ "internalType": "string", "name": "", "type": "string" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "syncRewardsAndDistribution", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [], "name": "timelockAddress", "outputs": [{ "internalType": "address", "name": "", "type": "address" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "totalAssets", "outputs": [{ "internalType": "uint256", "name": "_totalAssets", "type": "uint256" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "totalSupply", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "to", "type": "address" }, { "internalType": "uint256", "name": "amount", "type": "uint256" }], "name": "transfer", "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "from", "type": "address" }, { "internalType": "address", "name": "to", "type": "address" }, { "internalType": "uint256", "name": "amount", "type": "uint256" }], "name": "transferFrom", "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "_newTimelock", "type": "address" }], "name": "transferTimelock", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "uint256", "name": "_assets", "type": "uint256" }, { "internalType": "address", "name": "_receiver", "type": "address" }, { "internalType": "address", "name": "_owner", "type": "address" }], "name": "withdraw", "outputs": [{ "internalType": "uint256", "name": "_shares", "type": "uint256" }], "stateMutability": "nonpayable", "type": "function" }], provider);
    //     const [amountBn, supplyBn] = await Promise.all([
    //       contract.rewardsCycleData(),
    //       contract.storedTotalAssets(),
    //     ]);

    //     const amount = getBnToNumber(amountBn[2]);
    //     const supply = getBnToNumber(supplyBn);
    //     const apr = amount * WEEKS_PER_YEAR / supply * 100;
    //     const apy = aprToApy(apr, BLOCKS_PER_DAY * 365);

    //     return { apy };
    //   } catch (e) {
    //     console.log("Failed to fetch sFRAX data:", e);
    //     return { apy: 0 };
    //   }
};

export const getStethData = () => getDefiLlamaApy(DEFI_LLAMA_POOL_IDS.STETH);

export const getStYethData = async () => {
    try {
        const now = Date.now();

        const stYethContract = new Contract('0x583019fF0f430721aDa9cfb4fac8F06cA104d0B4', [
            'function totalAssets() public view returns(uint)',
            'function get_amounts() public view returns(tuple(uint,uint,uint,uint))',
        ], getProvider(NetworkIds.mainnet));

        const [totalAssets, amounts] = await Promise.all([
            stYethContract.totalAssets(),
            stYethContract.get_amounts(),
        ]);
        // yEth amount to redistribute the remaining time of the week
        const remainingAmountInTheWeek = getBnToNumber(amounts[1]);
        // remaining time in the week
        const remainingMs = (getNextThursdayTimestamp() - now);
        const apr = remainingAmountInTheWeek * ((ONE_DAY_MS * 7) / remainingMs) * WEEKS_PER_YEAR / getBnToNumber(totalAssets);
        const apy = aprToApy(apr, WEEKS_PER_YEAR);
        return { apr: apr * 100, apy: apy * 100 };
    } catch (e) { console.log(e) }
    return {};
}

// cross-check between defillama and enso apy
export const getCrossCheckedApyData = async (poolId: string, convexAddress: string) => {
    const [defillamaData, ensoData] = await Promise.all([
        getPoolYield(poolId),
        getEnsoData([convexAddress]),
    ])

    const ensoItem = ensoData[0];
    if (!ensoItem) {
        return {
            defillamaData,
        }
    }
    // enso seem to handle better the pending harvest case for Convex in which case the apyReward is null there
    const apy = ensoItem.apyReward === null ? defillamaData.apyBase : defillamaData.apy;

    return {
        ...defillamaData,
        apy,
    }
}

export const getCvxCrvData = () => getDefiLlamaApy(DEFI_LLAMA_POOL_IDS.CVX_CRV);

export const getDSRData = () => getDefiLlamaApy(DEFI_LLAMA_POOL_IDS.DSR);

export const getStCvxData = () => getDefiLlamaApy(DEFI_LLAMA_POOL_IDS.ST_CVX);

export const getCvxFxsAPRs = async (provider, _prices?: any) => {
    try {
        const utilContract = new Contract(
            '0x49b4d1dF40442f0C31b1BbAEA3EDE7c38e37E31a',
            [
                'function rewardData(address) view returns (tuple(uint periodFinish, uint rewardRate, uint lastUpdateTime, uint rewardPerTokenStored))',
                'function totalSupply() view returns (uint)',
            ],
            provider);

        const [fxsRewardData, cvxRewardData, totalSupply, pricesRes] = await Promise.all([
            utilContract.rewardData('0x3432B6A60D23Ca0dFCa7761B7ab56459D9C964D0'),
            utilContract.rewardData('0x4e3fbd56cd56c3e72c1403e103b45db9da5b9d2b'),
            utilContract.totalSupply(),
            !!_prices ? Promise.resolve() : fetch(`${process.env.COINGECKO_PRICE_API}?vs_currencies=usd&ids=frax-share,convex-finance,convex-fxs`)
        ]);

        const prices = _prices || await pricesRes.json();
        const year = ONE_DAY_SECS * 365;

        return {
            fxs: 100 * getBnToNumber(fxsRewardData[1]) / getBnToNumber(totalSupply) * year * prices['frax-share'].usd / prices['convex-fxs'].usd,
            cvx: 100 * getBnToNumber(cvxRewardData[1]) / getBnToNumber(totalSupply) * year * prices['convex-finance'].usd / prices['convex-fxs'].usd,
        };
    } catch (e) { console.log(e) }
    return {};
}

export const getCvxCrvAPRs = async (provider, _prices?: any) => {
    try {
        const utilContract = new Contract(
            '0xadd2F542f9FF06405Fabf8CaE4A74bD0FE29c673',
            [{ "inputs": [{ "internalType": "address", "name": "_stkcvxcrv", "type": "address" }], "stateMutability": "nonpayable", "type": "constructor" }, { "inputs": [{ "internalType": "address", "name": "_account", "type": "address" }], "name": "accountExtraRewardRates", "outputs": [{ "internalType": "address[]", "name": "tokens", "type": "address[]" }, { "internalType": "uint256[]", "name": "rates", "type": "uint256[]" }, { "internalType": "uint256[]", "name": "groups", "type": "uint256[]" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "_account", "type": "address" }], "name": "accountRewardRates", "outputs": [{ "internalType": "address[]", "name": "tokens", "type": "address[]" }, { "internalType": "uint256[]", "name": "rates", "type": "uint256[]" }, { "internalType": "uint256[]", "name": "groups", "type": "uint256[]" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "uint256", "name": "_rate", "type": "uint256" }, { "internalType": "uint256", "name": "_priceOfReward", "type": "uint256" }, { "internalType": "uint256", "name": "_priceOfDeposit", "type": "uint256" }], "name": "apr", "outputs": [{ "internalType": "uint256", "name": "_apr", "type": "uint256" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "convexProxy", "outputs": [{ "internalType": "address", "name": "", "type": "address" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "crv", "outputs": [{ "internalType": "address", "name": "", "type": "address" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "cvx", "outputs": [{ "internalType": "address", "name": "", "type": "address" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "cvxCrvStaking", "outputs": [{ "internalType": "address", "name": "", "type": "address" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "cvxMining", "outputs": [{ "internalType": "address", "name": "", "type": "address" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "externalRewardContracts", "outputs": [{ "internalType": "address[]", "name": "rewardContracts", "type": "address[]" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "extraRewardRates", "outputs": [{ "internalType": "address[]", "name": "tokens", "type": "address[]" }, { "internalType": "uint256[]", "name": "rates", "type": "uint256[]" }, { "internalType": "uint256[]", "name": "groups", "type": "uint256[]" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "mainRewardRates", "outputs": [{ "internalType": "address[]", "name": "tokens", "type": "address[]" }, { "internalType": "uint256[]", "name": "rates", "type": "uint256[]" }, { "internalType": "uint256[]", "name": "groups", "type": "uint256[]" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "_rewardContract", "type": "address" }], "name": "singleRewardRate", "outputs": [{ "internalType": "address", "name": "token", "type": "address" }, { "internalType": "uint256", "name": "rate", "type": "uint256" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "stkcvxcrv", "outputs": [{ "internalType": "address", "name": "", "type": "address" }], "stateMutability": "view", "type": "function" }],
            provider);

        const [mainRewardRates, extraRewardRates, pricesRes] = await Promise.all([
            utilContract.mainRewardRates(),
            utilContract.extraRewardRates(),
            !!_prices ? Promise.resolve() : fetch(`${process.env.COINGECKO_PRICE_API}?vs_currencies=usd&ids=curve-dao-token,convex-finance,convex-crv,lp-3pool-curve,crvusd`)
        ]);

        const prices = _prices || await pricesRes.json();
        const mainTokens = mainRewardRates[0];

        const adCgId = {
            '0x6c3f90f043a72fa612cbac8115ee7e52bde6e490': 'lp-3pool-curve',
            '0x4e3fbd56cd56c3e72c1403e103b45db9da5b9d2b': 'convex-finance',
            '0xd533a949740bb3306d119cc777fa900ba034cd52': 'curve-dao-token',
            '0xf939e0a03fb07f59a73314e73794be0e57ac1b4e': 'crvusd',
        }

        const aprs = await Promise.all(
            mainTokens.map((tokenAd, i) => {
                const extraRewardIndex = extraRewardRates[0].findIndex(a => a.toLowerCase() === tokenAd.toLowerCase());
                let rate = mainRewardRates[1][i];
                if (extraRewardIndex !== -1) {
                    rate = rate.add(extraRewardRates[1][extraRewardIndex]);
                };
                return utilContract.apr(
                    rate,
                    parseEther(prices[adCgId[tokenAd.toLowerCase()]]?.usd.toString()),
                    parseEther(prices['convex-crv']?.usd.toString()),
                );
            })
        );
        return {
            crv: getBnToNumber(aprs[0]) * 100,
            cvx: getBnToNumber(aprs[1]) * 100,
            '3crv': getBnToNumber(aprs[2]) * 100,
            'crvusd': getBnToNumber(aprs[3]) * 100,
            group1: (getBnToNumber(aprs[0]) * 100) + (getBnToNumber(aprs[1]) * 100),
            group2: getBnToNumber(aprs[3]) * 100,
        };
    } catch (e) {
        console.log(e)
    }
    return {};
}

export const getGOhmData = async () => {
    try {
        const results = await fetch("https://api.thegraph.com/subgraphs/name/olympusdao/olympus-protocol-metrics", {
            "referrer": "https://app.olympusdao.finance/",
            "referrerPolicy": "strict-origin-when-cross-origin",
            "body": "{\"query\":\"\\n    query ProtocolMetrics($recordCount: Int!, $startingRecord: Int = 0, $filter: ProtocolMetric_filter, $endpoint: String!) {\\n  protocolMetrics(\\n    first: $recordCount\\n    skip: $startingRecord\\n    where: $filter\\n    orderBy: date\\n    orderDirection: desc\\n  ) {\\n    currentAPY\\n  }\\n}\\n    \",\"variables\":{\"recordCount\":1,\"endpoint\":\"https://api.thegraph.com/subgraphs/name/olympusdao/olympus-protocol-metrics\"}}",
            "method": "POST",
            "mode": "cors",
            "credentials": "omit"
        });
        const data = await results.json();
        return data?.data?.protocolMetrics?.length > 0 ? { apy: parseFloat(data.data.protocolMetrics[0].currentAPY) } : { apy: 0 };
    } catch (e) {
        console.log(e)
        return { apy: 0 }
    }
}

export const getYearnVaultApy = async (vaultId: string) => {
    try {
        const response = await fetch(`https://ydaemon.yearn.fi/1/vaults/${vaultId}`);
        const data = await response.json();
        return {
            apy: data?.apr?.forwardAPR?.netAPR
                ? data.apr.forwardAPR.netAPR * 100
                : data?.apr?.netAPR
                    ? data.apr.netAPR * 100
                    : 0
        };
    } catch (e) {
        console.log(`Failed to fetch APY for Yearn vault ${vaultId}:`, e);
        return { apy: 0 };
    }
};

const getYearnVaultApyViaKong = async (vaultId: string) => {
    try {
        const response = await fetch("https://kong.yearn.farm/api/gql?explorerURLState=N4IgJg9gxgrgtgUwHYBcQC4QEcYIE4CeABAGoCGMANigBQAkUAFmQJZICSY6R7qANETpkwYPAgDO47gGUUeNgHMAlEWAAdPGqREiANwrUaTVhy6DjbTgOGiJUwTbGSV6zdp1EyAB2KutHjyQEFA1-AKIAdwQEAGtKAgA5YND3ALgIVEZ4pJC3cKIFPAhJAEEvTTyPAF8UnRq3KpA+EH15MgAjSgkMED93NRALUwHuAEY+WqIBxzsRqZAABgAPACYAdgAhAFY1gGYATgQVleF9hd3d9qgNgDNR-ZWFrf3R47BRgDZLj-OAFn2ACIDFKNZpeYooG6UFgKRgoADyXnwZBQLAy0ig8i8aEwICqQA", {
            "headers": {
                "content-type": "application/json",
            },
            "body": "{\"query\":\"query Vault($chainId: Int, $address: String) {\\r\\n  vault(chainId: $chainId, address: $address) {\\r\\n    apy {\\r\\n      net\\r\\n      weeklyNet\\r\\n      monthlyNet\\r\\n      grossApr\\r\\n    }\\r\\n  }\\r\\n}\",\"variables\":{\"chainId\":1,\"address\":\"" + vaultId + "\"},\"operationName\":\"Vault\"}",
            "method": "POST"
        });

        const result = await response.json();
        return {
            apy: result?.data?.vault?.apy?.net
                ? result.data.vault.apy.net * 100
                : 0
        };
    } catch (e) {
        console.log(`Failed to fetch APY for Yearn vault ${vaultId}:`, e);
        return { apy: 0 };
    }
};

export const getStYvCrvData = () => getYearnVaultApyViaKong(YEARN_VAULT_IDS.YCRV);
export const getYvCrvUsdDOLAData = () => getYearnVaultApy(YEARN_VAULT_IDS.CRVUSD_DOLA);
export const getYvSUSDeDOLAData = () => getYearnVaultApy(YEARN_VAULT_IDS.SUSDE_DOLA);
export const getYvFraxPyusdDOLAData = () => getYearnVaultApy(YEARN_VAULT_IDS.FRAX_PYUSD_DOLA);
export const getYvFraxBPDOLAData = () => getYearnVaultApy(YEARN_VAULT_IDS.FRAX_BP_DOLA);

export const getPendleMarketApy = async (pendleMarketAddress: string) => {
    try {
        const results = await fetch(`https://api-v2.pendle.finance/core/v1/1/markets/${pendleMarketAddress}`);
        const data = await results.json();
        return { apy: data?.impliedApy * 100 };
    } catch (e) {
        console.log(e)
        return { apy: 0 }
    }
}

export const getXSushiData = async (nbDays = 7) => {
    let apy = 0;
    // const period = 365;
    // try {
    //     const days = [...Array(nbDays).keys()];

    //     const [daysData] = await Promise.all([
    //         sushiData.exchange.dayData(),
    //     ]);
    //     const infos = await Promise.all([
    //         ...days.map(v => {
    //             const d = new Date();
    //             const utc = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - v, 0, 0, 0);
    //             return sushiData.bar.info({ timestamp: utc });
    //         }),
    //     ]);

    //     const prices = (await Promise.all([
    //         ...days.map(v => {
    //             const d = new Date();
    //             const utc = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - v, 0, 0, 0);
    //             return sushiData.exchange.token({ timestamp: utc, token_address: '0x8798249c2e607446efb7ad49ec89dd1865ff4272' });
    //         }),
    //     ])).map(d => d.derivedETH);

    //     const apys = days.map((d, i) => {
    //         const apr = (((daysData[i].volumeETH * 0.05 * 0.01) / infos[i].totalSupply) * period) / (infos[i].ratio * prices[i])
    //         const apy = (Math.pow((1 + (apr / period)), period)) - 1;
    //         return apy;
    //     });

    //     apy = apys.reduce((prev, curr) => prev + curr, 0) / apys.length;
    // } catch (e) { console.log(e) }
    return { apy: apy * 100 };
}

export const getPoolYield = async (defiLlamaPoolId: string, strictAvg = false) => {
    const url = `https://yields.llama.fi/chart/${defiLlamaPoolId}`;
    try {
        const results = await fetch(url);
        const data = await results.json();
        const apy30d = data.status === 'success' ? data?.data?.length >= 30 ? getAvgOnLastItems(data?.data, "apy", 30) : 0 : 0;
        const apy60d = data.status === 'success' ? data?.data?.length >= 60 ? getAvgOnLastItems(data?.data, "apy", 60) : 0 : 0;
        const apy90d = data.status === 'success' ? data?.data?.length >= 90 ? getAvgOnLastItems(data?.data, "apy", 90) : 0 : 0;
        const apy180d = data.status === 'success' ? data?.data?.length >= 180 ? getAvgOnLastItems(data?.data, "apy", 180) : 0 : 0;
        const apy365d = data.status === 'success' ? data?.data?.length >= 365 ? getAvgOnLastItems(data?.data, "apy", 365) : 0 : 0;
        return data.status === 'success' ? { ...data.data[data.data.length - 1], apy30d, apy60d, apy90d, apy180d, apy365d } : { apy: 0, tvlUsd: 0, apy30d, apy60d, apy90d, apy180d, apy365d };
    } catch (e) { console.log(e) }
    return {};
}

export const homogeneizeLpName = (value: string) => {
    return value
        .replace(/-3CRV$/i, '-3POOL')
        .replace(/DOLA-DAI\+USDC/i, 'DOLA-2POOL')
        .replace(/ \([0-9.]+%\)$/i, '')
        .replace(/^(.*)-(DOLA|INV)$/i, '$2-$1')
        .replace(/DOLA-YVCURVE/i, 'DOLA-3POOL')
        .replace(/-?SAMMV2-?/i, '')
        .replace(/SAMM-?/i, '')
        .replace(/DOLAUSDC/i, 'DOLA-USDC')
        .replace(/DOLAFRAX/i, 'DOLA-FRAX')
        .replace(/OPUSDCE/i, 'USDC')
        .replace('USDC.E-DOLA-BPT-DOLA-USDC', 'DOLA-USDC')
        .replace(/(-LP|-SLP|-AURA| [a-zA-Z]*lp)/ig, '')
        .toUpperCase()
}

export const getSymbolFromUnderlyingTokens = (chainId: string | number, underlyingTokens: string[]) => {
    const chainTokens = lowercaseObjectKeys(CHAIN_TOKENS[chainId]);
    const tokens = underlyingTokens
        .map(ad => chainTokens[ad.toLowerCase()])
        .filter(t => !!t)
        .map(t => t.symbol);
    return tokens.join('-');
}

const poolsToExclude = [
    // dola-inv aura mainnet
    '8ef7e85e-d27a-4471-87db-18b6cc7dddc4',
];

export const getYieldOppys = async () => {
    const url = `https://yields.llama.fi/pools`;
    try {
        const results = await fetch(url);
        const data = await results.json();
        const pools = data.status === 'success' ? data.data : [];
        return pools
            .filter(p => !!NETWORKS_BY_NAME[p.chain])
            .filter(p => /^(inv-|s?dola-|dbr-)/i.test(p.symbol) || /(-inv|-s?dola|-dbr)$/i.test(p.symbol) || /(-inv-|-s?dola-|-dbr-)/i.test(p.symbol))
            // filter pools with known incorrect data
            .filter(p => !poolsToExclude.includes(p.pool))
            .filter(p => p.project !== 'inverse-finance-firm')
            .map(p => {
                return {
                    ...p,
                    underlyingTokens: p.underlyingTokens || [],
                    // clean pool names & make them more homogen
                    symbol: homogeneizeLpName(p.symbol),
                }
            })
            .map(p => {
                return {
                    ...p,
                    // force as stablecoin even though defillama says not stable
                    stablecoin: ['DOLA-CRVUSD', 'DOLA-ERN', 'DOLA-USDBC', 'DOLA-USDC', 'DOLA-FRAX', 'DOLA-USDC.E', 'DOLA-FRAX-USDC', 'DOLA-FRAXBP', 'DOLA-FXUSD']
                        .includes(p.symbol) ? true : p.stablecoin,
                }
            });
    } catch (e) { console.log(e) }
    return {};
}

export const triggerSupply = (marketName: string) => {
    const customEvent = new CustomEvent('open-anchor-supply', { detail: { market: marketName } });
    document.dispatchEvent(customEvent);
}

export const triggerBorrow = (marketName: string) => {
    const customEvent = new CustomEvent('open-anchor-borrow', { detail: { market: marketName } });
    document.dispatchEvent(customEvent);
}

export const getHistoricalTokenData = async (cgId: string, fromTsSec?: number, toTsSec?: number) => {
    const now = Math.floor(Date.now() / 1000);
    try {
        // 1year max
        const res = await fetch(`https://api.coingecko.com/api/v3/coins/${cgId}/market_chart/range?vs_currency=usd&from=${fromTsSec || 1392577232}&to=${toTsSec || now}`);
        return res.json();
    } catch (e) {
        console.log(e);
        console.log('failed to get historical data')
    }
    return;
}

export const getFirmMarketsApys = async (provider, invApr, cachedData) => {
    // external yield bearing apys
    const externalYieldResults = await Promise.allSettled([
        getStethData(),
        getStYvCrvData(),
        getCvxCrvAPRs(provider),
        getCvxFxsAPRs(provider),
        getDSRData(),
        getStCvxData(),
        getStYethData(),
        getSFraxData(provider),
        getSUSDEData(provider),
        getCrvUSDDOLAConvexData(),
        getYvCrvUsdDOLAData(),
        getFraxPyusdDOLAConvexData(),
        getYvFraxPyusdDOLAData(),
        getFraxBPDOLAConvexData(),
        getYvFraxBPDOLAData(),
        getPendleMarketApy('0xcdd26eb5eb2ce0f203a84553853667ae69ca29ce'),
        getSUSDeDOLAConvexData(),
        getYvSUSDeDOLAData(),
        getDefiLlamaApy('51f9c038-feed-4666-8866-30efc92e0566'),
        getYearnVaultApy('0x342D24F2a3233F7Ac8A7347fA239187BFd186066'),
        // scrvUSD-DOLA
        getCrossCheckedApyData('8d316467-0da9-4404-923c-d7726ee60780', '0xff17dAb22F1E61078aBa2623c89cE6110E878B3c'),
        // getDefiLlamaApy('8d316467-0da9-4404-923c-d7726ee60780'),
        //
        getYearnVaultApy('0xbCe40f1840A449cAAaF374Df0A1fEe1e212784CB'),
        getDefiLlamaApy('0ff79814-dc93-4b3f-a4e1-7f395ddf0860'),
        getYearnVaultApy('0x08c0833AF1331831759b8e0BFeF1BC5738436325'),
        getDefiLlamaApy('2f3c88e7-8e18-4cdf-88e2-73ffa6f16af8'),
        getYearnVaultApy('0xc7C1B907BCD3194C0D9bFA2125251af98BdDAfbb'),
        getDefiLlamaApy('a850d185-5433-4932-99df-cdfea0336b9e'),
        getYearnVaultApy('0x57a2c7925bAA1894a939f9f6721Ea33F2EcFD0e2'),
        getPendleMarketApy('0xb162b764044697cf03617c2efbcb1f42e31e4766'),
        getPendleMarketApy('0x4339ffe2b7592dc783ed13cce310531ab366deac'),
        getPendleMarketApy('0xa36b60a14a1a5247912584768c6e53e1a269a9f7'),
        getPendleMarketApy('0x6d98a2b6cdbf44939362a3e99793339ba2016af4'),
    ]);

    let [
        stethData,
        stYcrvData,
        cvxCrvData,
        cvxFxsData,
        dsrData,
        stCvxData,
        stYethData,
        sFraxData,
        sUSDEData,
        crvUSDDOLAConvexData,
        yvCrvUsdDOLAData,
        fraxPyusdDOLAConvexData,
        yvFraxPyusdDOLAData,
        fraxBPDOLAConvexData,
        yvFraxBPDOLAData,
        ptSUSDe27MAR25Data,
        sUSDeDOLAConvexData,
        yvSUSDeDOLAData,
        sUSDSDolaConvexData,
        yvSUSDSDolaData,
        scrvUsdDolaConvexData,
        yvscrvUsdDolaData,
        scrvUsdSDolaConvexData,
        yvscrvUsdSDolaData,
        deUSDDOLAConvexData,
        yvdeUSDDOLAData,
        USRDOLAConvexData,
        yvUSRDOLAData,
        ptSUSDe29MAY25Data,
        ptSUSDe31JUL25Data,
        ptSUSDe25SEP25Data,
        ptUSDe25SEP25Data,
    ] = externalYieldResults.map(r => {
        return r.status === 'fulfilled' ? r.value : {};
    });

    if (!cvxCrvData.group1 && !!cachedData) {
        cvxCrvData = cachedData.markets.find(m => m.name === 'cvxCRV').cvxCrvData;
    }

    if (!cvxFxsData.fxs && !!cachedData) {
        cvxFxsData = cachedData.markets.find(m => m.name === 'cvxFXS').cvxFxsData;
    }

    return {
        cvxCrvData,
        cvxFxsData,
        'stETH': stethData?.apy || 0,
        'wstETH': stethData?.apy || 0,
        'cvxCRV': Math.max(cvxCrvData?.group1 || 0, cvxCrvData?.group2 || 0),
        'cvxFXS': (cvxFxsData?.fxs || 0) + (cvxFxsData?.cvx || 0),
        'INV': invApr || 0,
        'st-yCRV': stYcrvData?.apy || 0,
        'DAI': dsrData?.apy || 0,
        'CVX': stCvxData?.apy || 0,
        'st-yETH': stYethData?.apy || 0,
        'sFRAX': sFraxData?.apy || 0,
        'sUSDe': sUSDEData?.apy || 0,
        'crvUSD-DOLA': crvUSDDOLAConvexData?.apy || 0,
        'yv-crvUSD-DOLA': yvCrvUsdDOLAData?.apy || 0,
        'FraxPyUSD-DOLA': fraxPyusdDOLAConvexData?.apy || 0,
        'yv-FraxPyUSD-DOLA': yvFraxPyusdDOLAData?.apy || 0,
        'FraxBP-DOLA': fraxBPDOLAConvexData?.apy || 0,
        'yv-FraxBP-DOLA': yvFraxBPDOLAData?.apy || 0,
        'PT-sUSDe-27MAR25': ptSUSDe27MAR25Data?.apy || 0,
        'sUSDe-DOLA': sUSDeDOLAConvexData?.apy || 0,
        'yv-sUSDe-DOLA': yvSUSDeDOLAData?.apy || 0,
        'sUSDS-DOLA': sUSDSDolaConvexData?.apy || 0,
        'yv-sUSDS-DOLA': yvSUSDSDolaData?.apy || 0,
        'scrvUSD-DOLA': scrvUsdDolaConvexData?.apy || 0,
        'yv-scrvUSD-DOLA': yvscrvUsdDolaData?.apy || 0,
        'scrvUSD-sDOLA': scrvUsdSDolaConvexData?.apy || 0,
        'yv-scrvUSD-sDOLA': yvscrvUsdSDolaData?.apy || 0,
        'deUSD-DOLA': deUSDDOLAConvexData?.apy || 0,
        'yv-deUSD-DOLA': yvdeUSDDOLAData?.apy || 0,
        'USR-DOLA': USRDOLAConvexData?.apy || 0,
        'yv-USR-DOLA': yvUSRDOLAData?.apy || 0,
        'PT-sUSDe-29MAY25': ptSUSDe29MAY25Data?.apy || 0,
        'PT-sUSDe-31JUL25': ptSUSDe31JUL25Data?.apy || 0,
        'PT-sUSDe-25SEP25': ptSUSDe25SEP25Data?.apy || 0,
        'PT-USDe-25SEP25': ptUSDe25SEP25Data?.apy || 0,
    };
}