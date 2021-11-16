import { COMPTROLLER_ABI, CTOKEN_ABI, XINV_ABI, ORACLE_ABI } from "@inverse/config/abis";
import {
  BLOCKS_PER_DAY,
  DAYS_PER_YEAR,
  ETH_MANTISSA,
} from "@inverse/config/constants";
import { Contract, BigNumber } from "ethers";
import { formatUnits } from "ethers/lib/utils";
import "source-map-support";
import { getNetworkConfig, getNetworkConfigConstants } from '@inverse/config/networks';
import { StringNumMap } from '@inverse/types';
import { getProvider } from '@inverse/util/providers';
import { getCacheFromRedis } from '@inverse/util/redis';
import { redisSetWithTimestamp } from '../../util/redis';

const toApy = (rate: number) =>
  (Math.pow((rate / ETH_MANTISSA) * BLOCKS_PER_DAY + 1, DAYS_PER_YEAR) - 1) *
  100;

export default async function handler(req, res) {
  const { chainId = '1' } = req.query;
  // defaults to mainnet data if unsupported network
  const networkConfig = getNetworkConfig(chainId, true)!;
  const cacheKey = `${networkConfig.chainId}-markets-cache`;

  try {
    const {
      INV,
      TOKENS,
      UNDERLYING,
      XINV_V1,
      XINV,
      ORACLE,
      ANCHOR_ETH,
      ANCHOR_WBTC,
      COMPTROLLER,
    } = getNetworkConfigConstants(networkConfig);

    const validCache = await getCacheFromRedis(cacheKey, true, 1800);
    if(validCache) {
      res.status(200).json(validCache);
      return
    }

    const provider = getProvider(networkConfig.chainId);
    const comptroller = new Contract(COMPTROLLER, COMPTROLLER_ABI, provider);
    const oracle = new Contract(ORACLE, ORACLE_ABI, provider);
    const addresses: string[] = await comptroller.getAllMarkets();

    const contracts = addresses
      .filter((address: string) => address !== XINV && address !== XINV_V1)
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
      mintPaused,
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
      Promise.all(
        contracts.map((contract) =>
          comptroller.mintGuardianPaused(contract.address)
        )
      ),
      Promise.all(addresses.map(address => oracle.getUnderlyingPrice(address))),
    ]);

    const prices: StringNumMap = oraclePrices
      .map((v, i) => parseFloat(formatUnits(v, BigNumber.from(36).sub(UNDERLYING[addresses[i]].decimals))))
      .reduce((p, v, i) => ({ ...p, [addresses[i]]: v }), {});

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
        mintable: !mintPaused[i],
        priceUsd: prices[contracts[i].address],
        priceXinv: prices[contracts[i].address] / prices[XINV],
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

    const addXINV = async (xinvAddress: string, mintable: boolean) => {
      const xINV = new Contract(xinvAddress, XINV_ABI, provider);

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

      const supplyApy = !totalSupply.gt(0) ? 0 : (((rewardPerBlock / ETH_MANTISSA) * BLOCKS_PER_DAY * DAYS_PER_YEAR) /
        ((totalSupply / ETH_MANTISSA) * (exchangeRate / ETH_MANTISSA))) * 100

      markets.push({
        token: xINV.address,
        mintable: mintable,
        underlying: TOKENS[INV],
        supplyApy: supplyApy || 0,
        collateralFactor: parseFloat(formatUnits(collateralFactor[1])),
        supplied: parseFloat(formatUnits(exchangeRate)) * parseFloat(formatUnits(totalSupply)),
        rewardApy: 0,
        priceUsd: prices[xinvAddress],
        priceXinv: 1,
      });
    }

    await addXINV(XINV_V1, false);
    await addXINV(XINV, true);

    const resultData = { markets };

    await redisSetWithTimestamp(cacheKey, resultData);
    res.status(200).json(resultData);
    
  } catch (err) {
    console.error(err);
    // if an error occured, try to return last cached results
    try {
      const cache = await getCacheFromRedis(cacheKey, false);
      if(cache) {
        console.log('Api call failed, returning last cache found');
        res.status(200).json(cache);
      }
    } catch(e) {
      console.error(e);
    }
  }
};
