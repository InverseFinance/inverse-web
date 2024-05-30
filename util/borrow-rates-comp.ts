import { Contract } from "ethers";
import { formatUnits } from "viem";

const USDC = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';

// compare borrow DOLA rate with USDC borrow rates

export const getSiloRate = async () => {
    try {
        const res = await fetch("https://gateway-arbitrum.network.thegraph.com/api/41d8e9d9c63d206f22b98602980156de/deployments/id/QmeDLbKHYypURMRigRxSspUm8w5zrDfXc3Skw2PiDxqCFu", {
            "headers": {
                "accept": "*/*",
                "content-type": "application/json",
            },
            "body": "{\"query\":\"    query QueryMarketInterestRates($siloAddress: String = \\\"0xfccc27aabd0ab7a0b2ad2b7760037b1eab61616b\\\") {      silo(id: $siloAddress, block: { number_gte: 19981874 }) {        id        name        rates {          side          token {            id            symbol          }          interestRateDaily(first: 1, orderBy: day, orderDirection: desc) {            rateAvg            day          }        }      }    }  \",\"operationName\":\"QueryMarketInterestRates\"}",
            "method": "POST",
        });
        const { data } = await res.json();
        return { borrowRate: data.silo.rates.find(r => r.side === 'BORROWER' && r.token.symbol === 'USDC').interestRateDaily[0].rateAvg }
    } catch (e) {
        console.log('Err fetching silo rate')
    }
    return { borrowRate: 0 };
}

export const getCompoundRate = async () => {
    try {
        const res = await fetch("https://v3-api.compound.finance/market/all-networks/all-contracts/summary");
        const data = await res.json();
        return { borrowRate: parseFloat(data.find(r => r.comet.address === '0xc3d688b66703497daa19211eedff47f25384cdc3').borrow_apr)*100 }
    } catch (e) {
        console.log('Err fetching compound rate');
    }
    return { borrowRate: 0 };
}

export const getAaveV3Rate = async (provider) => {
    try {
        const contract = new Contract('0x7B4EB56E7CD4b454BA8ff71E4518426369a138a3', [{ "inputs": [{ "internalType": "address", "name": "asset", "type": "address" }], "name": "getReserveData", "outputs": [{ "internalType": "uint256", "name": "unbacked", "type": "uint256" }, { "internalType": "uint256", "name": "accruedToTreasuryScaled", "type": "uint256" }, { "internalType": "uint256", "name": "totalAToken", "type": "uint256" }, { "internalType": "uint256", "name": "totalStableDebt", "type": "uint256" }, { "internalType": "uint256", "name": "totalVariableDebt", "type": "uint256" }, { "internalType": "uint256", "name": "liquidityRate", "type": "uint256" }, { "internalType": "uint256", "name": "variableBorrowRate", "type": "uint256" }, { "internalType": "uint256", "name": "stableBorrowRate", "type": "uint256" }, { "internalType": "uint256", "name": "averageStableBorrowRate", "type": "uint256" }, { "internalType": "uint256", "name": "liquidityIndex", "type": "uint256" }, { "internalType": "uint256", "name": "variableBorrowIndex", "type": "uint256" }, { "internalType": "uint40", "name": "lastUpdateTimestamp", "type": "uint40" }], "stateMutability": "view", "type": "function" }], provider);
        const reserveData = await contract.getReserveData(USDC);
        return { borrowRate: parseFloat(formatUnits(reserveData[6], 25)) }
    } catch (e) {
        console.log('Err fetching aave rate')
    }
    return { borrowRate: 0 };
}