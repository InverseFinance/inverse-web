import { COMPTROLLER_ABI, CTOKEN_ABI, ERC20_ABI, ORACLE_ABI } from "@app/config/abis";
import { BigNumber, Contract } from "ethers";
import "source-map-support";
import { getNetworkConfig, getNetworkConfigConstants } from '@app/util/networks';
import { getProvider } from '@app/util/providers';
import { getCacheFromRedis, redisSetWithTimestamp } from '@app/util/redis';
import { getBnToNumber } from '@app/util/markets';
import { getTokenHolders } from '@app/util/covalent';
import { formatUnits } from '@ethersproject/units';
import { StringNumMap } from '@app/types';

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

export default async function handler(req, res) {
    const { accounts = '' } = req.query;
    // defaults to mainnet data if unsupported network
    const networkConfig = getNetworkConfig(process.env.NEXT_PUBLIC_CHAIN_ID!, true)!;
    const cacheKey = `${networkConfig.chainId}-positions-v1.0.1`;

    try {
        const {
            UNDERLYING,
            XINV_V1,
            XINV,
            COMPTROLLER,
            ORACLE,
            ANCHOR_CHAIN_COIN,
        } = getNetworkConfigConstants(networkConfig);

        const validCache = await getCacheFromRedis(cacheKey, true, 10);

        if (validCache && !accounts) {
            res.status(200).json(validCache);
            return
        }

        const provider = getProvider(networkConfig.chainId, process.env.POSITIONS_ALCHEMY_API, true);
        const comptroller = new Contract(COMPTROLLER, COMPTROLLER_ABI, provider);
        const oracle = new Contract(ORACLE, ORACLE_ABI, provider);
        const allMarkets: string[] = [...await comptroller.getAllMarkets()].filter(address => !!UNDERLYING[address])

        const contracts = allMarkets
            .map((address: string) => new Contract(address, CTOKEN_ABI, provider));

        const [
            underlyings,
            exRates,
            oraclePrices,
            borrowPaused,
            marketsDetails,
        ] = await Promise.all([
            Promise.all(contracts.map(contract => contract.address !== ANCHOR_CHAIN_COIN ? contract.underlying() : new Promise(r => r('')))),
            Promise.all(contracts.map((contract) => contract.callStatic.exchangeRateCurrent())),
            Promise.all(allMarkets.map(address => oracle.getUnderlyingPrice(address))),
            Promise.all(
                contracts.map((contract) =>
                    [XINV, XINV_V1].includes(contract.address) ? new Promise((r) => r(true)) : comptroller.borrowGuardianPaused(contract.address)
                )
            ),
            Promise.all(contracts.map((contract) => comptroller.markets(contract.address))),
        ])

        const holders = await Promise.all(
            contracts.map(contract => getTokenHolders(contract.address))
        )

        const usersSet = new Set();
        const balances = {};

        holders.forEach((res, i) => {
            res.data.items.forEach(anTokenHolder => {
                usersSet.add(anTokenHolder.address);
                if (!balances[anTokenHolder.address]) { balances[anTokenHolder.address] = {} }
                balances[anTokenHolder.address][anTokenHolder.contract_address] = anTokenHolder.balance;
            });
        });

        let uniqueUsers = Array.from(usersSet);

        if (accounts?.length) {
            const filterAccounts = accounts ? accounts.replace(/\s+/g, '').split(',') : [];
            uniqueUsers = uniqueUsers.filter(ad => filterAccounts.map(a => a.toLowerCase()).includes(ad.toLowerCase()));
        }

        const positions = uniqueUsers.map((account, i) => [1, BigNumber.from('0'), BigNumber.from('0'), account, i]);
        await fillPositionsWithRetry(positions, comptroller, 4, 0);

        let marketDecimals: number[] = await Promise.all(
            underlyings.map(underlying => underlying ? new Contract(underlying, ERC20_ABI, provider).decimals() : new Promise(r => r('18')))
        )
        marketDecimals = marketDecimals.map(v => parseInt(v));

        const collateralFactors = marketsDetails.map(m => parseFloat(formatUnits(m[1])));

        const prices: StringNumMap = oraclePrices
            .map((v, i) => {
                return parseFloat(formatUnits(v, BigNumber.from(36).sub(marketDecimals[i])))
            })

        let shortfallAccounts = uniqueUsers.map((account, i) => {
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

        const borrowedAssets = await Promise.all(
            shortfallAccounts.map(p => {
                return Promise.all(
                    contracts.map((contract, i) => {
                        return !borrowPaused[i] || [
                            '0x7Fcb7DAC61eE35b3D4a51117A7c58D53f0a8a670',
                            '0x17786f3813E6bA35343211bd8Fe18EC4de14F28b',
                            '0xde2af899040536884e062D3a334F2dD36F34b4a4',
                            '0x697b4acAa24430F254224eB794d2a85ba1Fa1FB8',
                        ].includes(contract.address) ?
                            contract.borrowBalanceStored(p.account)
                            :
                            BigNumber.from('0');
                    })
                );
            })
        )

        const [
            assetsIn,
        ] = await Promise.all([
            Promise.all(shortfallAccounts.map(position => comptroller.getAssetsIn(position.account))),
        ])

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
                const exRate = getBnToNumber(exRates[marketIndex]);
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

        positionDetails.sort((a, b) => b.usdShortfall - a.usdShortfall)

        const resultData = {
            lastUpdate: Date.now(),
            prices,
            collateralFactors,
            markets: allMarkets,
            marketDecimals,
            nbPositions: positionDetails.length,
            positions: positionDetails,
        };

        if (!accounts?.length) {
            await redisSetWithTimestamp(cacheKey, resultData);
        }

        res.status(200).json(resultData);

    } catch (err) {
        console.error(err);
        // if an error occured, try to return last cached results
        try {
            const cache = await getCacheFromRedis(cacheKey, false);
            if (cache) {
                console.log('Api call failed, returning last cache found');
                res.status(200).json(cache);
            }
        } catch (e) {
            console.error(e);
            res.status(500).json({ error: true });
        }
    }
};
