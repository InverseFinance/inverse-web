import { CTOKEN_ABI, VAULT_ABI, XINV_ABI } from "@inverse/config/abis";
import { Provider } from "@ethersproject/providers";
import { Contract, BigNumber } from "ethers";
import { formatUnits } from "ethers/lib/utils";
import "source-map-support";
import { STABILIZER_ABI, COMPTROLLER_ABI, ORACLE_ABI } from "@inverse/config/abis";
import { getNetworkConfig, getNetworkConfigConstants } from '@inverse/config/networks';
import { StringNumMap, TokenList, TokenWithBalance } from '@inverse/types';
import { getProvider } from '@inverse/util/providers';
import { getCacheFromRedis, getRedisClient } from '@inverse/util/redis';

const client = getRedisClient();

export default async function handler(req, res) {
  const { chainId = '1' } = req.query;
  // defaults to mainnet data if unsupported network
  const networkConfig = getNetworkConfig(chainId, true)!;
  const cacheKey = `${networkConfig.chainId}-tvl-cache`;

  try {
    const {
      DAI,
      USDC,
      UNDERLYING,
      ORACLE,
      COMPTROLLER,
      VAULT_TOKENS,
      STABILIZER,
      TOKENS,
      ANCHOR_TOKENS,
      ANCHOR_ETH,
      WETH,
      XINV_V1,
      XINV,
    } = getNetworkConfigConstants(networkConfig);


    const validCache = await getCacheFromRedis(cacheKey, true, 1800);
    if(validCache) {
      res.status(200).json(validCache);
      return
    }

    const provider = getProvider(networkConfig.chainId)
    const comptroller = new Contract(COMPTROLLER, COMPTROLLER_ABI, provider);
    const addresses: string[] = await comptroller.getAllMarkets();
    const oracle = new Contract(ORACLE, ORACLE_ABI, provider);
    const oraclePrices = await Promise.all(addresses.map(address => oracle.getUnderlyingPrice(address)));

    let prices: StringNumMap = oraclePrices
      .map((v, i) => parseFloat(formatUnits(v, BigNumber.from(36).sub(UNDERLYING[addresses[i]].decimals))))
      .reduce((p, v, i) => ({ ...p, [addresses[i]]: v }), {});

    prices[DAI] = 1
    prices[USDC] = 1

    const [
      vaultBalances,
      anchorBalances,
      stabilizerBalances,
    ] = await Promise.all([
      vaultsTVL(prices, provider, WETH, VAULT_TOKENS, TOKENS, UNDERLYING),
      anchorTVL(prices, provider, XINV_V1, XINV, ANCHOR_ETH, WETH, ANCHOR_TOKENS, TOKENS, UNDERLYING),
      stabilizerTVL(prices, provider, DAI, STABILIZER, TOKENS),
    ]);

    const usdVault = sumUsdBalances(vaultBalances);
    const usdAnchor = sumUsdBalances(anchorBalances);
    const usdStabilizer = sumUsdBalances(stabilizerBalances);

    const resultData = {
      tvl: usdVault + usdAnchor + usdStabilizer,
      vaults: {
        tvl: usdVault,
        assets: vaultBalances,
      },
      anchor: {
        tvl: usdAnchor,
        assets: anchorBalances,
      },
      stabilizer: {
        tvl: usdStabilizer,
        assets: stabilizerBalances,
      },
    }

    await client.set(cacheKey, JSON.stringify({ timestamp: Date.now(), data: resultData }));

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

const vaultsTVL = async (
  prices: StringNumMap,
  provider: Provider,
  wethAddress: string,
  vaultTokens: string[],
  tokens: TokenList,
  underlying: TokenList,
): Promise<TokenWithBalance[]> => {
  const vaults = vaultTokens.map(
    (address) => new Contract(address, VAULT_ABI, provider)
  );

  const totalSupplies = await Promise.all(
    vaults.map((contract: Contract) => contract.totalSupply())
  );

  const balances: StringNumMap = {};

  totalSupplies.forEach((totalSupply, i) => {
    const token = underlying[vaults[i].address] || tokens[wethAddress];
    balances[token.address] =
      (balances[token.address] || 0) +
      parseFloat(formatUnits(totalSupply, token.decimals));
  });

  return Object.entries(balances).map(([address, amount]: any) => {
    const token = tokens[address];

    return {
      ...token,
      balance: amount,
      usdBalance: amount * prices[token.address] || 0,
    };
  });
};

const anchorTVL = async (
  prices: StringNumMap,
  provider: Provider,
  xInvV1Address: string,
  xInvAddress: string,
  anchorEthAddress: string,
  wethAddress: string,
  anchorTokenAddresses: string[],
  tokens: TokenList,
  underlying: TokenList,
): Promise<TokenWithBalance[]> => {
  const anchorContracts = anchorTokenAddresses.map((address: string) => new Contract(address, CTOKEN_ABI, provider));
  anchorContracts.push(new Contract(xInvV1Address, XINV_ABI, provider));
  anchorContracts.push(new Contract(xInvAddress, XINV_ABI, provider));

  const allCash = await Promise.all(
    anchorContracts.map((contract: Contract) => contract.getCash())
  );

  const balances: StringNumMap = {};

  allCash.forEach((cash, i) => {
    const token =
      anchorContracts[i].address !== anchorEthAddress
        ? underlying[anchorContracts[i].address]
        : tokens[wethAddress];

    balances[anchorContracts[i].address] =
      (balances[anchorContracts[i].address] || 0) +
      parseFloat(formatUnits(cash, token.decimals));
  });

  return Object.entries(balances).map(([address, amount]: any) => {
    const token = tokens[address];
    return {
      ...token,
      balance: amount,
      usdBalance: amount * prices[address] || 0,
    };
  });
};

const stabilizerTVL = async (
  prices: StringNumMap,
  provider: Provider,
  daiAddress: string,
  stabilizerAddress: string,
  tokens: TokenList
): Promise<TokenWithBalance[]> => {
  const stabilizerContract = new Contract(stabilizerAddress, STABILIZER_ABI, provider);

  const token = tokens[daiAddress];
  const supply = await stabilizerContract.supply();
  const amount = parseFloat(formatUnits(supply, token.decimals));
  const tokenWithBalance: TokenWithBalance = {
    ...token,
    balance: amount,
    usdBalance: amount * prices[token.address] || 0,
  };

  return [
    tokenWithBalance
  ];
};

const sumUsdBalances = (tokenWithBalances: TokenWithBalance[]): number => {
  return tokenWithBalances.reduce(
    (usdBalance, item) => usdBalance + item.usdBalance,
    0
  ) || 0;
}
