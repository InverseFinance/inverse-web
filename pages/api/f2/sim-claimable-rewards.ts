import { Contract, ethers } from 'ethers'
import 'source-map-support'

import ganache from 'ganache'
import { ERC20_ABI, F2_MARKET_ABI } from '@app/config/abis';
import { getBnToNumber, getToken } from '@app/util/markets';
import { getCacheFromRedis, isInvalidGenericParam, redisSetWithTimestamp } from '@app/util/redis';
import { isAddress } from 'ethers/lib/utils';
import { CHAIN_TOKENS } from '@app/variables/tokens';
import { BURN_ADDRESS, CHAIN_ID } from '@app/config/constants';
import { getDataFieldForTransaction } from '@app/util/contracts';
import { getNetworkConfigConstants } from '@app/util/networks';

const { F2_MARKETS } = getNetworkConfigConstants();

export default async function handler(req, res) {
  const { account } = req.query;

  if (!isAddress(account) || isInvalidGenericParam(account)) {
    res.status(400).json({ msg: 'invalid request' });
    return;
  };

  const cacheKey = `${account}-sim-rewards`;

  try {
    const cacheDuration = 300;
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

    const marketsWithRewards = F2_MARKETS.filter(market => !!market.hasClaimableRewards);

    const userEscrows = await Promise.all(
      marketsWithRewards
        .map(market => {
          const contract = new Contract(market.address, F2_MARKET_ABI, web3provider);
          return contract.escrows(account);
        })
    );

    const activeEscrows = userEscrows.map((e, i) => {
      return { escrow: e, market: marketsWithRewards[i] };
    }).filter(d => d.escrow !== BURN_ADDRESS);

    const chainTokens = CHAIN_TOKENS[CHAIN_ID];
    const claimableTokens = activeEscrows.map(d => {
      return d.market.possibleRewards.map(rewardSymbol => getToken(chainTokens, rewardSymbol));
    });

    await Promise.all(
      activeEscrows.map(d => {
        return web3provider.send("eth_sendTransaction", [
          {
            from: account,
            to: d.escrow,
            data: getDataFieldForTransaction(d.market.isInv ? 'claimDBRTo(address)' : 'claimTo(address)', [d.escrow]),
            gasLimit: '0x0f4240',
          }
        ]);
      })
    );

    const claimableRewards = await Promise.all(
      claimableTokens.map((tokens, i) => {
        return Promise.all(
          tokens.map(token => {
            const contract = new Contract(token.address, ERC20_ABI, web3provider);
            return contract.balanceOf(activeEscrows[i].escrow);
          })
        );
      })
    );

    const result = {
      timestamp: (Date.now() - 1000),
      claimableRewards: activeEscrows.map((d, i) => {
        return {
          ...d,
          rewards: claimableRewards[i].map((r, j) => {
            return { ...claimableTokens[i][j], balance: getBnToNumber(r, claimableTokens[i][j].decimals) };
          }),
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