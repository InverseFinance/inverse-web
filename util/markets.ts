import { TOKENS } from '@app/variables/tokens';
import { BigNumberList, Market, TokenList } from '@app/types';
import { BigNumber, Contract } from 'ethers';
import { formatUnits, commify, isAddress, parseUnits, parseEther } from 'ethers/lib/utils';
import { ETH_MANTISSA, BLOCKS_PER_YEAR, DAYS_PER_YEAR, BLOCKS_PER_DAY, ONE_DAY_SECS } from '@app/config/constants';

import { removeTrailingZeros, toFixed } from './misc';

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

export const getValueOrMinPrecisionValue = (value: number, precision = 2) => {
    const minPrecisionValue = 1 / Math.pow(10, precision)
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
    const minValue = getValueOrMinPrecisionValue(value, precision)
    const content = minValue !== Math.abs(value) && showMinPrecision && !isDollar ? `<${minValue}` : numResult;
    return `${content}${suffix}`
}

export const smartShortNumber = (value: number, precision = 2, isDollar = false, showMinPrecision = false) => {
    const num = shortenNumber(value, precision, isDollar, showMinPrecision);
    return removeTrailingZeros(num);
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

export const getYearnVaults = async () => {
    try {
        const results = await fetch('https://d28fcsszptni1s.cloudfront.net/v1/chains/1/vaults/all');
        return results.json();
    } catch (e) { console.log(e) }
    return [];
}

export const getStYcrvData = async () => {
    try {
        return getPoolYield('320550a3-b7c4-4017-a5dd-f3ebed459470');
    } catch (e) { console.log(e) }
    return [];
}

export const getStethData = async () => {
    try {
        return getPoolYield('747c1d2a-c668-4682-b9f9-296708a3dd90');
    } catch (e) { console.log(e) }
    return [];
}

export const getCvxCrvData = async () => {
    try {
        return getPoolYield('ef32dd3b-a03b-4f79-9b65-8420d7e04ad0');
    } catch (e) { console.log(e) }
    return [];
}

export const getDSRData = async () => {
    try {
        return getPoolYield('c8a24fee-ec00-4f38-86c0-9f6daebc4225');
    } catch (e) { console.log(e) }
    return [];
}

export const getStCvxData = async () => {
    try {
        return getPoolYield('777032e6-e815-4f44-90b4-abb98f0f9632');
    } catch (e) { console.log(e) }
    return [];
}

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
            !!_prices ? Promise.resolve() : fetch(`${process.env.COINGECKO_PRICE_API}?vs_currencies=usd&ids=curve-dao-token,convex-finance,convex-crv,lp-3pool-curve`)
        ]);

        const prices = _prices || await pricesRes.json();
        const mainTokens = mainRewardRates[0];

        const adCgId = {
            '0x6c3f90f043a72fa612cbac8115ee7e52bde6e490': 'lp-3pool-curve',
            '0x4e3fbd56cd56c3e72c1403e103b45db9da5b9d2b': 'convex-finance',
            '0xd533a949740bb3306d119cc777fa900ba034cd52': 'curve-dao-token',
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
            group1: (getBnToNumber(aprs[0]) * 100) + (getBnToNumber(aprs[1]) * 100),
            group2: getBnToNumber(aprs[2]) * 100,
        };
    } catch (e) { console.log(e) }
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

export const getPoolYield = async (defiLlamaPoolId: string) => {
    const url = `https://yields.llama.fi/chart/${defiLlamaPoolId}`;
    try {
        const results = await fetch(url);
        const data = await results.json();
        return data.status === 'success' ? data.data[data.data.length - 1] : { apy: 0, tvlUsd: 0 };
    } catch (e) { console.log(e) }
    return {};
}

export const getYieldOppys = async () => {
    const url = `https://yields.llama.fi/pools`;
    try {
        const results = await fetch(url);
        const data = await results.json();
        const pools = data.status === 'success' ? data.data : [];
        return pools
            .filter(p => /^(inv-|dola-|dbr-)/i.test(p.symbol) || /(-inv|-dola|-dbr)$/i.test(p.symbol) || /(-inv-|-dola-|-dbr-)/i.test(p.symbol))
            .map(p => {
                return {
                    ...p,
                    underlyingTokens: p.underlyingTokens || [],
                    // clean pool names & make them more homogen
                    symbol: p.symbol
                        .replace(/-3CRV$/i, '-3POOL')
                        .replace(/DOLA-DAI\+USDC/i, 'DOLA-2POOL')
                        .replace(/ \([0-9.]+%\)$/i, '')
                        .replace(/^(.*)-(DOLA|INV)$/i, '$2-$1')
                        .replace(/DOLA-YVCURVE/i, 'DOLA-3POOL')
                        .replace(/-?SAMMV2-?/i, '')
                        .replace(/DOLAUSDC/i, 'DOLA-USDC')
                        .replace(/DOLAFRAX/i, 'DOLA-FRAX')
                        .toUpperCase()
                    ,
                }
            })
            .map(p => {
                return {
                    ...p,
                    // force as stablecoin even though defillama says not stable
                    stablecoin: p.symbol === 'DOLA-CRVUSD' ? true : p.stablecoin,
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

export const getHistoricalTokenData = async (cgId: string, from?: number, to?: number) => {
    const now = Date.now();
    try {
        const res = await fetch(`https://api.coingecko.com/api/v3/coins/${cgId}/market_chart/range?vs_currency=usd&from=${from || 1392577232}&to=${to || now}`);
        return res.json();
    } catch (e) {
        console.log(e);
        console.log('failed to get historical data')
    }
    return;
}