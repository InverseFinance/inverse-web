import { Contract, ethers } from 'ethers'
import 'source-map-support'
import { getNetworkConfigConstants } from '@app/util/networks'
import ganache from 'ganache'
import { DBR_DISTRIBUTOR_ABI, ERC20_ABI } from '@app/config/abis';
import { getBnToNumber } from '@app/util/markets';
import { getCacheFromRedis, isInvalidGenericParam, redisSetWithTimestamp } from '@app/util/redis';
import { isAddress } from 'ethers/lib/utils';

const { DBR_DISTRIBUTOR, DBR } = getNetworkConfigConstants();

export default async function handler(req, res) {
  const { escrow, account } = req.query;

  if (!escrow || !isAddress(escrow) || isInvalidGenericParam(escrow) || !isAddress(account) || isInvalidGenericParam(account)) {
    res.status(400).json({ msg: 'invalid request' });
    return;
  };

  const cacheKey = `${escrow}-dbr-rewards`;

  try {
    const cacheDuration = 90;
    res.setHeader('Cache-Control', `public, max-age=${cacheDuration}`);
    const validCache = await getCacheFromRedis(cacheKey, true, cacheDuration);
    if (validCache) {
      res.status(200).json(validCache);
      return
    }

    // forking options
    const options = {
      namespace: { option: "fork" },
      fork: {
        url: process.env.NEXT_PUBLIC_CHAIN_ID === '31337' ?
          'http://127.0.0.1:8545' : `https://eth-mainnet.alchemyapi.io/v2/${process.env.ALCHEMY_CRON2}`,
      },
      wallet: {
        // unlock account account to use as "from"
        unlockedAccounts: [account],
      }
    };

    // init ganache Ethereum fork
    const ganacheProvider = await ganache.provider(options);
    const web3provider = new ethers.providers.Web3Provider(ganacheProvider);
    const dbrDistributor = new Contract(DBR_DISTRIBUTOR, DBR_DISTRIBUTOR_ABI, web3provider);    
    const dbr = new Contract(DBR, ERC20_ABI, web3provider);

    const [signer] = await ganacheProvider.request({
      method: "eth_accounts",
      params: [],
    });

    await ganacheProvider.send("eth_sendTransaction", [
      {
        from: signer,
        to: account,
        value: "0x056bc75e2d63100000",
      }
    ]);

    // exec claimDBRto()
    const receiverPlaceholder = '0x502a7759809bD673cd39A0055beed44b40EAac98';
    await web3provider.send("eth_sendTransaction", [
      {
        from: account,
        to: escrow,
        data: `0xdee60797000000000000000000000000${receiverPlaceholder.replace('0x', '')}`,
        gasLimit: '0x0f4240',
      }
    ]);

    const [claimedAmount, lastUpdate] = await Promise.all([
      dbr.balanceOf(receiverPlaceholder),
      dbrDistributor.lastUpdate(),
    ]);

    const result = {
      timestamp: getBnToNumber(lastUpdate, 0) * 1000,
      simRewards: getBnToNumber(claimedAmount),
    }

    await redisSetWithTimestamp(cacheKey, result);

    res.status(200).json(result);
  } catch (err) {
    console.error(err);
    res.status(200).json({ success: false })
  }
}