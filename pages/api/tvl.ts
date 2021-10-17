import { CTOKEN_ABI, VAULT_ABI, XINV_ABI } from "./config/abis";
import {
  ANCHOR_DOLA,
  ANCHOR_ETH,
  ANCHOR_TOKENS,
  DAI,
  USDC,
  STABILIZER,
  TOKENS,
  UNDERLYING,
  VAULT_TOKENS,
  WETH,
  XINV,
  COMPTROLLER,
  ORACLE
} from "./config/constants";
import { AlchemyProvider } from "@ethersproject/providers";
import { Contract, BigNumber } from "ethers";
import { formatUnits } from "ethers/lib/utils";
import "source-map-support";
import { STABILIZER_ABI, COMPTROLLER_ABI, ORACLE_ABI } from "./config/abis";
import * as fetch from "node-fetch";

export default async function handler(req, res) {
  try {
    const provider = new AlchemyProvider("homestead", process.env.ALCHEMY_API);
    const comptroller = new Contract(COMPTROLLER, COMPTROLLER_ABI, provider);
    const addresses = await comptroller.getAllMarkets();
    const oracle = new Contract(ORACLE, ORACLE_ABI, provider);
    const oraclePrices = await Promise.all(addresses.map(address => oracle.getUnderlyingPrice(address))) 
    let prices = oraclePrices
      .map((v,i) => parseFloat(formatUnits(v, BigNumber.from(36).sub(UNDERLYING[addresses[i]].decimals))))
      .reduce((p,v,i) => ({...p, [addresses[i]]:v}), {});
    prices[DAI] = 1
    prices[USDC] = 1

    const [
      vaultBalances,
      anchorBalances,
      stabilizerBalances,
    ] = await Promise.all([
      vaultsTVL(prices, provider),
      anchorTVL(prices, provider),
      stabilizerTVL(prices, provider),
    ]);

    const usdVault = vaultBalances.reduce(
      (balance, item) => balance + item.usdBalance,
      0
    );
    const usdAnchor = anchorBalances.reduce(
      (balance, item) => balance + item.usdBalance,
      0
    );
    const usdStabilizer = stabilizerBalances.reduce(
      (balance, item) => balance + item.usdBalance,
      0
    );

    res.status(200).json( {
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
    });
  } catch (err) {
    console.error(err);
  }
};

const vaultsTVL = async (prices, provider) => {
  const vaults = VAULT_TOKENS.map(
    (address) => new Contract(address, VAULT_ABI, provider)
  );

  const totalSupplies = await Promise.all(
    vaults.map((contract: Contract) => contract.totalSupply())
  );

  const balances = {};
  totalSupplies.forEach((totalSupply, i) => {
    const token = UNDERLYING[vaults[i].address] || TOKENS[WETH];
    balances[token.address] =
      (balances[token.address] || 0) +
      parseFloat(formatUnits(totalSupply, token.decimals));
  });

  return Object.entries(balances).map(([address, amount]: any) => {
    const token = TOKENS[address];

    return {
      ...token,
      balance: amount,
      usdBalance: amount * prices[token.address],
    };
  });
};

const anchorTVL = async (prices, provider) => {
  const anchorContracts = ANCHOR_TOKENS.map((address) => new Contract(address, CTOKEN_ABI, provider));
  anchorContracts.push(new Contract(XINV, XINV_ABI, provider));

  const allCash = await Promise.all(
    anchorContracts.map((contract: Contract) => contract.getCash())
  );

  const balances = {};
  allCash.forEach((cash, i) => {
    const token =
      anchorContracts[i].address !== ANCHOR_ETH
        ? UNDERLYING[anchorContracts[i].address]
        : TOKENS[WETH];

    balances[anchorContracts[i].address] =
      (balances[anchorContracts[i].address] || 0) +
      parseFloat(formatUnits(cash, token.decimals));
  });
  return Object.entries(balances).map(([address, amount]: any) => {
    const token = TOKENS[address];
    return {
      ...token,
      balance: amount,
      usdBalance: amount * prices[address],
    };
  });
};

const stabilizerTVL = async (prices, provider) => {
  const stabilizerContract = new Contract(STABILIZER, STABILIZER_ABI, provider);

  const token = TOKENS[DAI];
  const supply = await stabilizerContract.supply();
  const amount = parseFloat(formatUnits(supply, token.decimals));

  return [
    {
      ...token,
      balance: amount,
      usdBalance: amount * prices[token.address],
    },
  ];
};
