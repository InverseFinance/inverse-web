import { JsonRpcSigner, Web3Provider, FallbackProvider, Provider } from '@ethersproject/providers'
import { Contract } from '@ethersproject/contracts'
import {
  COMPTROLLER_ABI,
  CTOKEN_ABI,
  STABILIZER_ABI,
  GOVERNANCE_ABI,
  INV_ABI,
  CETHER_ABI,
  ERC20_ABI,
  LENS_ABI,
  ESCROW_ABI,
  MULTIDELEGATOR_ABI,
  DOLA3POOLCRV_ABI,
  AN_CHAIN_COIN_REPAY_ALL_ABI,
  BOND_ABI,
  SWAP_ROUTER_ABI,
  DISPERSE_APP_ABI,
  DEBT_REPAYER_ABI,
  BALANCER_VAULT_ABI,
  DEBT_CONVERTER_ABI,
  CONVEX_REWARD_POOL,
} from '@app/config/abis'
import { getNetworkConfigConstants } from '@app/util/networks'
import { Bond, GovEra, NetworkIds, Token } from '@app/types'
import { formatUnits, parseEther, parseUnits } from 'ethers/lib/utils';
import { handleTx, HandleTxOptions } from './transactions'
import { JsonRpcProvider } from '@ethersproject/providers';
import { CHAIN_TOKENS } from '@app/variables/tokens'
import { getBnToNumber } from './markets'
import { BigNumber, BigNumberish } from 'ethers'
import { PROTOCOL_IMAGES } from '@app/variables/images'
import { getMulticallOutput } from './multicall'

const { DEBT_CONVERTER, DOLA3POOLCRV, DOLAFRAXCRV } = getNetworkConfigConstants();

export const getNewContract = (
  address: string,
  abi: string[],
  signer: JsonRpcSigner | Web3Provider | undefined
) => new Contract(address, abi, signer)

export const getSwapRouterContract = (signer: JsonRpcSigner | Web3Provider | undefined) => {
  const { SWAP_ROUTER } = getNetworkConfigConstants(signer?.provider?.network?.chainId);
  return getNewContract(SWAP_ROUTER, SWAP_ROUTER_ABI, signer);
}

export const getComptrollerContract = (signer: JsonRpcSigner | undefined) => {
  const { COMPTROLLER } = getNetworkConfigConstants(signer?.provider?.network?.chainId);
  return getNewContract(COMPTROLLER, COMPTROLLER_ABI, signer);
}

export const getAnchorContract = (
  address: string,
  signer: JsonRpcSigner | undefined
) => {
  return getNewContract(address, CTOKEN_ABI, signer)
}

export const getStabilizerContract = (signer: JsonRpcSigner | JsonRpcProvider | FallbackProvider | undefined) => {
  const { STABILIZER } = getNetworkConfigConstants(signer?.provider?.network?.chainId);
  return getNewContract(STABILIZER, STABILIZER_ABI, signer);
}

export const getGovernanceAddress = (era: GovEra, chainId?: string | number) => {
  const { GOVERNANCE, GOVERNANCE_ALPHA } = getNetworkConfigConstants(chainId || NetworkIds.mainnet)
  const govs = { [GovEra.alpha]: GOVERNANCE_ALPHA, [GovEra.mills]: GOVERNANCE };
  return govs[era];
}

export const getGovernanceContract = (signer: JsonRpcSigner | undefined, era: GovEra) => {
  const govAddress = getGovernanceAddress(era);
  return getNewContract(govAddress, GOVERNANCE_ABI, signer)
}

export const getEscrowContract = (escrowAddress: string, signer: JsonRpcSigner | undefined) => {
  return getNewContract(escrowAddress, ESCROW_ABI, signer)
}

export const getINVContract = (signer: JsonRpcSigner | undefined) => {
  const { INV } = getNetworkConfigConstants(signer?.provider?.network?.chainId);
  return getNewContract(INV, INV_ABI, signer)
}

export const getMultiDelegatorContract = (signer: JsonRpcSigner | undefined) => {
  const { MULTI_DELEGATOR } = getNetworkConfigConstants(signer?.provider?.network?.chainId);
  return getNewContract(MULTI_DELEGATOR, MULTIDELEGATOR_ABI, signer);
}

export const getCEtherContract = (
  address: string,
  signer: JsonRpcSigner | undefined
) => getNewContract(address, CETHER_ABI, signer)

export const getEthRepayAllContract = (
  address: string,
  signer: JsonRpcSigner | undefined
) => getNewContract(address, AN_CHAIN_COIN_REPAY_ALL_ABI, signer)

export const getERC20Contract = (
  address: string,
  signer: JsonRpcSigner | undefined
) => getNewContract(address, ERC20_ABI, signer)

export const getLensContract = (signer: JsonRpcSigner | undefined) => {
  const { LENS } = getNetworkConfigConstants(signer?.provider?.network?.chainId);
  return getNewContract(LENS, LENS_ABI, signer);
}

export const getTokensFromFaucet = async (tokenSymbol: 'INV' | 'DOLA', qty: string, signer: JsonRpcSigner | undefined) => {
  if (!signer || signer?.provider?.network?.chainId.toString() !== NetworkIds.rinkeby) { return }

  const { [tokenSymbol]: tokenAddress } = getNetworkConfigConstants(NetworkIds.rinkeby);
  // TODO: do corresponding logic (a special ERC20 token contract or a dedicated faucet contract to come)
  // const contract = getNewContract(tokenAddress, FAUCET_ABI, signer);
  // const tx = await contract.faucetFunction(utils.parseUnits(qty, 18))
  // const txReceipt = await tx.wait()
}

export const getDOLAsFromFaucet = (signer: JsonRpcSigner | undefined) => {
  getTokensFromFaucet('DOLA', '2000', signer)
}

export const getINVsFromFaucet = (signer: JsonRpcSigner | undefined) => {
  getTokensFromFaucet('INV', '2', signer)
}

export const getDolaCrvPoolContract = (signer: JsonRpcSigner | Web3Provider | undefined, poolAddress = DOLA3POOLCRV) => {
  return getNewContract(poolAddress, DOLA3POOLCRV_ABI, signer);
}

const CRV_INDEXES: any = {
  [DOLA3POOLCRV]: { DOLA: 0, DAI: 1, USDC: 2, USDT: 3 },
  [DOLAFRAXCRV]: { DOLA: 0, FRAX: 1, USDC: 2 },
}

export const estimateCrvSwap = (signer: JsonRpcSigner, fromUnderlying: Token, toUnderlying: Token, amount: number, toAmount: number) => {
  return crvSwap(signer, fromUnderlying, toUnderlying, amount, toAmount, 1, true);
}

export const estimateCrvSwapRouted = (signer: JsonRpcSigner, fromUnderlying: Token, toUnderlying: Token, amount: number, toAmount: number) => {
  return crvSwapRouted(signer, fromUnderlying, toUnderlying, amount, toAmount, 1, true);
}

export const crvSwapRouted = async (signer: JsonRpcSigner, fromUnderlying: Token, toUnderlying: Token, amount: number, toAmount: number, maxSlippage: number, isEstimate = false) => {

  const contract = getSwapRouterContract(signer);
  const [indices, pools] = await contract.find_coin_routes(fromUnderlying.address, toUnderlying.address);
  const bnAmount = parseUnits(amount.toString(), fromUnderlying.decimals);
  const minReveived = (toAmount - (toAmount * maxSlippage / 100)).toFixed(toUnderlying.decimals);
  const bnMinReceived = parseUnits(minReveived, toUnderlying.decimals);

  const receiver = await signer.getAddress();

  if (isEstimate) {
    return contract.estimateGas.exchange_underlying_routed(indices, pools, bnAmount, bnMinReceived, receiver);
  } else {
    return contract.exchange_underlying_routed(indices, pools, bnAmount, bnMinReceived, receiver);
  }
}
// useful to get the exRate
export const crvGetDyUnderlyingRouted = async (signerOrProvider: JsonRpcSigner | Web3Provider, fromUnderlying: Token, toUnderlying: Token, amount: number) => {
  if (amount <= 0) { return '0' }
  const contract = getSwapRouterContract(signerOrProvider);
  const [indices, pools] = await contract.find_coin_routes(fromUnderlying.address, toUnderlying.address);

  const bnAmount = parseUnits(amount.toFixed(fromUnderlying.decimals), fromUnderlying.decimals);

  try {
    return formatUnits(await contract.get_dy_underlying_routed(indices, pools, bnAmount), toUnderlying.decimals);
  } catch (e) {
    console.log(e);
    return '0'
  }
}

export const crvSwap = (
  signer: JsonRpcSigner,
  fromUnderlying: Token,
  toUnderlying: Token,
  amount: number,
  toAmount: number,
  maxSlippage: number,
  isEstimate = false,
  poolAddress = DOLA3POOLCRV
) => {

  const contract = getDolaCrvPoolContract(signer, poolAddress);

  const bnAmount = parseUnits(amount.toString(), fromUnderlying.decimals);
  const minReveived = (toAmount - (toAmount * maxSlippage / 100)).toFixed(toUnderlying.decimals);
  const bnMinReceived = parseUnits(minReveived, toUnderlying.decimals);
  const fromIndex = CRV_INDEXES[poolAddress][fromUnderlying.symbol]
  const toIndex = CRV_INDEXES[poolAddress][toUnderlying.symbol]

  if (isEstimate) {
    return contract.estimateGas.exchange_underlying(fromIndex, toIndex, bnAmount, bnMinReceived);
  } else {
    return contract.exchange_underlying(fromIndex, toIndex, bnAmount, bnMinReceived);
  }
}
// useful to get the exRate
export const crvGetDyUnderlying = async (
  signerOrProvider: JsonRpcSigner | Web3Provider,
  fromUnderlying: Token,
  toUnderlying: Token,
  amount: number,
  poolAddress = DOLA3POOLCRV
) => {
  if (amount <= 0) { return '0' }
  const contract = getDolaCrvPoolContract(signerOrProvider, poolAddress);

  const fromIndex = CRV_INDEXES[poolAddress][fromUnderlying.symbol]
  const toIndex = CRV_INDEXES[poolAddress][toUnderlying.symbol]

  const bnAmount = parseUnits(amount.toFixed(fromUnderlying.decimals), fromUnderlying.decimals);

  try {
    return formatUnits(await contract.get_dy_underlying(fromIndex, toIndex, bnAmount), toUnderlying.decimals);
  } catch (e) {
    console.log(e);
    return '0'
  }
}

export const claimInvRewards = async (signer: JsonRpcSigner, cTokenAddresses: string[], options?: HandleTxOptions) => {
  const contract = getComptrollerContract(signer);
  const account = await signer.getAddress();
  const tx = await contract["claimComp(address,address[])"](account, cTokenAddresses);
  return handleTx(tx, options);
}

export const claimAllInvRewards = async (signer: JsonRpcSigner, options?: HandleTxOptions) => {
  const contract = getComptrollerContract(signer);
  const account = await signer.getAddress();
  const tx = await contract["claimComp(address)"](account);
  return handleTx(tx, options);
}

export const liquidateCtoken = (account: string, signer: JsonRpcSigner, amount: string, market: string, underlying: Token, collateralCtoken: string) => {
  const contract = getAnchorContract(market, signer);
  return contract.liquidateBorrow(account, parseUnits(amount, underlying.decimals), collateralCtoken);
}

export const liquidateCether = (account: string, signer: JsonRpcSigner, amount: string, market: string, underlying: Token, collateralCtoken: string) => {
  const contract = getCEtherContract(market, signer);
  return contract.liquidateBorrow(parseUnits(amount, underlying.decimals), account, collateralCtoken);
}

export const liquidateBorrow = (account: string, signer: JsonRpcSigner, amount: string, market: string, underlying: Token, collateralCtoken: string) => {
  const args = [account, signer, amount, market, underlying, collateralCtoken];
  return !underlying.address ? liquidateCether(...args) : liquidateCtoken(...args);
}

export const getBondContract = (bondAddress: string, signer: JsonRpcSigner) => {
  return new Contract(bondAddress, BOND_ABI, signer);
}

export const bondDeposit = (bond: Bond, signer: JsonRpcSigner, amount: string, maxSlippagePerc: number, depositor: string) => {
  const contract = getBondContract(bond.bondContract, signer);
  const maxPrice = Math.floor(((bond.marketPrice + maxSlippagePerc / 100 * bond.marketPrice) * 1e7) / 1e7);
  const maxPriceUint = parseUnits(maxPrice.toString(), 7);
  const amountUint = parseUnits(amount, bond.underlying.decimals);

  return contract.deposit(amountUint, maxPriceUint, depositor);
}

export const bondRedeem = (bond: Bond, signer: JsonRpcSigner, depositor: string) => {
  const contract = getBondContract(bond.bondContract, signer);
  return contract.redeem(depositor);
}

const getBalancerPoolBalances = async (token: Token, providerOrSigner: Provider | JsonRpcSigner) => {
  const contract = new Contract(token.balancerInfos?.vault!, BALANCER_VAULT_ABI, providerOrSigner);
  const [addresses, balances, lastChangeBlock] = await contract.getPoolTokens(token.balancerInfos?.poolId!);
  return balances;
}

const cvxConstants = {
  totalCliffs: 1000,
  reductionPerCliff: 100000,
  maxSupply: 100000000,
};

// Convex rewards uses a specific calculation method...
// check mint (not _mint) function here: https://etherscan.io/address/0x4e3FBD56CD56c3e72c1403e103b45Db9da5B9D2B#code
const getCrvToCvxReward = (crvRewardBn: BigNumber, supplyBn: BigNumber): number => {
  const crvReward = getBnToNumber(crvRewardBn);
  const supply = getBnToNumber(supplyBn);
  const cliff = supply / cvxConstants.reductionPerCliff;
  if (cliff >= cvxConstants.totalCliffs) {
    return 0;
  }
  const reduction = cvxConstants.totalCliffs - cliff;
  const cvxAmount = crvReward * reduction / cvxConstants.totalCliffs;
  const amtTillMax = cvxConstants.maxSupply - supply;
  if (cvxAmount > amtTillMax) {
    return amtTillMax;
  }
  return cvxAmount;
}

const auraConstants = {
  totalCliffs: 500,
  reductionPerCliff: 100000,
  maxSupply: 50000000,
  initAmount: 50000000,
  minterMinted: 0,
};

const getBalToAuraReward = (balRewardBn: BigNumber, supplyBn: BigNumber): number => {
  const balReward = getBnToNumber(balRewardBn);
  const supply = getBnToNumber(supplyBn);
  const emissionsMinted = supply - auraConstants.initAmount - auraConstants.minterMinted;
  const cliff = emissionsMinted / auraConstants.reductionPerCliff;
  if (cliff >= auraConstants.totalCliffs) {
    return 0;
  }
  const reduction = (auraConstants.totalCliffs - cliff) * 2.5 + 700;
  const auraAmount = balReward * reduction / auraConstants.totalCliffs;
  const amtTillMax = auraConstants.maxSupply - emissionsMinted;
  if (auraAmount > amtTillMax) {
    return amtTillMax;
  }
  return auraAmount;
}

const poolRewardsAbis = {
  'specifyUnderlying': `function earned(address, address) public view returns(uint)`,
  'default': `function earned(address) public view returns(uint)`,
}

export const getPoolRewards = async (rewardPools: any[], account: string, chainId: string, providerOrSigner: Provider | JsonRpcSigner): Promise<any[]> => {
  const dataForRewards = await Promise.all(
    rewardPools.map(p => {
      if (p.isCVXreward || p.isAURAreward) {
        return (new Contract(p.underlying, ERC20_ABI, providerOrSigner)).totalSupply();
      }
      const contract = new Contract(p.address, [poolRewardsAbis[p.type || 'default']], providerOrSigner);
      const args = p.type === 'specifyUnderlying' ? [p.underlying, account] : [account];
      return contract[p.method](...args);
    })
  );

  return rewardPools.map((rp, i) => {
    const rewardToken = CHAIN_TOKENS[chainId][rp.underlying];
    return {
      ...rp,
      reward: rp.isCVXreward || rp.isAURAreward ?// cvx should be after crv
        rp.isCVXreward ? getCrvToCvxReward(dataForRewards[i - 1], dataForRewards[i])
          : getBalToAuraReward(dataForRewards[i - 1], dataForRewards[i])
        :
        getBnToNumber(dataForRewards[i], rewardToken.decimals),
      rewardToken,
    }
  });
}

export const getCrvConvexRewards = async (baseRewardPool: string, account: string, providerOrSigner?: Provider | JsonRpcSigner): Promise<number[]> => {
  const contract = new Contract(baseRewardPool, CONVEX_REWARD_POOL, providerOrSigner);
  const rewards = await Promise.all([
    // CRV
    contract.earned(account),
    // CVX
    //
  ]);
  return rewards.map(bn => getBnToNumber(bn));
}

export const getCurveLpTVL = async (address: string, providerOrSigner?: Provider | JsonRpcSigner, chainId = 1) => {
  const contract = new Contract(address, DOLA3POOLCRV_ABI, providerOrSigner);
  const results = await getMulticallOutput([
    { contract, functionName: 'get_virtual_price' },
    { contract, functionName: 'totalSupply' },
  ], chainId);
  return getBnToNumber(results[0]) * getBnToNumber(results[1]);
}
// example for the DOLA-FRAXUSDC lp where FRAXUSDC is another curve LP
export const getCurveNestedLpData = async (lpToken: Token, nestedPrices: number[], providerOrSigner?: Provider | JsonRpcSigner) => {
  const mainContract = new Contract(lpToken.address, ERC20_ABI, providerOrSigner);
  const fraxUsdcLpContract = new Contract(lpToken.nestedLpAddress, DOLA3POOLCRV_ABI, providerOrSigner);
  const fraxUsdcTokenContract = new Contract(lpToken.pairs[1], ERC20_ABI, providerOrSigner);  
  const queries = [
    { contract: fraxUsdcLpContract, functionName: 'get_virtual_price' },
    { contract: fraxUsdcTokenContract, functionName: 'balanceOf', params: [lpToken.address] },    
  ];
  if(lpToken.deduce?.length) {
    const convexContract = new Contract(lpToken.deduce[0], ERC20_ABI, providerOrSigner);
    queries.push({ contract: mainContract, functionName: 'totalSupply' });
    queries.push({ contract: convexContract, functionName: 'totalSupply' });
  }
  const results = await getMulticallOutput(queries, 1);
  const minPrice = Math.min(...nestedPrices);
  const depth = getBnToNumber(results[0]) * getBnToNumber(results[1]) * minPrice;
  return {
    depth,
    convexRatio: lpToken.deduce?.length ? getBnToNumber(results[3]) / getBnToNumber(results[2]) : undefined,
  };
}

export const getLPBalances = async (LPToken: Token, chainId = process.env.NEXT_PUBLIC_CHAIN_ID!, providerOrSigner?: Provider | JsonRpcSigner): Promise<Token & { balance: number, perc: number }[]> => {
  const tokens = LPToken.pairs?.map(address => CHAIN_TOKENS[chainId][address]) || [];
  try {
    if (LPToken.isCrvLP && !!LPToken.pairs) {
      const balancesBn = await Promise.all(
        tokens.map((token, tokenIndex) => new Contract(LPToken.poolAddress || LPToken.address, DOLA3POOLCRV_ABI, providerOrSigner).balances(tokenIndex))
      );
      const balances = balancesBn.map((bn, i) => getBnToNumber(bn, tokens[i].decimals));
      const total = balances.reduce((prev, curr) => prev + curr, 0);
      return tokens.map((token, i) => {
        return { ...token, balance: balances[i], perc: total > 0 ? balances[i] / total * 100 : 0 };
      })
    } else if (LPToken.balancerInfos && !!LPToken.pairs) {
      const balancesBn = await getBalancerPoolBalances(LPToken, providerOrSigner);
      let subShareFactor = 1;
      const bpPool = LPToken.balancerInfos.poolId.substring(0, 42);
      if (LPToken.protocolImage === PROTOCOL_IMAGES.AURA) {
        const [balSupply, auraSupply] = await Promise.all([
          // blp supply
          (new Contract(bpPool, ERC20_ABI, providerOrSigner)).totalSupply(),
          // aura lp supply
          (new Contract(LPToken.address, ERC20_ABI, providerOrSigner)).totalSupply(),
        ]);
        subShareFactor = getBnToNumber(auraSupply) / getBnToNumber(balSupply);
      }
      const _balances = balancesBn.map((bn, i) => getBnToNumber(bn, tokens[i]?.decimals || 18) * subShareFactor);
      // balancer composable metapools contain the LP itself, we can skip it for our calc
      const balances = _balances.filter((v, i) => tokens[i].address?.toLowerCase() !== bpPool?.toLowerCase());
      const total = balances.reduce((prev, curr) => prev + curr, 0);
      return tokens.filter((token => token.address.toLowerCase() !== bpPool.toLowerCase())).map((token, i) => {
        return { ...token, balance: balances[i], perc: total > 0 ? balances[i] / total * 100 : 0 };
      });
    }
    // UniV3
    else if (LPToken.isUniV3 && !!LPToken.pairs) {
      const balancesBn = await Promise.all(
        tokens.map((token, tokenIndex) => new Contract(token.address, ERC20_ABI, providerOrSigner).balanceOf(LPToken.address))
      );
      const balances = balancesBn.map((bn, i) => getBnToNumber(bn, tokens[i].decimals));
      const total = balances.reduce((prev, curr) => prev + curr, 0);
      return tokens.map((token, i) => {
        return { ...token, balance: balances[i], perc: total > 0 ? balances[i] / total * 100 : 0 };
      })
    }
    // Uni/Sushi or Solidly
    else if (!!LPToken.pairs) {
      let balancesBn;
      if (LPToken.isFusionLP) {
        balancesBn = await (new Contract(LPToken.address, ['function getTotalAmounts() public view returns (uint,uint)'], providerOrSigner).getTotalAmounts());
      } else {
        balancesBn = await (new Contract(LPToken.address, ['function getReserves() public view returns (uint,uint,uint)'], providerOrSigner).getReserves());
      };
      const balances = balancesBn.slice(0, 2).map((bn, i) => getBnToNumber(bn, tokens[i].decimals));
      const total = balances.reduce((prev, curr) => prev + curr, 0);
      return tokens.map((token, i) => {
        return { ...token, balance: balances[i], perc: total > 0 ? balances[i] / total * 100 : 0 };
      })
    }
  } catch (e) {
    console.log(e)
  }
  return [];
}

export const getLPPrice = async (LPToken: Token, chainId = process.env.NEXT_PUBLIC_CHAIN_ID!, providerOrSigner?: Provider | JsonRpcSigner, prices?): Promise<number> => {
  if (LPToken.lpPrice) { return new Promise(r => r(LPToken.lpPrice!)) }
  else if (!providerOrSigner) { return new Promise(r => r(0)) }
  else if (LPToken.isCrvLP) {
    return getBnToNumber(await (new Contract(LPToken.poolAddress || LPToken.address, DOLA3POOLCRV_ABI, providerOrSigner).get_virtual_price()), LPToken.decimals);
  } else if (LPToken.convexInfos) {
    return getBnToNumber(await (new Contract(LPToken.convexInfos.fromPrice, DOLA3POOLCRV_ABI, providerOrSigner).get_virtual_price()), LPToken.decimals);
  } // treat uniV3 nft pos as $1
  else if (LPToken.isUniV3) {
    return new Promise(r => r(1))
  }

  let lpPrice = 0

  try {
    const tokens = LPToken.pairs.map(address => CHAIN_TOKENS[chainId][address]);

    const coingeckoIds = tokens
      .map(({ coingeckoId }) => coingeckoId)

    let [lpTokenTotalSupply, balancesInLp, cgFetch] = await Promise.all([
      (new Contract(LPToken.address, ERC20_ABI, providerOrSigner).totalSupply()),
      LPToken.balancerInfos ?
        await getBalancerPoolBalances(LPToken, providerOrSigner) :
        await Promise.all(
          LPToken.pairs.map(address => {
            return new Contract(address, ERC20_ABI, providerOrSigner).balanceOf(LPToken.address)
          }),
        ),
      prices ? new Promise((r) => r(null)) : fetch(`${process.env.COINGECKO_PRICE_API}?vs_currencies=usd&ids=${coingeckoIds.join(',')}`)
    ]);

    const balances = balancesInLp.map((bn, i) => {
      return getBnToNumber(bn, tokens[i].decimals);
    });

    const _prices = prices ? prices : await cgFetch.json();

    let supply = LPToken.isComposableMetapool ?
      balances.reduce((prev, curr, idx) => prev + (tokens[idx].address === LPToken.address ? 0 : curr), 0)
      : getBnToNumber(lpTokenTotalSupply);

    lpPrice = tokens.reduce((prev, curr, idx) => {
      const bal = (tokens[idx].address === LPToken.address ? 0 : balances[idx]);
      const worthUsd = (bal * (_prices[curr.coingeckoId]?.usd || 1) / supply);
      return prev + worthUsd;
    }, 0);
  } catch (e) {

  }

  return lpPrice;
}

export const disperseEther = (params: { address: string, value: string }[], signer: JsonRpcSigner) => {
  const { DISPERSE_APP } = getNetworkConfigConstants();
  const contract = new Contract(DISPERSE_APP, DISPERSE_APP_ABI, signer);
  const addresses = params.map(p => p.address);
  const values = params.map(p => parseEther(p.value));
  const total = values.reduce((prev, curr) => prev.add(curr), BigNumber.from('0'));
  return contract.disperseEther(addresses, values, { value: total });
}

export const disperseToken = (token: Token, params: { address: string, value: string }[], signer: JsonRpcSigner) => {
  const { DISPERSE_APP } = getNetworkConfigConstants();
  const contract = new Contract(DISPERSE_APP, DISPERSE_APP_ABI, signer);
  return contract.disperseToken(token.address, params.map(p => p.address), params.map(p => parseUnits(p.value, token.decimals)));
}

export const sellV1AnToken = (signer: JsonRpcSigner, anToken: string, amount: string | BigNumber, minUnderlyingReceived: string | BigNumber) => {
  const { DEBT_REPAYER } = getNetworkConfigConstants();
  const contract = new Contract(DEBT_REPAYER, DEBT_REPAYER_ABI, signer);
  return contract.sellDebt(anToken, amount, minUnderlyingReceived);
}

export const convertToIOU = (
  signer: JsonRpcSigner,
  anToken: string,
  amount: string | BigNumber,
  minDOLAoutput: string | BigNumber,
) => {
  const contract = new Contract(DEBT_CONVERTER, DEBT_CONVERTER_ABI, signer);
  return contract.convert(anToken, amount, minDOLAoutput);
}

export const redeemAllIOUs = (
  signer: JsonRpcSigner,
  conversionIndex: string | number,
) => {
  const contract = new Contract(DEBT_CONVERTER, DEBT_CONVERTER_ABI, signer);
  return contract.redeemAll(conversionIndex);
}

export const debtRepay = (
  signer: JsonRpcSigner,
  dolaAmount: string | BigNumber,
) => {
  const contract = new Contract(DEBT_CONVERTER, DEBT_CONVERTER_ABI, signer);
  return contract.repayment(dolaAmount);
}

export const getUniV3PositionsOf = async (signer: Provider | JsonRpcSigner, liqProvider: string) => {
  const uniV3NFTContract = new Contract(
    '0xC36442b4a4522E871399CD717aBDD847Ab11FE88',
    [
      'function balanceOf(address) public view returns(uint)',
      'function tokenOfOwnerByIndex(address, uint) public view returns(uint)',
      'function positions(uint nftId) public view returns (tuple(uint nonce, address operator, address token0, address token1, uint fee, int24 tickLower, uint tickUpper, uint liquidity, uint feeGrowthInside0LastX128, uint feeGrowthInside1LastX128, uint tokensOwed0, uint tokensOwed1))',
    ],
    signer,
  );

  const nbNfts = getBnToNumber((await uniV3NFTContract.balanceOf(liqProvider)), 0);
  const arr = [...Array(nbNfts).keys()];
  const nftIds = await Promise.all(
    arr.map(i => uniV3NFTContract.tokenOfOwnerByIndex(liqProvider, i))
  );
  const positions = await Promise.all(
    nftIds.map(id => uniV3NFTContract.positions(id))
  );
  return positions;
}

export const callWithHigherGL = async (
  contract: Contract,
  method: string,
  args: any[],
  increaseGL = 50000,
  options: { value?: BigNumberish } = {},
) => {
  let gasLimit = undefined;
  try {
    const originalEstimate = await contract.estimateGas[method](...args);
    gasLimit = originalEstimate.add(increaseGL);
    console.log('gas estimate', originalEstimate.toString());
    console.log('gl increased to', gasLimit.toString());
  } catch (e) {
    console.log('could not estimate gas, using default');
    console.log(e);
  }
  return contract[method](...args, { gasLimit, ...options });
}