import 'source-map-support'
import { getNetworkConfigConstants } from '@app/util/networks'
import { getProvider } from '@app/util/providers';
import { getCacheFromRedis, redisSetWithTimestamp } from '@app/util/redis'
import { NetworkIds } from '@app/types';
import { cacheFedDatas } from './dao';
import { frontierMarketsCacheKey } from '../markets';
import { firmTvlCacheKey } from '../f2/tvl';
import { getBnToNumber } from '@app/util/markets';
import { BigNumber, Contract } from 'ethers';
import { F2_MARKETS_CACHE_KEY } from '../f2/fixed-markets';
import { CTOKEN_ABI } from '@app/config/abis';
import { getLPBalances, getLPPrice, getPoolRewards } from '@app/util/contracts';
import { TOKENS, getToken } from '@app/variables/tokens';

const { FEDS } = getNetworkConfigConstants(NetworkIds.mainnet);

const FUSE_CTOKENS = {
  '0xe3277f1102C1ca248aD859407Ca0cBF128DB0664': '0xf65155C9595F99BFC193CaFF0AAb6e2a98cf68aE',
  '0x7765996dAe0Cf3eCb0E74c016fcdFf3F055A5Ad8': '0x5117D9453cC9Be8c3fBFbA4aE3B858D18fe45903',
  '0x5Fa92501106d7E4e8b4eF3c4d08112b6f306194C': '0xC1Fb01415f08Fbd71623aded6Ac8ec74F974Fdc1',
  // fuse 24 has fully ended
  // '0xCBF33D02f4990BaBcba1974F1A5A8Aea21080E36': '0xa355e89F6b326624fB54310589689144B2A0B3a8',
};
const FUSE_FEDS = Object.entries(FUSE_CTOKENS).map(([fedAddress, ctoken]) => ({ fedAddress, ctoken }));

export default async function handler(req, res) {  
  // to keep for archive
  const cacheKey = `fed-overview-v1.0.0`;

  try {

    const validCache = await getCacheFromRedis(cacheKey, true, 900);

    if (validCache) {
      res.status(200).json(validCache);
      return
    }

    const provider = getProvider(NetworkIds.mainnet);

    const [
      _fedsData,
      frontierData,
      firmTvlData,
      firmMarketsData,
      fuseDolaBorrowsBn,
      lpBalancesBn,
      lpPrices,
      lpSubBalances,
      lpRewards,
    ] = await Promise.all([
      getCacheFromRedis(cacheFedDatas, false),
      getCacheFromRedis(frontierMarketsCacheKey, false),
      getCacheFromRedis(firmTvlCacheKey, false),
      getCacheFromRedis(F2_MARKETS_CACHE_KEY, false),
      Promise.all(
        FUSE_FEDS.map(fuseFed => {
          const contract = new Contract(fuseFed.ctoken, CTOKEN_ABI, provider);
          return contract.totalBorrows();
        })
      ),
      Promise.all(
        FEDS.map(lpFed => {
          if(!lpFed.strategy?.targetContract) {
            return new Promise((res) => res(BigNumber.from('0')));
          }
          const contract = new Contract(lpFed.strategy.targetContract, CTOKEN_ABI, provider);
          return contract.balanceOf(lpFed.address);
        })
      ),
      Promise.all(
        FEDS.map(lpFed => {
          if(!lpFed.strategy?.targetContract) {
            return new Promise((res) => res(0));
          }
          const token = getToken(TOKENS, lpFed.strategy?.pools[0].address);
          const chainId = lpFed.incomeChainId||lpFed.chainId;
          const chainProvider = getProvider(chainId);
          return getLPPrice(token, chainId, chainProvider);
        })
      ),
      Promise.all(
        FEDS.map(lpFed => {
          if(!lpFed.strategy?.targetContract) {
            return new Promise((res) => res([]));
          }
          const token = getToken(TOKENS, lpFed.strategy?.pools[0].address);
          const chainId = lpFed.incomeChainId||lpFed.chainId;
          const chainProvider = getProvider(chainId);
          return getLPBalances(token, chainId, chainProvider);
        })
      ),
      Promise.all(
        FEDS.map(lpFed => {
          if(!lpFed.strategy?.rewardPools?.length > 0) {
            return new Promise((res) => res([]));
          }
          const chainId = lpFed.incomeChainId||lpFed.chainId;
          const chainProvider = getProvider(chainId);
          return getPoolRewards(lpFed.strategy?.rewardPools, lpFed.address, chainId, chainProvider);
        })
      ),
    ]);

    const fedsData = _fedsData || [];
    const frontierMarkets = frontierData?.markets || [];
    const firmMarkets = firmMarketsData?.markets || [];
    const firmTotalTvl = firmTvlData?.firmTotalTvl || 0;

    const fedOverviews = FEDS.map((fedConfig, fedIndex) => {
      const fedData = fedsData.find(f => f.address === fedConfig.address);
      let tvl, borrows, lpBalance, lpPrice = 0;
      let subBalances, rewards = [];
      let detailsLink, detailsLinkName = '';
      // frontier
      if (fedConfig.address === '0x5E075E40D01c82B6Bf0B0ecdb4Eb1D6984357EF7') {
        const market = frontierMarkets.find(m => m.underlying.symbol === 'DOLA')
        tvl = market?.supplied || 0;
        borrows = market?.totalBorrows || 0;
        detailsLink = 'https://lookerstudio.google.com/embed/u/0/reporting/cb58a483-78a0-4f08-9625-25ea42a2bd12/page/p_e7r2kvhhtc'
        detailsLinkName = 'Analytics'
      } else if (fedConfig.isFirm) {
        tvl = firmTotalTvl;
        borrows = firmMarkets.reduce((prev, curr) => prev + curr.totalDebt, 0);
        detailsLink = '/firm/positions';
        detailsLinkName = 'Positions'
      } else if (fedConfig.type === 'LP') {
        detailsLink = `https://debank.com/profile/${fedConfig.incomeSrcAd || fedConfig.address}`;
        detailsLinkName = 'Debank'
        lpBalance = getBnToNumber(lpBalancesBn[fedIndex]);
        lpPrice = lpPrices[fedIndex];
        subBalances = lpSubBalances[fedIndex];
        rewards = lpRewards[fedIndex]
      } else if (fedConfig.fusePool) {
        detailsLink = `https://app.rari.capital/fuse/pool/${fedConfig.fusePool}/info`;
        detailsLinkName = 'Fuse'
        const fuseFedIndex = FUSE_FEDS.findIndex(ff => ff.fedAddress === fedConfig.address);
        if (fuseFedIndex !== -1) {
          borrows = getBnToNumber(fuseDolaBorrowsBn[fuseFedIndex]);
        }
      }

      return {
        ...fedConfig,
        abi: undefined,
        supply: fedData?.supply || 0,
        lpBalance,
        lpPrice,
        tvl,
        borrows,
        detailsLink,
        detailsLinkName,
        subBalances,
        rewards,
      }
    })

    const resultData = {
      timestamp: +(new Date()),
      fedOverviews,
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
      }
    } catch (e) {
      console.error(e);
    }
  }
}
