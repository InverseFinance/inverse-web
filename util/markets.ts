import { TOKENS } from '@app/variables/tokens';
import { BigNumberList, Market, TokenList } from '@app/types';
import { BigNumber } from 'ethers';
import { formatUnits, commify, isAddress } from 'ethers/lib/utils';

export const getMonthlyRate = (balance: number, apy: number) => {
    return (balance || 0) * (apy || 0) / 100 / 12;
}

export const getBnToNumber = (bn: BigNumber, decimals = 18) => {
    return bn ? parseFloat(formatUnits(bn, decimals)) : 0;
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

export const getValueOrMinPrecisionValue = (value: number, precision = 2) => {
    const minPrecisionValue = 1 / Math.pow(10, precision)
    const isLowerThanMinPrecision = Math.abs(value) > 0 && Math.abs(value) < minPrecisionValue
    return isLowerThanMinPrecision ? minPrecisionValue : value;
}

export const shortenNumber = (value: number, precision = 2, isDollar = false, showMinPrecision = false) => {
    if (!value) { return (0).toFixed(precision) }
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
    const minValue = getValueOrMinPrecisionValue(value, precision)
    const content = minValue !== Math.abs(value) && showMinPrecision && !isDollar ? `<${minValue}` : numResult;
    return `${content}${suffix}`
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