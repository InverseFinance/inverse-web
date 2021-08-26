import { COMPTROLLER_ABI, CTOKEN_ABI, XINV_ABI } from "./config/abis";
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
} from "./config/constants";
import { InfuraProvider } from "@ethersproject/providers";
import { Contract } from "ethers";
import { formatUnits } from "ethers/lib/utils";
import "source-map-support";
import * as fetch from "node-fetch";

const toApy = (rate) =>
  (Math.pow((rate / ETH_MANTISSA) * BLOCKS_PER_DAY + 1, DAYS_PER_YEAR) - 1) *
  100;

export default async function handler(req, res) {
  try {
    const provider = new InfuraProvider("homestead", process.env.INFURA_ID);
    const comptroller = new Contract(COMPTROLLER, COMPTROLLER_ABI, provider);
    const addresses = await comptroller.getAllMarkets();
    const contracts = addresses
      .filter((address: string) => address !== XINV)
      .map((address: string) => new Contract(address, CTOKEN_ABI, provider));

    const [
      supplyRates,
      borrowRates,
      cashes,
      collateralFactors,
      speeds,
      totalSupplies,
      exchangeRates,
      borrowState,
      prices,
    ]: any = await Promise.all([
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
          comptroller.compBorrowState(contract.address)
        )
      ),
      (
        await fetch(
          `${
            process.env.COINGECKO_PRICE_API
          }?vs_currencies=usd&ids=${Object.values(TOKENS).map(
            ({ coingeckoId }) => coingeckoId
          )}`
        )
      ).json(),
    ]);

    const supplyApys = supplyRates.map((rate) => toApy(rate));
    const borrowApys = borrowRates.map((rate) => toApy(rate));
    const rewardApys = speeds.map((speed, i) => {
      const underlying = UNDERLYING[contracts[i].address];
      return toApy(
        (speed * prices[TOKENS[INV].coingeckoId].usd) /
          (parseFloat(
            formatUnits(totalSupplies[i].toString(), underlying.decimals)
          ) *
            parseFloat(formatUnits(exchangeRates[i])) *
            prices[underlying.coingeckoId].usd)
      );
    });

    const markets = contracts.map(({ address }, i) => ({
      token: address,
      underlying: address !== ANCHOR_ETH ? UNDERLYING[address] : TOKENS.ETH,
      supplyApy: supplyApys[i],
      borrowApy: borrowApys[i],
      rewardApy: rewardApys[i],
      borrowable: borrowState[i][1] > 0,
      liquidity: parseFloat(
        formatUnits(cashes[i], contracts[i].address === ANCHOR_WBTC ? 8 : 18)
      ),
      collateralFactor: parseFloat(formatUnits(collateralFactors[i][1])),
    }));

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
    });

    res.status(200).json( {
      markets,
    });
  } catch (err) {
    console.error(err);
  }
};
