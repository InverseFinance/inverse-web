import { COMPTROLLER_ABI, CTOKEN_ABI, ERC20_ABI, ORACLE_ABI } from "@app/config/abis";
import { BigNumber, Contract } from "ethers";
import "source-map-support";
import { getNetworkConfig, getNetworkConfigConstants } from '@app/util/networks';
import { getProvider } from '@app/util/providers';
import { getCacheFromRedis, redisSetWithTimestamp } from '@app/util/redis';
import { getBnToNumber } from '@app/util/markets';
import { getTokenHolders } from '@app/util/covalent';
import { formatUnits, parseUnits } from '@ethersproject/units';
import { StringNumMap } from '@app/types';

export default async function handler(req, res) {
    // defaults to mainnet data if unsupported network
    const networkConfig = getNetworkConfig(process.env.NEXT_PUBLIC_CHAIN_ID!, true)!;
    const cacheKey = `${networkConfig.chainId}-positions-v1.3.3`;

    try {
        const {
            UNDERLYING,
            XINV_V1,
            XINV,
            COMPTROLLER,
            ORACLE,
            ANCHOR_CHAIN_COIN,
        } = getNetworkConfigConstants(networkConfig);

        // const validCache = await getCacheFromRedis(cacheKey, true, parseInt(process.env.NEXT_PUBLIC_CHAIN_SECONDS_PER_BLOCK!));
        const validCache = await getCacheFromRedis(cacheKey, true, 999999);
        if (validCache) {
            res.status(200).json(validCache);
            return
        }

        const provider = getProvider(networkConfig.chainId, process.env.ALCHEMY_API, true);
        const comptroller = new Contract(COMPTROLLER, COMPTROLLER_ABI, provider);
        const oracle = new Contract(ORACLE, ORACLE_ABI, provider);
        const allMarkets: string[] = [...await comptroller.getAllMarkets()].filter(address => !!UNDERLYING[address])
        const contractAddresses = allMarkets.filter(address => !!UNDERLYING[address])

        const contracts = allMarkets
            // .filter((address: string) => address !== XINV && address !== XINV_V1)
            .map((address: string) => new Contract(address, CTOKEN_ABI, provider));

        const holders = await Promise.all(
            contracts.map(contract => getTokenHolders(contract.address))
        )

        const usersSet = new Set();
        const balances = {};

        holders.forEach((res, i) => {
            res.data.items.forEach(anTokenHolder => {
                usersSet.add(anTokenHolder.address);
                if(!balances[anTokenHolder.address]){ balances[anTokenHolder.address] = {} }
                balances[anTokenHolder.address][anTokenHolder.contract_address] = anTokenHolder.balance;
            });
        });

        const uniqueUsers = Array.from(usersSet);

        const [
            positions,
            assetsIn,
            underlyings,
            exRates,
            oraclePrices,
        ] = await Promise.all([
            Promise.all(uniqueUsers.map(account => comptroller.getAccountLiquidity(account))),
            Promise.all(uniqueUsers.map(account => comptroller.getAssetsIn(account))),
            Promise.all(contracts.map(contract => contract.address !== ANCHOR_CHAIN_COIN ? contract.underlying() : new Promise(r => r('')) )),
            Promise.all(contracts.map((contract) => contract.callStatic.exchangeRateCurrent())),
            Promise.all(allMarkets.map(address => oracle.getUnderlyingPrice(address))),
        ])

        let marketDecimals: number[] = await Promise.all(
            underlyings.map(underlying => underlying ? new Contract(underlying, ERC20_ABI, provider).decimals() : new Promise(r => r('18')))
        )
        marketDecimals = marketDecimals.map(v => parseInt(v));

        const prices: StringNumMap = oraclePrices
            .map((v, i) => {
                return parseFloat(formatUnits(v, BigNumber.from(36).sub(marketDecimals[i])))
            })

        // res.status(200).json({ marketDecimals, underlyings, prices })
        // return

        // const borrowedAssets = await Promise.all(
        //     uniqueUsers.map(account => {
        //         return Promise.all(
        //             contracts.map(contract => {
        //                 return contract.borrowBalanceStored(account);
        //             })
        //         );
        //     })
        // )

        const positionDetails = uniqueUsers.map((account, i) => {
            const [accLiqErr, extraBorrowableAmount, shortfallAmount] = positions[i]
            // const borrowed = borrowedAssets[i].map((b, j) => {
            //     // const underlying = UNDERLYING[contracts[j].address];
            //     return {
            //         value: getBnToNumber(b, marketDecimals[j]),
            //         marketIndex: j,
            //     }
            // });

            const assetsInMarkets = assetsIn[i].filter(ad => allMarkets.includes(ad))
            const assetsInMarketIndexes = assetsInMarkets.map(ad => allMarkets.indexOf(ad)).filter(v => v !== -1)

            // const supplied = assetsInMarkets.map((anCollateralAd, j) => {
            //     // const underlying = UNDERLYING[contracts[j].address];
            //     const marketIndex = assetsInMarketIndexes[j];
            //     const balance = getBnToNumber(parseUnits((balances[account][anCollateralAd]||0).toString(), marketDecimals[marketIndex]), marketDecimals[marketIndex])
            //     return {
            //         value: balance * getBnToNumber(exRates[marketIndex]),
            //         marketIndex,
            //         balance: balance,
            //         balance2: balances[account][anCollateralAd],
            //         anCollateralAd,
            //         exRate: getBnToNumber(exRates[marketIndex]),
            //     }
            // });

            return {
                account,
                usdBorrowable: getBnToNumber(extraBorrowableAmount),
                usdShortfall: getBnToNumber(shortfallAmount),
                // usdBorrowed: borrowed.reduce((prev, curr) => prev + curr.value * prices[curr.marketIndex], 0),
                // usdSupplied: supplied.reduce((prev, curr) => prev + curr.value * prices[curr.marketIndex], 0),
                assetsIn: assetsInMarketIndexes,
                // borrowed,
                // supplied,
            }
        })

        positionDetails.sort((a, b) => b.usdShortfall - a.usdShortfall)

        const resultData = {
            prices,
            markets: allMarkets,
            marketDecimals,
            nbPositions: positionDetails.length,
            positions: positionDetails,
        };

        await redisSetWithTimestamp(cacheKey, resultData);
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
