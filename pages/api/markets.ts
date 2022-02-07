import { COMPTROLLER_ABI, CTOKEN_ABI, XINV_ABI, ORACLE_ABI, ESCROW_ABI } from "@app/config/abis";
import {
  DAYS_PER_YEAR,
  ETH_MANTISSA,
  BLOCKS_PER_DAY,
  BLOCKS_PER_YEAR,
} from "@app/config/constants";
import { Contract, BigNumber } from "ethers";
import { formatUnits } from "ethers/lib/utils";
import "source-map-support";
import { getNetworkConfig, getNetworkConfigConstants } from '@app/util/networks';
import { StringNumMap } from '@app/types';
import { getProvider } from '@app/util/providers';
import { getCacheFromRedis, redisSetWithTimestamp } from '@app/util/redis';
import { getBnToNumber } from '@app/util/markets';

const toApy = (rate: number) => rate / ETH_MANTISSA * BLOCKS_PER_YEAR * 100

export default async function handler(req, res) {
  // defaults to mainnet data if unsupported network
  const networkConfig = getNetworkConfig(process.env.NEXT_PUBLIC_CHAIN_ID!, true)!;
  const cacheKey = `${networkConfig.chainId}-markets-cache-v1.2.4`;

  try {
    const {
      INV,
      TOKENS,
      UNDERLYING,
      XINV_V1,
      XINV,
      ORACLE,
      ANCHOR_CHAIN_COIN,
      COMPTROLLER,
      ESCROW,
      ESCROW_OLD,
    } = getNetworkConfigConstants(networkConfig);

    const validCache = await getCacheFromRedis(cacheKey, true, 600);
    if(validCache) {
      res.status(200).json(validCache);
      return
    }

    const provider = getProvider(networkConfig.chainId);
    const comptroller = new Contract(COMPTROLLER, COMPTROLLER_ABI, provider);
    const oracle = new Contract(ORACLE, ORACLE_ABI, provider);
    const allMarkets: string[] = [...await comptroller.getAllMarkets()];
    const addresses = allMarkets.filter(address => !!UNDERLYING[address])

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
      xinvExRate,
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
      new Contract(XINV, XINV_ABI, provider).exchangeRateStored(),
    ]);

    const prices: StringNumMap = oraclePrices
      .map((v, i) => {
        return parseFloat(formatUnits(v, BigNumber.from(36).sub(UNDERLYING[addresses[i]].decimals)))
      })
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

    const rewardsPerMonth = speeds.map((speed, i) => {
      return getBnToNumber(speed) * BLOCKS_PER_DAY * 30 * getBnToNumber(xinvExRate);
    });

    const markets = contracts.map(({ address }, i) => {
      const underlying = address !== ANCHOR_CHAIN_COIN ? UNDERLYING[address] : TOKENS.CHAIN_COIN

      return {
        token: address,
        underlying,
        supplyApy: supplyApys[i] || 0,
        borrowApy: borrowApys[i] || 0,
        rewardApy: rewardApys[i] || 0,
        rewardsPerMonth: rewardsPerMonth[i] || 0,
        borrowable: !borrowPaused[i],
        mintable: !mintPaused[i],
        priceUsd: prices[contracts[i].address],
        oraclePrice: prices[contracts[i].address],
        priceXinv: prices[contracts[i].address] / prices[XINV],
        liquidity: parseFloat(
          formatUnits(cashes[i], underlying.decimals)
        ),
        totalReserves: parseFloat(
          formatUnits(totalReserves[i], underlying.decimals)
        ),
        totalBorrows: parseFloat(
          formatUnits(totalBorrows[i], underlying.decimals)
        ),
        collateralFactor: parseFloat(formatUnits(collateralFactors[i][1])),
        reserveFactor: parseFloat(formatUnits(reserveFactors[i])),
        supplied: parseFloat(formatUnits(exchangeRates[i])) * parseFloat(formatUnits(totalSupplies[i], underlying.decimals))
      }
    });

    const addXINV = async (xinvAddress: string, escrowAddress: string, mintable: boolean) => {
      const xINV = new Contract(xinvAddress, XINV_ABI, provider);
      const escrowContract = new Contract(escrowAddress, ESCROW_ABI ,provider);

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

      const parsedExRate = parseFloat(formatUnits(exchangeRate))

      markets.push({
        token: xINV.address,
        mintable: mintable,
        underlying: TOKENS[INV],
        supplyApy: supplyApy || 0,
        collateralFactor: parseFloat(formatUnits(collateralFactor[1])),
        supplied:  parsedExRate * parseFloat(formatUnits(totalSupply)),
        rewardApy: 0,
        rewardsPerMonth: rewardPerBlock / ETH_MANTISSA * BLOCKS_PER_DAY * 30,
        priceUsd: prices[xinvAddress] / parsedExRate,
        oraclePrice: prices[xinvAddress],
        priceXinv: 1 / parsedExRate,
        // in days
        escrowDuration: parseInt((await escrowContract.callStatic.duration()).toString()) / 86400
      });
    }

    if(XINV_V1) {
      await addXINV(XINV_V1, ESCROW_OLD ,false);
    }
    await addXINV(XINV, ESCROW ,true);

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
