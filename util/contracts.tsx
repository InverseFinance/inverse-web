import { JsonRpcSigner, Web3Provider, FallbackProvider } from '@ethersproject/providers'
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
} from '@app/config/abis'
import { getNetworkConfigConstants } from '@app/util/networks'
import { Bond, GovEra, NetworkIds, Token } from '@app/types'
import { formatUnits, parseUnits } from 'ethers/lib/utils';
import { handleTx, HandleTxOptions } from './transactions'
import { JsonRpcProvider } from '@ethersproject/providers';

export const getNewContract = (
  address: string,
  abi: string[],
  signer: JsonRpcSigner | Web3Provider | undefined
) => new Contract(address, abi, signer)

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

export const getDolaCrvPoolContract = (signer: JsonRpcSigner | Web3Provider | undefined) => {
  const { DOLA3POOLCRV } = getNetworkConfigConstants(signer?.provider?.network?.chainId);
  return getNewContract(DOLA3POOLCRV, DOLA3POOLCRV_ABI, signer);
}

const CRV_INDEXES: any = { DOLA: 0, DAI: 1, USDC: 2, USDT: 3 }

export const estimateCrvSwap = (signer: JsonRpcSigner, fromUnderlying: Token, toUnderlying: Token, amount: number, toAmount: number) => {
  return crvSwap(signer, fromUnderlying, toUnderlying, amount, toAmount, 1, true);
}

export const crvSwap = (signer: JsonRpcSigner, fromUnderlying: Token, toUnderlying: Token, amount: number, toAmount: number, maxSlippage: number, isEstimate = false) => {

  const contract = getDolaCrvPoolContract(signer);

  const bnAmount = parseUnits(amount.toString(), fromUnderlying.decimals);
  const minReveived = (toAmount - (toAmount * maxSlippage / 100)).toFixed(toUnderlying.decimals);
  const bnMinReceived = parseUnits(minReveived, toUnderlying.decimals);
  const fromIndex = CRV_INDEXES[fromUnderlying.symbol]
  const toIndex = CRV_INDEXES[toUnderlying.symbol]

  if(isEstimate) {
    return contract.estimateGas.exchange_underlying(fromIndex, toIndex, bnAmount, bnMinReceived);
  } else {
    return contract.exchange_underlying(fromIndex, toIndex, bnAmount, bnMinReceived);
  }
}
// useful to get the exRate
export const crvGetDyUnderlying = async (signerOrProvider: JsonRpcSigner | Web3Provider, fromUnderlying: Token, toUnderlying: Token, amount: number) => {
  if(amount <= 0) { return '0' }
  const contract = getDolaCrvPoolContract(signerOrProvider);

  const fromIndex = CRV_INDEXES[fromUnderlying.symbol]
  const toIndex = CRV_INDEXES[toUnderlying.symbol]
  
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
  const maxPrice = Math.floor(((bond.marketPrice + maxSlippagePerc/100 * bond.marketPrice) * 1e7)/1e7);
  const maxPriceUint = parseUnits(maxPrice.toString(), 7);
  const amountUint = parseUnits(amount, bond.underlying.decimals);
  
  return contract.deposit(amountUint, maxPriceUint, depositor);
}

export const bondRedeem = (bond: Bond, signer: JsonRpcSigner, depositor: string) => {
  const contract = getBondContract(bond.bondContract, signer);
  return contract.redeem(depositor);
}