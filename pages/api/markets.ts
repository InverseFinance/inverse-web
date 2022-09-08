import { COMPTROLLER_ABI, CTOKEN_ABI, XINV_ABI, ORACLE_ABI, ESCROW_ABI } from "@app/config/abis";
import {
  ETH_MANTISSA,
  BLOCKS_PER_DAY,
  HAS_REWARD_TOKEN,
  BURN_ADDRESS,
  CHAIN_ID,
} from "@app/config/constants";
import { Contract, BigNumber } from "ethers";
import { formatUnits } from "ethers/lib/utils";
import "source-map-support";
import { getNetworkConfig, getNetworkConfigConstants } from '@app/util/networks';
import { StringNumMap } from '@app/types';
import { getProvider } from '@app/util/providers';
import { getCacheFromRedis, redisSetWithTimestamp } from '@app/util/redis';
import { getBnToNumber, getPoolYield, getStethData, getXSushiData, getYearnVaults, toApr, toApy } from '@app/util/markets';
import { REPAY_ALL_CONTRACTS } from '@app/variables/tokens';

export default async function handler(req, res) {
  // defaults to mainnet data if unsupported network
  const networkConfig = getNetworkConfig(CHAIN_ID, true)!;
  const cacheKey = `${networkConfig.chainId}-markets-cache-v1.4.3`;

  if(CHAIN_ID === '5') {
    const r = await fetch('https://www.inverse.finance/api/markets');
    res.status(200).send(await r.json());    
    return;
  }

  try {
    const {
      INV,
      TOKENS,
      UNDERLYING,
      XINV_V1,
      XINV,
      ORACLE,
      COMPTROLLER,
      ESCROW,
      ESCROW_OLD,
    } = getNetworkConfigConstants(networkConfig);

    const validCache = await getCacheFromRedis(cacheKey, true, 600);
    if (validCache) {
      res.status(200).json(validCache);
      return
    }

    const provider = getProvider(networkConfig.chainId);
    const comptroller = new Contract(COMPTROLLER, COMPTROLLER_ABI, provider);
    const oracle = new Contract(ORACLE, ORACLE_ABI, provider);
    const allMarkets: string[] = [...await comptroller.getAllMarkets()];
    const addresses = allMarkets.filter(address => !!UNDERLYING[address]);

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
      totalSupplies,
      exchangeRates,
      borrowPaused,
      mintPaused,
      collateralGuardianPaused,
      oraclePrices,
      oracleFeeds,
      interestRateModels,
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
      Promise.all(
        contracts.map((contract) =>
          comptroller.collateralGuardianPaused(contract.address)
        )
      ),
      Promise.all(addresses.map(address => oracle.getUnderlyingPrice(address))),
      Promise.all(addresses.map(address => oracle.feeds(address))),
      Promise.all(contracts.map(contract => contract.interestRateModel())),
    ]);

    let xinvExRate = BigNumber.from('0');
    let speeds: BigNumber[] = [];
    if (HAS_REWARD_TOKEN) {
      [xinvExRate, speeds] = await Promise.all([
        new Contract(XINV, XINV_ABI, provider).exchangeRateStored(),
        Promise.all(
          contracts.map((contract) => comptroller.compSpeeds(contract.address))
        ),
      ]);
    }

    const prices: StringNumMap = oraclePrices
      .map((v, i) => {
        return parseFloat(formatUnits(v, BigNumber.from(36).sub(UNDERLYING[addresses[i]].decimals)))
      })
      .reduce((p, v, i) => ({ ...p, [addresses[i]]: v }), {});

    const supplyApys = supplyRates.map((rate) => toApy(rate));
    const borrowApys = borrowRates.map((rate) => toApy(rate));

    const supplyAprs = supplyRates.map((rate) => toApr(rate));
    const borrowAprs = borrowRates.map((rate) => toApr(rate));

    const rewardAprs = speeds.map((speed, i) => {
      const underlying = UNDERLYING[contracts[i].address];

      return toApr(
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

    // external yield bearing apys
    const externalYieldResults = await Promise.allSettled([
      getYearnVaults(),
      getStethData(),
      getXSushiData(),
      getPoolYield('0xAA5A67c256e27A5d80712c51971408db3370927D-ethereum'),
    ]);

    const [yearnVaults, stethData, xSushiData, dola3poolYield] = externalYieldResults.map(r => {
      return r.status === 'fulfilled' ? r.value : {};
    });

    const externalApys = {
      'stETH': stethData?.data?.[0]?.apy||0,
      'xSUSHI': xSushiData?.apy||0,
      'DOLA-3POOL': dola3poolYield?.apy||0,
    }

    const markets = contracts.map(({ address }, i) => {
      const underlying = UNDERLYING[address] || TOKENS.CHAIN_COIN
      const oracleFeedIdx = addresses.indexOf(address);
      const liquidity = getBnToNumber(cashes[i], underlying.decimals);
      const reserves = getBnToNumber(totalReserves[i], underlying.decimals);
      const borrows = getBnToNumber(totalBorrows[i], underlying.decimals);

      const utilisationRate = borrows === 0 ? 0 : borrows / (liquidity + borrows - reserves)

      const yearnVaultApy = underlying.symbol.startsWith('yv') ?
        yearnVaults?.find(v => v.address.toLowerCase() === underlying.address.toLowerCase())?.apy?.net_apy
        : 0;

      const externalApy = externalApys[underlying.symbol] || 0;

      const isEthMarket = !underlying.address;

      return {
        token: address,
        underlying,
        supplyApy: supplyApys[i] + (((yearnVaultApy||0) * 100) || externalApy || 0),
        borrowApy: borrowApys[i] || 0,
        supplyApr: supplyAprs[i] || 0,
        borrowApr: borrowAprs[i] || 0,
        rewardApr: rewardAprs[i] || 0,
        rewardsPerMonth: rewardsPerMonth[i] || 0,
        borrowable: !borrowPaused[i],
        mintable: !mintPaused[i],
        collateralGuardianPaused: collateralGuardianPaused[i],
        priceUsd: prices[address],
        oraclePrice: prices[address],
        // if it's a fixedPrice case then the feed source is the Oracle contract itself
        oracleFeed: oracleFeeds[oracleFeedIdx] === BURN_ADDRESS ? ORACLE : oracleFeeds[oracleFeedIdx],
        priceXinv: prices[address] / prices[XINV],
        utilizationRate: utilisationRate,
        liquidity,
        totalReserves: reserves,
        totalBorrows: borrows,
        collateralFactor: parseFloat(formatUnits(collateralFactors[i][1])),
        reserveFactor: parseFloat(formatUnits(reserveFactors[i])),
        supplied: parseFloat(formatUnits(exchangeRates[i])) * parseFloat(formatUnits(totalSupplies[i], underlying.decimals)),
        interestRateModel: interestRateModels[i],
        repayAllAddress: isEthMarket ? REPAY_ALL_CONTRACTS[address] : undefined
      }
    });

    const addXINV = async (xinvAddress: string, escrowAddress: string, mintable: boolean) => {
      const xINV = new Contract(xinvAddress, XINV_ABI, provider);
      const escrowContract = new Contract(escrowAddress, ESCROW_ABI, provider);

      const [
        rewardPerBlock,
        exchangeRate,
        totalSupply,
        collateralFactor,
        collateralGuardianPaused,
      ] = await Promise.all([
        xINV.rewardPerBlock(),
        xINV.exchangeRateStored(),
        xINV.totalSupply(),
        comptroller.markets(xinvAddress),
        comptroller.collateralGuardianPaused(xinvAddress),
      ]);

      const ratePerBlock = !totalSupply.gt(0) ? 0 : (((rewardPerBlock / ETH_MANTISSA)) /
        ((totalSupply / ETH_MANTISSA) * (exchangeRate / ETH_MANTISSA))) * ETH_MANTISSA;

      const parsedExRate = parseFloat(formatUnits(exchangeRate))

      markets.push({
        token: xINV.address,
        mintable: mintable,
        collateralGuardianPaused,
        underlying: { ...TOKENS[INV], isInPausedSection: !mintable },
        // no real autocompounding for inv as share decreases with supply
        supplyApy: toApr(ratePerBlock) || 0,
        supplyApr: toApr(ratePerBlock) || 0,
        collateralFactor: parseFloat(formatUnits(collateralFactor[1])),
        supplied: parsedExRate * parseFloat(formatUnits(totalSupply)),
        rewardApr: 0,
        rewardsPerMonth: rewardPerBlock / ETH_MANTISSA * BLOCKS_PER_DAY * 30,
        priceUsd: prices[xinvAddress] / parsedExRate,
        oraclePrice: prices[xinvAddress],
        oracleFeed: oracleFeeds[addresses.indexOf(xinvAddress)],
        priceXinv: 1 / parsedExRate,
        // in days
        escrowDuration: parseInt((await escrowContract.callStatic.duration()).toString()) / 86400
      });
    }

    if (HAS_REWARD_TOKEN) {
      if (XINV_V1) {
        await addXINV(XINV_V1, ESCROW_OLD, false);
      }
      await addXINV(XINV, ESCROW, true);
    }

    const resultData = { markets };

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
    }
  }
};
