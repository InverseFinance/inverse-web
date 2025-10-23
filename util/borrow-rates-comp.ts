import { Contract } from "ethers";
import { getChainlinkDolaUsdPrice, getDbrPriceOnCurve, getDolaUsdPriceOnCurve } from "./f2";
import { formatUnits } from "@ethersproject/units";
import { aprToApy, getBnToNumber } from "./markets";
import { BLOCKS_PER_YEAR, BURN_ADDRESS } from "@app/config/constants";
import { firmCollaterals } from "@app/components/ThirdParties/tokenlist";
import { uniqueBy } from "./misc";

const USDC = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'
const DAI = '0x6B175474E89094C44Da98b954EedeAC495271d0F'
const USDT = '0xdac17f958d2ee523a2206206994597c13d831ec7'

const tokens = {
    USDC,
    DAI,
    USDT,
}

const links = {
    'aave-dai': 'https://app.aave.com/reserve-overview/?underlyingAsset=0x6b175474e89094c44da98b954eedeac495271d0f&marketName=proto_mainnet_v3',
    'aave-usdc': 'https://app.aave.com/reserve-overview/?underlyingAsset=0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48&marketName=proto_mainnet_v3',
    'compound-usdc': 'https://app.compound.finance/markets',
    // direct link has ipfs 404
    // 'compound-usdc': 'https://app.compound.finance/markets/usdc-mainnet',
    'curve-wbtc': 'https://crvusd.curve.fi/#/ethereum/markets/wbtc/create',
    'curve-wsteth': 'https://crvusd.curve.fi/#/ethereum/markets/wsteth/create',
    'curve-weth': 'https://crvusd.curve.fi/#/ethereum/markets/eth/create',
    'frax-susde': 'https://app.frax.finance/fraxlend/pair?address=0xb5Ae5b75C0DF5632c572A657109375646Ce66f90',
    'frax-crv': 'https://app.frax.finance/fraxlend/pair?address=0x3835a58CA93Cdb5f912519ad366826aC9a752510',
    'frax-wbtc': 'https://app.frax.finance/fraxlend/pair?address=0x32467a5fc2d72D21E8DCe990906547A2b012f382',
    'frax-sfrxeth': 'https://app.frax.finance/fraxlend/pair?address=0x78bB3aEC3d855431bd9289fD98dA13F9ebB7ef15',
    'frax-wsteth': 'https://app.frax.finance/fraxlend/pair?address=0xb5a46f712F03808aE5c4B885C6F598fA06442684',
}

export const getSiloRate = async () => {
    try {
        const res = await fetch("https://gateway-arbitrum.network.thegraph.com/api/41d8e9d9c63d206f22b98602980156de/deployments/id/QmeDLbKHYypURMRigRxSspUm8w5zrDfXc3Skw2PiDxqCFu", {
            "headers": {
                "accept": "*/*",
                "content-type": "application/json",
            },
            "body": "{\"query\":\"\\n    query QueryMarketInterestRates($siloAddress: String = \\\"0xfccc27aabd0ab7a0b2ad2b7760037b1eab61616b\\\") {\\n      silo(id: $siloAddress, block: { number_gte: 19990402 }) {\\n        id\\n        name\\n        rates {\\n          side\\n          token {\\n            id\\n            symbol\\n          }\\n          interestRateDaily(first: 1, orderBy: day, orderDirection: desc) {\\n            rateAvg\\n            day\\n          }\\n          interestRateHourly(first: 1, orderBy: hour, orderDirection: desc) {\\n            hour\\n            rateAvg\\n          }\\n        }\\n      }\\n    }\\n  \",\"operationName\":\"QueryMarketInterestRates\"}",
            "method": "POST",
        });
        const { data } = await res.json();
        return { project: 'Silo', type: 'variable', collateral: 'ETH/XAI', borrowRate: parseFloat(data.silo.rates.find(r => r.side === 'BORROWER' && r.token.symbol === 'USDC').interestRateHourly[0].rateAvg) }
    } catch (e) {
        console.log('Err fetching silo rate')
    }
    return { project: 'Silo', type: 'variable', borrowRate: 0 };
}

export const getCompoundRate = async (provider) => {
    const result = { project: 'Compound', hasLeverage: false, type: 'variable', collateral: 'Multiple', borrowToken: 'USDC', borrowRate: 0, link: links["compound-usdc"] }
    try {
        const contract = new Contract('0xc3d688B66703497DAA19211EEdff47f25384cdc3', [
            'function getUtilization() public view returns(uint)',
            'function getBorrowRate(uint) public view returns(uint)',
        ], provider);
        const utilization = await contract.getUtilization();
        const ratePerSec = await contract.getBorrowRate(utilization);
        const borrowApr = ratePerSec * 365 * 86400 / 1e18 * 100;
        const borrowApy = aprToApy(borrowApr, BLOCKS_PER_YEAR);
        return { ...result, borrowRate: borrowApy }
    } catch (e) {
        console.log('Err fetching compound rate');
    }
    return result;
}

export const getCrvUSDRate = async (market: string, collateral: string, provider) => {
    const crvRate = { project: 'Curve', hasLeverage: true, type: 'variable', borrowRate: 0, borrowToken: 'crvUSD', collateral, link: links[`curve-${collateral.toLowerCase()}`] };
    try {
        const contract = new Contract(market, ['function rate() public view returns (uint)'], provider);
        const rate = await contract.rate();
        const borrowApr = rate * 365 * 86400 / 1e18;
        const borrowApy = (Math.pow(1 + (borrowApr) / BLOCKS_PER_YEAR, BLOCKS_PER_YEAR) - 1) * 100;
        return { ...crvRate, borrowRate: borrowApy }
    } catch (e) {
        console.log('Err fetching crvUsd rate');
        console.log(e)
    }
    return crvRate
}

const getAaveRate = async (provider, underlying: string, symbol: string) => {
    const aaveRate = { project: 'Aave-V3', hasLeverage: false, type: 'variable', borrowRate: 0, collateral: 'Multiple', borrowToken: symbol, link: links[`aave-${symbol.toLowerCase()}`] };
    try {
        const contract = new Contract('0x41393e5e337606dc3821075Af65AeE84D7688CBD', [{"inputs":[{"internalType":"contract IPoolAddressesProvider","name":"addressesProvider","type":"address"}],"stateMutability":"nonpayable","type":"constructor"},{"inputs":[],"name":"ADDRESSES_PROVIDER","outputs":[{"internalType":"contract IPoolAddressesProvider","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"asset","type":"address"}],"name":"getATokenTotalSupply","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"getAllATokens","outputs":[{"components":[{"internalType":"string","name":"symbol","type":"string"},{"internalType":"address","name":"tokenAddress","type":"address"}],"internalType":"struct IPoolDataProvider.TokenData[]","name":"","type":"tuple[]"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"getAllReservesTokens","outputs":[{"components":[{"internalType":"string","name":"symbol","type":"string"},{"internalType":"address","name":"tokenAddress","type":"address"}],"internalType":"struct IPoolDataProvider.TokenData[]","name":"","type":"tuple[]"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"asset","type":"address"}],"name":"getDebtCeiling","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"getDebtCeilingDecimals","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"pure","type":"function"},{"inputs":[{"internalType":"address","name":"asset","type":"address"}],"name":"getFlashLoanEnabled","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"asset","type":"address"}],"name":"getInterestRateStrategyAddress","outputs":[{"internalType":"address","name":"irStrategyAddress","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"asset","type":"address"}],"name":"getIsVirtualAccActive","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"asset","type":"address"}],"name":"getLiquidationProtocolFee","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"asset","type":"address"}],"name":"getPaused","outputs":[{"internalType":"bool","name":"isPaused","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"asset","type":"address"}],"name":"getReserveCaps","outputs":[{"internalType":"uint256","name":"borrowCap","type":"uint256"},{"internalType":"uint256","name":"supplyCap","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"asset","type":"address"}],"name":"getReserveConfigurationData","outputs":[{"internalType":"uint256","name":"decimals","type":"uint256"},{"internalType":"uint256","name":"ltv","type":"uint256"},{"internalType":"uint256","name":"liquidationThreshold","type":"uint256"},{"internalType":"uint256","name":"liquidationBonus","type":"uint256"},{"internalType":"uint256","name":"reserveFactor","type":"uint256"},{"internalType":"bool","name":"usageAsCollateralEnabled","type":"bool"},{"internalType":"bool","name":"borrowingEnabled","type":"bool"},{"internalType":"bool","name":"stableBorrowRateEnabled","type":"bool"},{"internalType":"bool","name":"isActive","type":"bool"},{"internalType":"bool","name":"isFrozen","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"asset","type":"address"}],"name":"getReserveData","outputs":[{"internalType":"uint256","name":"unbacked","type":"uint256"},{"internalType":"uint256","name":"accruedToTreasuryScaled","type":"uint256"},{"internalType":"uint256","name":"totalAToken","type":"uint256"},{"internalType":"uint256","name":"totalStableDebt","type":"uint256"},{"internalType":"uint256","name":"totalVariableDebt","type":"uint256"},{"internalType":"uint256","name":"liquidityRate","type":"uint256"},{"internalType":"uint256","name":"variableBorrowRate","type":"uint256"},{"internalType":"uint256","name":"stableBorrowRate","type":"uint256"},{"internalType":"uint256","name":"averageStableBorrowRate","type":"uint256"},{"internalType":"uint256","name":"liquidityIndex","type":"uint256"},{"internalType":"uint256","name":"variableBorrowIndex","type":"uint256"},{"internalType":"uint40","name":"lastUpdateTimestamp","type":"uint40"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"asset","type":"address"}],"name":"getReserveTokensAddresses","outputs":[{"internalType":"address","name":"aTokenAddress","type":"address"},{"internalType":"address","name":"stableDebtTokenAddress","type":"address"},{"internalType":"address","name":"variableDebtTokenAddress","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"asset","type":"address"}],"name":"getSiloedBorrowing","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"asset","type":"address"}],"name":"getTotalDebt","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"asset","type":"address"}],"name":"getUnbackedMintCap","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"asset","type":"address"},{"internalType":"address","name":"user","type":"address"}],"name":"getUserReserveData","outputs":[{"internalType":"uint256","name":"currentATokenBalance","type":"uint256"},{"internalType":"uint256","name":"currentStableDebt","type":"uint256"},{"internalType":"uint256","name":"currentVariableDebt","type":"uint256"},{"internalType":"uint256","name":"principalStableDebt","type":"uint256"},{"internalType":"uint256","name":"scaledVariableDebt","type":"uint256"},{"internalType":"uint256","name":"stableBorrowRate","type":"uint256"},{"internalType":"uint256","name":"liquidityRate","type":"uint256"},{"internalType":"uint40","name":"stableRateLastUpdated","type":"uint40"},{"internalType":"bool","name":"usageAsCollateralEnabled","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"asset","type":"address"}],"name":"getVirtualUnderlyingBalance","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"}], provider);
        const reserveData = await contract.getReserveData(underlying);
        const reserveDataBorrowRate = parseFloat(formatUnits(reserveData[6], 27));
        const reserveDataSupplyRate = parseFloat(formatUnits(reserveData[5], 27));
        const borrowApy = aprToApy(reserveDataBorrowRate * 100, 365);
        const supplyApy = aprToApy(reserveDataSupplyRate * 100, 365);
        return { ...aaveRate, borrowRate: borrowApy, supplyRate: supplyApy }
    } catch (e) {
        console.log('Err fetching aave rate')
    }
    return aaveRate;
}

export const getFraxRate = async (provider, fraxlendMarket: string, collateral: string) => {
    const fraxRate = { project: 'Frax', hasLeverage: false, type: 'variable', borrowRate: 0, borrowToken: 'FRAX', collateral, link: links[`frax-${collateral.toLowerCase()}`] };
    try {
        const contract = new Contract(fraxlendMarket, ["function currentRateInfo() public view returns(tuple(uint64,uint64,uint64,uint64))"], provider);
        const infos = await contract.currentRateInfo();
        const ratePerSec = getBnToNumber(infos[3]);
        const apr = ratePerSec * 86400 * 365 * 100;
        const apy = aprToApy(apr, BLOCKS_PER_YEAR);
        return { ...fraxRate, borrowRate: apy, collateral }
    } catch (e) {
        console.log('Err fetching frax rate')
    }
    return fraxRate
}

export const getAaveV3RateDAI = async (provider) => {
    return getAaveRate(provider, DAI, 'DAI');
}

export const getAaveV3Rate = async (provider) => {
    return getAaveRate(provider, USDC, 'USDC');
}

export const getAaveV3RateOf = async (provider, symbol: 'DAI' | 'USDC' | 'USDT') => {
    return getAaveRate(provider, tokens[symbol], symbol);
}

export const getFirmRate = async (provider) => {
    const firmRate = { project: 'FiRM', hasLeverage: true, borrowRate: 0, type: 'fixed', collateral: 'Multiple', borrowToken: 'DOLA', link: 'https://inverse.finance/firm' };
    try {
        const { price: dolaPrice } = await getDolaUsdPriceOnCurve(provider);
        return { ...firmRate, borrowRate: (await getDbrPriceOnCurve(provider)).priceInDola * dolaPrice * 100 }
    } catch (e) {
        console.log('Err fetching compound rate');
    }
    return firmRate
}

export const getSparkRate = async () => {
    return { project: 'Spark', hasLeverage: false, borrowRate: 5.99, type: 'variable', collateral: 'Multiple', borrowToken: 'DAI', link: 'https://app.spark.fi' };
}

export const getFluidRates = async () => {
    const res = await fetch(`https://api.fluid.instadapp.io/v2/1/vaults`);
    const data = await res.json();
    const firmCollateralsLower = firmCollaterals.map(c => c.toLowerCase());
    const filteredResults = data
        .filter(vault => {
            return firmCollateralsLower.includes(vault.supplyToken.token0.symbol.toLowerCase()) && vault.supplyToken?.token1?.address === BURN_ADDRESS && vault.borrowToken.token0.symbol === 'USDC' && vault.borrowToken?.token1?.address === BURN_ADDRESS;
        });
    const results = filteredResults.map(vault => {
        return { project: 'Fluid', hasLeverage: true, borrowRate: vault.borrowRate.vault.rate / 100, type: 'variable', collateral: vault.supplyToken.token0.symbol, borrowToken: vault.borrowToken.token0.symbol, link: `https://app.fluid.finance/vaults/1/${vault.id}` }
    });
    return uniqueBy(results, (a, b) => a.collateral === b.collateral && a.borrowToken === b.borrowToken);
}