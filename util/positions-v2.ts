import { COMPTROLLER_ABI, CTOKEN_ABI, ORACLE_ABI } from "@app/config/abis";
import { BigNumber, Contract } from "ethers";
import "source-map-support";
import { getNetworkConfigConstants } from '@app/util/networks';
import { getProvider } from '@app/util/providers';
import { getBnToNumber } from '@app/util/markets';
import { formatUnits } from '@ethersproject/units';
import { getGroupedMulticallOutputs } from "./multicall";
import { FRONTIER_POSITIONS_SNAPSHOT } from "@app/fixtures/frontier";

const ILLIQUID_MARKETS = [
    '0x17786f3813E6bA35343211bd8Fe18EC4de14F28b',
    '0xde2af899040536884e062D3a334F2dD36F34b4a4',
    '0x697b4acAa24430F254224eB794d2a85ba1Fa1FB8',
];

const MARKETS = ["0x7Fcb7DAC61eE35b3D4a51117A7c58D53f0a8a670", "0x697b4acAa24430F254224eB794d2a85ba1Fa1FB8", "0x17786f3813E6bA35343211bd8Fe18EC4de14F28b", "0xD60B06B457bFf7fc38AC5E7eCE2b5ad16B288326", "0xde2af899040536884e062D3a334F2dD36F34b4a4", "0x65b35d6Eb7006e0e607BC54EB2dFD459923476fE", "0xA978D807614c3BFB0f90bC282019B2898c617880", "0xc528b0571D0BE4153AEb8DdB8cCeEE63C3Dd7760", "0x4B228D99B9E5BeD831b8D7D2BCc88882279A16BB", "0x1637e4e9941D55703a7A5E7807d6aDA3f7DCD61B", "0x3cFd8f5539550cAa56dC901f09C69AC9438E0722", "0xD79bCf0AD38E06BC0be56768939F57278C7c42f7", "0x4597a4cf0501b853b029cE5688f6995f753efc04", "0x7e18AB8d87F3430968f0755A623FB35017cB3EcA", "0xE809aD1577B7fF3D912B9f90Bf69F8BeCa5DCE32", "0xD924Fc65B448c7110650685464c8855dd62c30c0", "0xa6F1a358f0C2e771a744AF5988618bc2E198d0A0", "0xE8A2eb30E9AB1b598b6a5fc4aa1B80dfB6F90753", "0x8e103Eb7a0D01Ab2b2D29C91934A9aD17eB54b86", "0x55e9022e1E28831609B22F773fAdb41318F8a8Cc", "0xb7159DfbAB6C99d3d38CFb4E419eb3F6455bB547", "0x1429a930ec3bcf5Aa32EF298ccc5aB09836EF587", "0xD904235Dc0CD28f42AEECc0CD6A7126d871edaa4"];
const MARKET_DECIMALS = FRONTIER_POSITIONS_SNAPSHOT.marketDecimals;
const UNIQUE_USERS = FRONTIER_POSITIONS_SNAPSHOT.uniqueUsers;
const SHORT_LIST_DOLA_USERS = FRONTIER_POSITIONS_SNAPSHOT.positions.filter(p => p.dolaBorrowed > 1).map(p => p.account.toLowerCase());
const SHORT_LIST_USERS_POST_BORROW_PAUSED = FRONTIER_POSITIONS_SNAPSHOT.positions.filter(p => p.usdBorrowed > 1).map(p => p.account.toLowerCase());

const marketsWithBorrowingHistory = [
    '0x7Fcb7DAC61eE35b3D4a51117A7c58D53f0a8a670',
    '0x17786f3813E6bA35343211bd8Fe18EC4de14F28b',
    '0xde2af899040536884e062D3a334F2dD36F34b4a4',
    '0x697b4acAa24430F254224eB794d2a85ba1Fa1FB8',
    '0xD60B06B457bFf7fc38AC5E7eCE2b5ad16B288326',
];

const zeroBn = BigNumber.from('0');

export const getHistoricalFrontierPositionsDetails = async ({
    accounts,
    pageSize,
    pageOffset,
    blockNumber,
    useShortlist = false,
    useDolaShortlist = false,
}: {
    accounts: string[]
    pageSize: string | number
    pageOffset: string | number
    blockNumber: number
    useShortlist?: boolean
    useDolaShortlist?: boolean
}) => {
    const {
        UNDERLYING,
        COMPTROLLER,
        ORACLE,
    } = getNetworkConfigConstants(process.env.NEXT_PUBLIC_CHAIN_ID!);

    const provider = getProvider(process.env.NEXT_PUBLIC_CHAIN_ID!, process.env.POSITIONS_ALCHEMY_API, true);
    const comptroller = new Contract(COMPTROLLER, COMPTROLLER_ABI, provider);
    const oracle = new Contract(ORACLE, ORACLE_ABI, provider);
    const allMarkets: string[] = MARKETS.filter(address => !!UNDERLYING[address])

    const contracts = allMarkets
        .map((address: string) => new Contract(address, CTOKEN_ABI, provider));

    let exRates, collateralFactors, prices, batchUsers, lastUpdate;
    const marketDecimals = MARKET_DECIMALS;
    const uniqueUsers = useDolaShortlist ? SHORT_LIST_DOLA_USERS : useShortlist ? SHORT_LIST_USERS_POST_BORROW_PAUSED : UNIQUE_USERS;

    if (accounts?.length) {
        const filterAccounts = accounts ? accounts.replace(/\s+/g, '').split(',') : [];
        batchUsers = uniqueUsers.filter(ad => filterAccounts.map(a => a.toLowerCase()).includes(ad.toLowerCase()));
    } else {
        batchUsers = uniqueUsers.slice(+pageOffset, +pageOffset + (+pageSize) - 1);
    }

    const [
        bnExRates,
        cashes,
        oraclePrices,
        marketsDetails,
        assetsIn,
        borrowedAssetsFlat,
        balancesAssetsFlat,
    ] = await getGroupedMulticallOutputs(
        [
            contracts.map(contract => {
                return { contract, functionName: 'exchangeRateStored' }
            }),
            contracts.map(contract => {
                return { contract, functionName: 'getCash' }
            }),
            allMarkets.map(market => {
                return { contract: oracle, functionName: 'getUnderlyingPrice', params: [market], fallbackValue: zeroBn }
            }),
            contracts.map(contract => {
                return { contract: comptroller, functionName: 'markets', params: [contract.address], fallbackValue: true }
            }),
            batchUsers.map(a => {
                return { contract: comptroller, functionName: 'getAssetsIn', params: [a], fallbackValue: [] }
            }),
            batchUsers.map(a => {
                return contracts.map(contract => {
                    return { contract, functionName: 'borrowBalanceStored', params: [a], forceFallback: !marketsWithBorrowingHistory.includes(contract.address), fallbackValue: zeroBn }
                })
            }).flat().filter(callReq => !!callReq.contract?.address),
            batchUsers.map(a => {
                return contracts.map(contract => {
                    return { contract, functionName: 'balanceOf', params: [a], fallbackValue: zeroBn }
                })
            }).flat().filter(callReq => !!callReq.contract?.address),
        ],
        1,
        blockNumber,
    );

    exRates = bnExRates.map(v => getBnToNumber(v));    
    collateralFactors = marketsDetails.map(m => !m || !m[1] ? 0 : parseFloat(formatUnits(m[1])));
    const liquidities = cashes.map((v, i) => getBnToNumber(v, marketDecimals[i]));

    prices = oraclePrices
        .map((v, i) => {
            return parseFloat(formatUnits(v, BigNumber.from(36).sub(marketDecimals[i])))
        })

    lastUpdate = Date.now();

    const shortfallAccounts = batchUsers.map((account) => {
        return { account }
    })
    const borrowedAssets = batchUsers.map((account, i) => {
        return borrowedAssetsFlat.slice(i * allMarkets.length, (i + 1) * allMarkets.length);
    });

    const balancesAssets = batchUsers.map((account, i) => {
        return balancesAssetsFlat.slice(i * allMarkets.length, (i + 1) * allMarkets.length);
    });

    const positionDetails = shortfallAccounts.map((position, i) => {
        let dolaBorrowed = 0;
        const borrowed = borrowedAssets[i].map((b, j) => {
            const tokenBalance = getBnToNumber(b || zeroBn, marketDecimals[j]);
            if (allMarkets[j] === '0x7Fcb7DAC61eE35b3D4a51117A7c58D53f0a8a670') {
                dolaBorrowed = tokenBalance;
            }
            return {
                balance: tokenBalance,
                usdWorth: tokenBalance * prices[j],
                marketIndex: j,
            }
        }).filter(b => b.balance > 0);
        const assetsInMarkets = assetsIn[i]?.filter(ad => allMarkets.includes(ad)) || [];
        const assetsInMarketIndexes = assetsInMarkets.map(ad => allMarkets.indexOf(ad)).filter(v => v !== -1)

        const supplied = assetsInMarketIndexes.map((marketIndex, j) => {
            const anBalance = getBnToNumber(balancesAssets[i][marketIndex] || zeroBn, marketDecimals[marketIndex]);
            const exRate = exRates[marketIndex];
            const tokenBalance = anBalance * exRate;
            const isIlliquid = liquidities[marketIndex] * prices[marketIndex] < tokenBalance * prices[marketIndex];
            const liquidPrice = (isIlliquid ? 0 : prices[marketIndex]);

            return {
                balance: tokenBalance,
                marketIndex,
                usdWorth: tokenBalance * prices[marketIndex],
                usdBackingPower: tokenBalance * prices[marketIndex] * collateralFactors[marketIndex],
                usdLiquidBacking: tokenBalance * liquidPrice,
                usdLiquidBackingPower: tokenBalance * liquidPrice * collateralFactors[marketIndex],
            }
        }).filter(s => s.balance > 0);

        const usdBackingPower = supplied.reduce((prev, curr) => prev + curr.usdBackingPower, 0);
        const usdLiquidBackingPower = supplied.reduce((prev, curr) => prev + curr.usdLiquidBackingPower, 0);
        const usdBorrowed = borrowed.reduce((prev, curr) => prev + curr.usdWorth, 0);
        const liquidHealth = usdLiquidBackingPower - usdBorrowed;
        const liquidShortfall = Math.abs(Math.min(liquidHealth, 0));
        const usdShortfall = Math.abs(Math.min(usdBackingPower - usdBorrowed, 0));

        return {
            ...position,
            usdShortfall,
            usdBorrowable: Math.abs(Math.max(usdBackingPower - usdBorrowed, 0)),
            usdBorrowed,
            usdSupplied: supplied.reduce((prev, curr) => prev + curr.usdWorth, 0),
            usdLiquidBacking: supplied.reduce((prev, curr) => prev + curr.usdLiquidBacking, 0),
            usdLiquidBackingPower,
            dolaBorrowed,
            dolaBadDebt: liquidShortfall > 0 ? dolaBorrowed >= usdBorrowed * 0.98 ? (dolaBorrowed - usdLiquidBackingPower) : dolaBorrowed : 0,
            dolaBadDebtClassic: usdShortfall > 0 ? dolaBorrowed >= usdBorrowed * 0.98 ? (dolaBorrowed - usdBackingPower) : dolaBorrowed : 0,
            assetsIn: assetsInMarketIndexes,
            liquidHealth,
            liquidShortfall,
            borrowed,
            supplied,
        }
    })

    return {
        positionDetails: positionDetails,
        meta: {
            exRates,
            lastUpdate,
            marketDecimals,
            collateralFactors,
            prices,
            liquidPrices: prices.map((price, i) => ILLIQUID_MARKETS.includes(allMarkets[i]) ? 0 : price),
            uniqueUsers,
            markets: allMarkets,
        },
    }
}