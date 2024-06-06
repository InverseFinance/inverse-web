import { Contract } from "ethers";
import { getDbrPriceOnCurve } from "./f2";
import { formatUnits } from "@ethersproject/units";
import { aprToApy, getBnToNumber } from "./markets";

const USDC = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'
const DAI = '0x6B175474E89094C44Da98b954EedeAC495271d0F'

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

export const getCompoundRate = async () => {
    try {
        const res = await fetch("https://v3-api.compound.finance/market/all-networks/all-contracts/summary");
        const data = await res.json();
        return { project: 'Compound', type: 'variable', borrowRate: parseFloat(data.find(r => r.comet.address === '0xc3d688b66703497daa19211eedff47f25384cdc3').borrow_apr) * 100 }
    } catch (e) {
        console.log('Err fetching compound rate');
    }
    return { project: 'Compound', type: 'variable', borrowRate: 0 };
}

// WBTC
export const getCrvUSDRate = async (market: string, collateral: string, provider) => {
    try {
        const contract = new Contract(market, ['function rate() public view returns (uint)'], provider);
        const rate = await contract.rate();
        const borrowApr = rate * 365 * 86400 / 1e18;
        const borrowApy = (Math.pow(1 + (borrowApr) / 2609750, 2609750) - 1) * 100;
        return { project: 'Curve', type: 'variable', collateral, borrowRate: borrowApy, borrowToken: 'crvUSD' }
    } catch (e) {
        console.log('Err fetching crvUsd rate');
        console.log(e)
    }
    return { project: 'Curve', type: 'variable', collateral, borrowRate: 0, borrowToken: 'crvUSD' };
}

const getAaveRate = async (provider, underlying: string, symbol: string) => {
    try {
        const contract = new Contract('0x7B4EB56E7CD4b454BA8ff71E4518426369a138a3', [{ "inputs": [{ "internalType": "address", "name": "asset", "type": "address" }], "name": "getReserveData", "outputs": [{ "internalType": "uint256", "name": "unbacked", "type": "uint256" }, { "internalType": "uint256", "name": "accruedToTreasuryScaled", "type": "uint256" }, { "internalType": "uint256", "name": "totalAToken", "type": "uint256" }, { "internalType": "uint256", "name": "totalStableDebt", "type": "uint256" }, { "internalType": "uint256", "name": "totalVariableDebt", "type": "uint256" }, { "internalType": "uint256", "name": "liquidityRate", "type": "uint256" }, { "internalType": "uint256", "name": "variableBorrowRate", "type": "uint256" }, { "internalType": "uint256", "name": "stableBorrowRate", "type": "uint256" }, { "internalType": "uint256", "name": "averageStableBorrowRate", "type": "uint256" }, { "internalType": "uint256", "name": "liquidityIndex", "type": "uint256" }, { "internalType": "uint256", "name": "variableBorrowIndex", "type": "uint256" }, { "internalType": "uint40", "name": "lastUpdateTimestamp", "type": "uint40" }], "stateMutability": "view", "type": "function" }], provider);
        const reserveData = await contract.getReserveData(underlying);
        const reserveDataBorrowRate = parseFloat(formatUnits(reserveData[6], 27));
        const apy = aprToApy(reserveDataBorrowRate * 100, 365);
        return { project: 'Aave V3', type: 'variable', borrowRate: apy, borrowToken: symbol }
    } catch (e) {
        console.log('Err fetching aave rate')
    }
    return { project: 'Aave V3', type: 'variable', borrowRate: 0, borrowToken: symbol };
}

export const getFraxRate = async (provider, fraxlendMarket: string, collateral: string) => {
    try {
        const contract = new Contract(fraxlendMarket, ["function currentRateInfo() public view returns(tuple(uint64,uint64,uint64,uint64))"], provider);
        const infos = await contract.currentRateInfo();
        const ratePerSec = getBnToNumber(infos[3]);
        const apr = ratePerSec * 86400 * 365 * 100;
        const apy = aprToApy(apr, 365);
        return { project: 'Frax', type: 'variable', borrowRate: apy, borrowToken: 'FRAX', collateral, ratePerSec }
    } catch (e) {
        console.log('Err fetching frax rate')
    }
    return { project: 'Frax', type: 'variable', borrowRate: 0, borrowToken: 'FRAX', collateral };
}

export const getAaveV3RateDAI = async (provider) => {
    return getAaveRate(provider, DAI, 'DAI');
}

export const getAaveV3Rate = async (provider) => {
    return getAaveRate(provider, USDC, 'USDC');
}

export const getFirmRate = async (provider) => {
    try {
        return { project: 'FiRM', borrowRate: (await getDbrPriceOnCurve(provider)).priceInDola * 100, type: 'fixed', borrowToken: 'DOLA' }
    } catch (e) {
        console.log('Err fetching compound rate');
    }
    return { project: 'FiRM', borrowRate: 0, type: 'fixed', borrowToken: 'DOLA' };
}