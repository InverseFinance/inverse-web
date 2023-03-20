import { COMPTROLLER_ABI, CTOKEN_ABI, ERC20_ABI, ORACLE_ABI } from "@app/config/abis";
import { BigNumber, Contract } from "ethers";
import "source-map-support";
import { getNetworkConfigConstants } from '@app/util/networks';
import { getProvider } from '@app/util/providers';
import { getBnToNumber } from '@app/util/markets';
import { getTokenHolders } from '@app/util/covalent';
import { formatUnits } from '@ethersproject/units';
import { throttledPromises } from '@app/util/misc';
import { getCacheFromRedis, redisSetWithTimestamp } from "./redis";

const fillPositionsWithRetry = async (
    positions: [number, BigNumber, BigNumber, string, number][],
    comptroller: Contract,
    maxRetries = 4,
    currentRetry = 0,
) => {
    const toFill = positions.filter(p => p[0] === 1);

    const results = await Promise.allSettled(toFill.map(p => p[3]).map((account) => comptroller.getAccountLiquidity(account)));
    const positionsResults = results.map((r, i) => {
        return r.status === 'fulfilled' ? r.value : toFill[i];
    });

    positionsResults.forEach((r, i) => {
        if (r[0] !== 1) {
            positions.splice(toFill[i][4], 1, r);
        }
    })

    const stillNeedRetry = positions.filter(p => p[0] === 1);
    if (stillNeedRetry.length > 0 && currentRetry < maxRetries) {
        await new Promise((r) => setTimeout(() => r(true), 1000));
        await fillPositionsWithRetry(positions, comptroller, maxRetries, currentRetry + 1);
    }
}
export const getPositionsDetails = async ({
    marketsData,
    isFirstBatch,
    accounts,
    pageSize,
    pageOffset,
}: {
    marketsData?: {
        lastUpdate: number, exRates: number[], marketDecimals: number[], collateralFactors: number[], prices: number[], balances: string[], uniqueUsers: string[], borrowPaused: boolean[]
    }
    isFirstBatch: boolean
    accounts: string[]
    pageSize: string | number
    pageOffset: string | number
}) => {
    const {
        UNDERLYING,
        XINV_V1,
        XINV,
        COMPTROLLER,
        ORACLE,
        ANCHOR_CHAIN_COINS,
    } = getNetworkConfigConstants(process.env.NEXT_PUBLIC_CHAIN_ID!);

    const provider = getProvider(process.env.NEXT_PUBLIC_CHAIN_ID!, process.env.POSITIONS_ALCHEMY_API, true);
    const comptroller = new Contract(COMPTROLLER, COMPTROLLER_ABI, provider);
    const oracle = new Contract(ORACLE, ORACLE_ABI, provider);
    const allMarkets: string[] = marketsData?.allMarkets || [...await comptroller.getAllMarkets()].filter(address => !!UNDERLYING[address])
    // // TODO: floki hotfix clean
    // const flokiMarket = '0x0BC08f2433965eA88D977d7bFdED0917f3a0F60B';
    // allMarkets.push(flokiMarket);
    console.log('markets');
    console.log(allMarkets);

    const contracts = allMarkets
        .map((address: string) => new Contract(address, CTOKEN_ABI, provider));

    let exRates, marketDecimals, collateralFactors, prices, balances, uniqueUsers, borrowPaused, lastUpdate;

    if (isFirstBatch || !marketsData) {
        const [
            underlyings,
            bnExRates,
            oraclePrices,
            borrowPausedData,
            marketsDetails,
        ] = await Promise.all([
            Promise.all(
                contracts.map(contract => !ANCHOR_CHAIN_COINS
                    .map(a => a.toLowerCase()).includes(contract.address.toLowerCase()) ?
                    contract.underlying()
                    : new Promise(r => r('')))
            ),
            Promise.all(contracts.map((contract) => contract.callStatic.exchangeRateCurrent())),
            Promise.all(allMarkets.map(address => oracle.getUnderlyingPrice(address))),
            Promise.all(
                contracts.map((contract) =>
                    [XINV, XINV_V1].includes(contract.address) ? new Promise((r) => r(true)) : comptroller.borrowGuardianPaused(contract.address)
                )
            ),
            Promise.all(contracts.map((contract) => comptroller.markets(contract.address))),
        ])
        console.log('fetched data');

        borrowPaused = borrowPausedData;

        exRates = bnExRates.map(v => getBnToNumber(v));

        marketDecimals = await Promise.all(
            underlyings.map(underlying => underlying ? new Contract(underlying, ERC20_ABI, provider).decimals() : new Promise(r => r('18')))
        )
        console.log('decimals');
        marketDecimals = marketDecimals.map(v => parseInt(v));

        collateralFactors = marketsDetails.map(m => parseFloat(formatUnits(m[1])));

        prices = oraclePrices
            .map((v, i) => {
                return parseFloat(formatUnits(v, BigNumber.from(36).sub(marketDecimals[i])))
            })

        console.log('prices');

        // potential borrowers list won't change for Frontier as it's borrowing is disabled
        const cachedUserAddresses = (await getCacheFromRedis('frontier-unique-past-users', false)) || [];
        if (!cachedUserAddresses?.length) {
            const holders = await Promise.all(
                contracts.map(contract => getTokenHolders(contract.address))
            )

            const usersSet = new Set();
            balances = {};

            holders.forEach((res, i) => {
                res.data.items.forEach(anTokenHolder => {
                    usersSet.add(anTokenHolder.address);
                    if (!balances[anTokenHolder.address]) { balances[anTokenHolder.address] = {} }
                    balances[anTokenHolder.address][anTokenHolder.contract_address] = anTokenHolder.balance;
                });
            });

            uniqueUsers = Array.from(usersSet);
            await redisSetWithTimestamp('frontier-unique-past-users', uniqueUsers);
        } else {
            uniqueUsers = cachedUserAddresses;
        }
        lastUpdate = Date.now();
    } else {
        lastUpdate = marketsData.lastUpdate;
        exRates = marketsData.exRates;
        marketDecimals = marketsData.marketDecimals;
        collateralFactors = marketsData.collateralFactors;
        prices = marketsData.prices;
        balances = marketsData.balances;
        uniqueUsers = marketsData.uniqueUsers;
        borrowPaused = marketsData.borrowPaused;
    }

    let batchUsers;

    if (accounts?.length) {
        const filterAccounts = accounts ? accounts.replace(/\s+/g, '').split(',') : [];
        batchUsers = uniqueUsers.filter(ad => filterAccounts.map(a => a.toLowerCase()).includes(ad.toLowerCase()));
    } else {
        batchUsers = uniqueUsers.slice(+pageOffset, +pageOffset + (+pageSize) - 1);
    }

    const positions = batchUsers.map((account, i) => [1, BigNumber.from('0'), BigNumber.from('0'), account, i]);
    await fillPositionsWithRetry(positions, comptroller, 4, 0);

    let shortfallAccounts = batchUsers.map((account, i) => {
        const [accLiqErr, extraBorrowableAmount, shortfallAmount] = positions[i];
        return {
            account,
            usdBorrowable: getBnToNumber(extraBorrowableAmount),
            usdShortfall: getBnToNumber(shortfallAmount),
        }
    });

    if (!accounts) {
        shortfallAccounts = shortfallAccounts.filter(p => p.usdShortfall > 0.1);
    }

    const borrowedAssets = await throttledPromises(
        (p) => {
            return Promise.all(
                contracts.map((contract, i) => {
                    return !borrowPaused[i] || [
                        '0x7Fcb7DAC61eE35b3D4a51117A7c58D53f0a8a670',
                        '0x17786f3813E6bA35343211bd8Fe18EC4de14F28b',
                        '0xde2af899040536884e062D3a334F2dD36F34b4a4',
                        '0x697b4acAa24430F254224eB794d2a85ba1Fa1FB8',
                        '0xD60B06B457bFf7fc38AC5E7eCE2b5ad16B288326',
                    ].includes(contract.address) ?
                        contract.borrowBalanceStored(p.account)
                        :
                        BigNumber.from('0');
                })
            );
        },
        shortfallAccounts,
        20,
        100
    )

    const [
        assetsIn,
    ] = await Promise.all([
        throttledPromises(
            position => comptroller.getAssetsIn(position.account),
            shortfallAccounts,
            20,
            100,
        )
    ])

    console.log('shortfallAccounts:' + shortfallAccounts.length);

    const positionDetails = shortfallAccounts.map((position, i) => {
        const { account } = position;
        const borrowed = borrowedAssets[i].map((b, j) => {
            const tokenBalance = getBnToNumber(b, marketDecimals[j]);
            return {
                balance: tokenBalance,
                usdWorth: tokenBalance * prices[j],
                marketIndex: j,
            }
        }).filter(b => b.balance > 0);

        const assetsInMarkets = assetsIn[i].filter(ad => allMarkets.includes(ad))
        const assetsInMarketIndexes = assetsInMarkets.map(ad => allMarkets.indexOf(ad)).filter(v => v !== -1)

        const supplied = assetsInMarketIndexes.map((marketIndex, j) => {
            const marketAd = allMarkets[marketIndex].toLowerCase();
            const anBalance = parseFloat(formatUnits(balances[account][marketAd] || 0, marketDecimals[marketIndex]));
            const exRate = exRates[marketIndex];
            const tokenBalance = anBalance * exRate;

            return {
                balance: tokenBalance,
                marketIndex,
                usdWorth: tokenBalance * prices[marketIndex]
            }
        }).filter(s => s.balance > 0);

        return {
            ...position,
            usdBorrowed: borrowed.reduce((prev, curr) => prev + curr.usdWorth, 0),
            usdSupplied: supplied.reduce((prev, curr) => prev + curr.usdWorth, 0),
            assetsIn: assetsInMarketIndexes,
            borrowed,
            supplied,
        }
    })

    console.log('positions details done')

    return {
        positionDetails: positionDetails,
        meta: {
            exRates,
            lastUpdate,
            marketDecimals,
            collateralFactors,
            prices,
            balances,
            uniqueUsers,
            borrowPaused,
            markets: allMarkets,
        },
    }
}