import { COMPTROLLER_ABI, CTOKEN_ABI, XINV_ABI, ORACLE_ABI } from "./config/abis";
import {
  ANCHOR_ETH,
  ANCHOR_WBTC,
  BLOCKS_PER_DAY,
  COMPTROLLER,
  DAYS_PER_YEAR,
  ETH_MANTISSA,
  INV,
  TOKENS,
  UNDERLYING,
  XINV,
  ORACLE
} from "./config/constants";
import { AlchemyProvider } from "@ethersproject/providers";
import { Contract, BigNumber } from "ethers";
import { formatUnits } from "ethers/lib/utils";
import "source-map-support";
import * as fetch from "node-fetch";

const toApy = (rate) =>
  (Math.pow((rate / ETH_MANTISSA) * BLOCKS_PER_DAY + 1, DAYS_PER_YEAR) - 1) *
  100;

export default async function handler(req, res) {
  try {
    const provider = new AlchemyProvider("homestead", process.env.ALCHEMY_API);
    const comptroller = new Contract(COMPTROLLER, COMPTROLLER_ABI, provider);
    const oracle = new Contract(ORACLE, ORACLE_ABI, provider);
    const addresses = await comptroller.getAllMarkets();
    const contracts = addresses
      .filter((address: string) => address !== XINV)
      .map((address: string) => new Contract(address, CTOKEN_ABI, provider));

    const [
      reserveFactors,
      totalReserves,
      totalBorrows,
      supplyRates,
      borrowRates,
      cashes,
      collateralFactors,
      speeds,
      totalSupplies,
      exchangeRates,
      borrowPaused,
      oraclePrices,
    ]: any = await Promise.all([
      Promise.all(contracts.map((contract) => contract.reserveFactorMantissa())),
      Promise.all(contracts.map((contract) => contract.totalReserves())),
      Promise.all(contracts.map((contract) => contract.totalBorrows())),
      Promise.all(contracts.map((contract) => contract.supplyRatePerBlock())),
      Promise.all(contracts.map((contract) => contract.borrowRatePerBlock())),
      Promise.all(contracts.map((contract) => contract.getCash())),
      Promise.all(
        contracts.map((contract) => comptroller.markets(contract.address))
      ),
      Promise.all(
        contracts.map((contract) => comptroller.compSpeeds(contract.address))
      ),
      Promise.all(contracts.map((contract) => contract.totalSupply())),
      Promise.all(
        contracts.map((contract) => contract.callStatic.exchangeRateCurrent())
      ),
      Promise.all(
        contracts.map((contract) =>
          comptroller.borrowGuardianPaused(contract.address)
        )
      ),
      Promise.all(addresses.map(address => oracle.getUnderlyingPrice(address))),
    ]);
    const prices = oraclePrices
      .map((v,i) => parseFloat(formatUnits(v, BigNumber.from(36).sub(UNDERLYING[addresses[i]].decimals))))
      .reduce((p,v,i) => ({...p, [addresses[i]]:v}), {})
    const supplyApys = supplyRates.map((rate) => toApy(rate));
    const borrowApys = borrowRates.map((rate) => toApy(rate));
    const rewardApys = speeds.map((speed, i) => {
      const underlying = UNDERLYING[contracts[i].address];
      return toApy(
        (speed * prices[XINV]) /
          (parseFloat(
            formatUnits(totalSupplies[i].toString(), underlying.decimals)
          ) *
            parseFloat(formatUnits(exchangeRates[i])) *
            prices[contracts[i].address])
      );
    });

    const markets = contracts.map(({ address }, i) => {
      const underlying = address !== ANCHOR_ETH ? UNDERLYING[address] : TOKENS.ETH
      return {
        token: address,
        underlying,
        supplyApy: supplyApys[i],
        borrowApy: borrowApys[i],
        rewardApy: rewardApys[i],
        borrowable: !borrowPaused[i],
        liquidity: parseFloat(
          formatUnits(cashes[i], contracts[i].address === ANCHOR_WBTC ? 8 : 18)
        ),
        totalReserves: parseFloat(
          formatUnits(totalReserves[i], contracts[i].address === ANCHOR_WBTC ? 8 : 18)
        ),
        totalBorrows: parseFloat(
          formatUnits(totalBorrows[i], contracts[i].address === ANCHOR_WBTC ? 8 : 18)
        ),
        collateralFactor: parseFloat(formatUnits(collateralFactors[i][1])),
        reserveFactor: parseFloat(formatUnits(reserveFactors[i])),
        supplied: parseFloat(formatUnits(exchangeRates[i])) * parseFloat(formatUnits(totalSupplies[i], underlying.decimals))
      }
  });

    const xINV = new Contract(XINV, XINV_ABI, provider);

    const [
      rewardPerBlock,
      exchangeRate,
      totalSupply,
      collateralFactor,
    ] = await Promise.all([
      xINV.rewardPerBlock(),
      xINV.exchangeRateStored(),
      xINV.totalSupply(),
      comptroller.markets(xINV.address),
    ]);

    markets.push({
      token: xINV.address,
      underlying: TOKENS[INV],
      supplyApy:
        (((rewardPerBlock / ETH_MANTISSA) * BLOCKS_PER_DAY * DAYS_PER_YEAR) /
          ((totalSupply / ETH_MANTISSA) * (exchangeRate / ETH_MANTISSA))) *
        100,
      collateralFactor: parseFloat(formatUnits(collateralFactor[1])),
      supplied: parseFloat(formatUnits(exchangeRate)) * parseFloat(formatUnits(totalSupply))
    });

    res.status(200).json( {
      markets,
    });
  } catch (err) {
    console.error(err);
  }
};
