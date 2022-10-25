import { Contract } from 'ethers'
import 'source-map-support'
import { F2_MARKET_ABI, F2_ORACLE_ABI, F2_SIMPLE_ESCROW } from '@app/config/abis'
import { getNetworkConfigConstants } from '@app/util/networks'
import { getProvider } from '@app/util/providers';
import { getCacheFromRedis, redisSetWithTimestamp } from '@app/util/redis'
import { getBnToNumber } from '@app/util/markets'
import { CHAIN_ID } from '@app/config/constants';
import { CHAIN_TOKENS, getToken } from '@app/variables/tokens';

const { F2_MARKETS, F2_ORACLE } = getNetworkConfigConstants();

export default async function handler(req, res) {
  const cacheKey = `f2shortfalls-v1.0.0`;
  const uniqueUsersCache = `f2unique-users-v1.0.3`;
  const isShortfallOnly = req.query?.shortfallOnly === 'true';

  try {
    const validCache = await getCacheFromRedis(cacheKey, true, 30);
    if (validCache) {
      res.status(200).json(validCache);
      return
    }

    const provider = getProvider(CHAIN_ID);
    // const oracleContract = new Contract(F2_ORACLE, F2_ORACLE_ABI, provider);

    const uniqueUsersCacheData = (await getCacheFromRedis(uniqueUsersCache, false)) || { latestBlockNumber: 15818288, users: [], escrows: [] };
    let { latestBlockNumber, users: uniqueUsers, escrows } = uniqueUsersCacheData;
    const afterLastBlock = latestBlockNumber + 1;

    const [
      escrowCreations,
    ] = await Promise.all([
      Promise.all(
        F2_MARKETS.map(m => {
          const market = new Contract(m.address, F2_MARKET_ABI, provider);
          return market.queryFilter(market.filters.CreateEscrow(), afterLastBlock);
        })
      ),
    ]);

    escrowCreations.forEach(marketEscrows => {
      marketEscrows.forEach(escrowCreationEvent => {
        if (!uniqueUsers.includes(escrowCreationEvent.args[0])) {
          uniqueUsers.push(escrowCreationEvent.args[0]);
          escrows.push(escrowCreationEvent.args[1]);
        }
        if (escrowCreationEvent.blockNumber > latestBlockNumber) {
          latestBlockNumber = escrowCreationEvent.blockNumber;
        }
      });
    });

    await redisSetWithTimestamp(uniqueUsersCache, { users: uniqueUsers, latestBlockNumber: latestBlockNumber, escrows });

    const groupedLiqDebt =
      await Promise.all(
        F2_MARKETS
          .map(m => {
            const market = new Contract(m.address, F2_MARKET_ABI, provider);
            return Promise.all(
              uniqueUsers.map(u => {
                return market.getLiquidatableDebt(u);
              })
            )
          })
      );

    const filtered = F2_MARKETS.map((m, marketIndex) => {
      return uniqueUsers.map((user, userIndex) => {
        return {
          marketIndex,
          user,
          liquidatableDebt: getBnToNumber(groupedLiqDebt[marketIndex][userIndex]),
        }
      });
    })
      .flat()
      .filter(d => !isShortfallOnly || (isShortfallOnly && d.liquidatableDebt > 0));

    // const [oraclePricesBn, collateralFactorsBn] = (await Promise.all(
    //   [
    //     await Promise.all (F2_MARKETS.map(m => {
    //       return oracleContract.getPrice(m.collateral);
    //     })),
    //     await Promise.all(F2_MARKETS.map(m => {
    //       const market = new Contract(m.address, F2_MARKET_ABI, provider);
    //       return market.collateralFactorBps();
    //     })),
    //   ]
    // ));

    // const oraclePrices = oraclePricesBn.map((bn) => getBnToNumber(bn));
    // const collateralFactors = collateralFactorsBn.map((bnBps) => getBnToNumber(bnBps, 4));

    const [debtsBn, depositsBn] = await Promise.all(
      [
        await Promise.all(filtered.map((f, i) => {
          const market = new Contract(F2_MARKETS[f.marketIndex].address, F2_MARKET_ABI, provider);
          return market.debts(f.user);
        })),
        await Promise.all(filtered.map((f, i) => {
          const escrow = new Contract(escrows[uniqueUsers.indexOf(f.user)], F2_SIMPLE_ESCROW, provider);
          return escrow.balance();
        })),
      ]
    );
    const deposits = depositsBn.map((bn, i) => getBnToNumber(bn, getToken(CHAIN_TOKENS[CHAIN_ID], F2_MARKETS[filtered[i].marketIndex].collateral)?.decimals));
    const debts = debtsBn.map((bn) => getBnToNumber(bn));
    
    const positions = filtered.map((f, i) => {
      return {
        ...f,
        deposits: deposits[i],
        debt: debts[i],
      }
    });

    const resultData = {
      positions,
      uniqueUsers,
      timestamp: +(new Date()),
    }

    await redisSetWithTimestamp(cacheKey, resultData);

    res.status(200).json(resultData)
  } catch (err) {
    console.error(err);
    // if an error occured, try to return last cached results
    try {
      const cache = await getCacheFromRedis(cacheKey, false);
      if (cache) {
        console.log('Api call failed, returning last cache found');
        res.status(200).json(cache);
      } else {
        res.status(500).json({ success: false });
      }
    } catch (e) {
      console.error(e);
      res.status(500).json({ success: false });
    }
  }
}