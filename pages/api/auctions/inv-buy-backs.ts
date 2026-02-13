import 'source-map-support';
import { Contract } from 'ethers';
import { getPaidProvider, getProvider } from '@app/util/providers';
import { getCacheFromRedis, getCacheFromRedisAsObj, redisSetWithTimestamp } from '@app/util/redis';
import { getBnToNumber } from '@app/util/markets';
import { INV_BUY_BACK_AUCTION } from '@app/config/constants';
import { INV_BUY_BACK_AUCTION_ABI } from '@app/config/abis';
import { getMulticallOutput } from '@app/util/multicall';
import { estimateBlockTimestamp } from '@app/util/misc';

const INV_BUY_BACK_CACHE_KEY = 'inv-buy-back-auction-v1.0.2';

export default async function handler(req, res) {
  try {
    const cacheDuration = 60;
    res.setHeader('Cache-Control', `public, max-age=${cacheDuration}`);

    const { data: cachedData, isValid } = await getCacheFromRedisAsObj(
      INV_BUY_BACK_CACHE_KEY,
      true,
      cacheDuration,
    );

    if (cachedData && isValid) {
      res.status(200).json(cachedData);
      return;
    }

    const provider = getProvider(1);
    const paidProvider = getPaidProvider(1);

    const auctionRead = new Contract(
      INV_BUY_BACK_AUCTION,
      INV_BUY_BACK_AUCTION_ABI,
      provider,
    );
    const auctionInfura = new Contract(
      INV_BUY_BACK_AUCTION,
      INV_BUY_BACK_AUCTION_ABI,
      paidProvider,
    );

    const latestBlock = await provider.getBlock('latest');
    const currentBlocknumber = latestBlock.number;
    const currentTimestamp = latestBlock.timestamp * 1000;

    const archived =
      cachedData || {
        last100Buys: [],
        totalInvIn: 0,
        totalDbrOut: 0,
        nbBuys: 0,
        rateUpdates: [],
      };

    const newStartingBlock = archived.lastBlocknumber
      ? archived.lastBlocknumber + 1
      : 0x0;

    const [infoData, buyEvents, rateEvents] = await Promise.all([
      getMulticallOutput([
        { contract: auctionRead, functionName: 'getCurrentReserves' },
        { contract: auctionRead, functionName: 'dbrRatePerYear' },
        { contract: auctionRead, functionName: 'maxDbrRatePerYear' },
        { contract: auctionRead, functionName: 'minDbrRatePerYear' },
      ],
        1,
        "latest",
        provider,
        true,
      ),
      auctionInfura.queryFilter(
        auctionInfura.filters.Buy(),
        newStartingBlock,
      ),
      auctionInfura.queryFilter(
        auctionInfura.filters.RateUpdate(),
        newStartingBlock,
      ),
    ]);

    const invReserve = getBnToNumber(infoData[0][0]);
    const dbrReserve = getBnToNumber(infoData[0][1]);
    const dbrRatePerYear = getBnToNumber(infoData[1]);
    const maxDbrRatePerYear = getBnToNumber(infoData[2]);
    const minDbrRatePerYear = getBnToNumber(infoData[3]);

    const newBuys = buyEvents.map((e) => {
      return {
        txHash: e.transactionHash,
        timestamp: estimateBlockTimestamp(
          e.blockNumber,
          currentTimestamp,
          currentBlocknumber,
        ),
        blockNumber: e.blockNumber,
        caller: e.args[0],
        to: e.args[1],
        invIn: getBnToNumber(e.args[2]),
        dbrOut: getBnToNumber(e.args[3]),
      };
    });

    const newRates = rateEvents.map((e) => {
      return {
        txHash: e.transactionHash,
        blockNumber: e.blockNumber,
        timestamp: estimateBlockTimestamp(
          e.blockNumber,
          currentTimestamp,
          currentBlocknumber,
        ),
        rate: getBnToNumber(e.args[0]),
      };
    });

    const totalInvIn =
      (archived.totalInvIn || 0) +
      newBuys.reduce((prev, curr) => prev + (curr.invIn || 0), 0);
    const totalDbrOut =
      (archived.totalDbrOut || 0) +
      newBuys.reduce((prev, curr) => prev + (curr.dbrOut || 0), 0);
    const nbBuys = (archived.nbBuys || 0) + newBuys.length;

    const last100Buys = archived.last100Buys
      .concat(newBuys)
      .slice(-100);

    const rateUpdates = (archived.rateUpdates || [])
      .concat(newRates);

    const resultData = {
      timestamp: Date.now(),
      lastBlocknumber: currentBlocknumber,
      invReserve,
      dbrReserve,
      dbrRatePerYear,
      maxDbrRatePerYear,
      minDbrRatePerYear,
      totalInvIn,
      totalDbrOut,
      nbBuys,
      last100Buys,
      rateUpdates,
    };

    await redisSetWithTimestamp(INV_BUY_BACK_CACHE_KEY, resultData);

    res.status(200).json(resultData);
  } catch (err) {
    console.error(err);
    try {
      const cache = await getCacheFromRedis(INV_BUY_BACK_CACHE_KEY, false, 0);
      if (cache) {
        console.log('Api call failed, returning last cache found');
        res.status(200).json(cache);
      } else {
        res.status(500).send({});
      }
    } catch (e) {
      console.error(e);
      res.status(500).send({});
    }
  }
}

