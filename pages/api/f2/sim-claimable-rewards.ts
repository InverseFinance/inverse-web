import { Contract, ethers } from 'ethers'
import 'source-map-support'

import ganache from 'ganache'
import { ERC20_ABI } from '@app/config/abis';
import { getBnToNumber, getToken } from '@app/util/markets';
import { getCacheFromRedis, isInvalidGenericParam, redisSetWithTimestamp } from '@app/util/redis';
import { isAddress } from 'ethers/lib/utils';
import { CHAIN_TOKENS } from '@app/variables/tokens';
import { CHAIN_ID } from '@app/config/constants';
import { getDataFieldForTransaction } from '@app/util/contracts';

export default async function handler(req, res) {
  const { escrow, account } = req.query;

  if (!escrow || !isAddress(escrow) || isInvalidGenericParam(escrow) || !isAddress(account) || isInvalidGenericParam(account)) {
    res.status(400).json({ msg: 'invalid request' });
    return;
  };

  const cacheKey = `${escrow}-cvxCrv-rewards`;

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
          'http://localhost:8545' : `https://eth-mainnet.alchemyapi.io/v2/${process.env.ALCHEMY_CRON2}`,
      },
      wallet: {
        // unlock account account to use as "from"
        unlockedAccounts: [account],
      }
    };

    // init ganache Ethereum fork
    const ganacheProvider = await ganache.provider(options);
    const web3provider = new ethers.providers.Web3Provider(ganacheProvider);

    const chainTokens = CHAIN_TOKENS[CHAIN_ID];
    const claimableTokens = [
      getToken(chainTokens, 'CVX'),
      getToken(chainTokens, 'CRV'),
      getToken(chainTokens, '3CRV'),
    ];

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

    const receiverPlaceholder = '0x502a7759809bD673cd39A0055beed44b40EAac98';
    await web3provider.send("eth_sendTransaction", [
      {
        from: account,
        to: escrow,
        data: getDataFieldForTransaction('claimTo(address)', [receiverPlaceholder]),
        gasLimit: '0x0f4240',
      }
    ]);

    const claimableRewards = await Promise.all(
      claimableTokens.map(token => {
        const contract = new Contract(token.address, ERC20_ABI, web3provider);
        return contract.balanceOf(receiverPlaceholder);
      })
    );

    const result = {
      timestamp: (Date.now() - 1000),
      claimableRewards: claimableRewards.map((bn, tokenIdx) => {
        return {
          ...claimableTokens[tokenIdx],
          balance: getBnToNumber(bn, claimableTokens[tokenIdx].decimals),
        }
      }),
    }

    await redisSetWithTimestamp(cacheKey, result);

    res.status(200).json(result);
  } catch (err) {
    console.error(err);
    res.status(200).json({ success: false })
  }
}