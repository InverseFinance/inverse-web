import { BigNumber, Contract } from 'ethers'
import { MerkleTree } from 'merkletreejs'
import { keccak256, solidityKeccak256 } from 'ethers/lib/utils'
import { getNetworkConfigConstants } from './networks';
import { MERKLE_DROP_ABI } from '@app/config/abis';
import { JsonRpcSigner } from '@ethersproject/providers';

const hashFn = (data: string) => keccak256(data).slice(2);
const { DBR_AIRDROP } = getNetworkConfigConstants();

export const getAccountProofs = (
  account: string,  
  airdropData: { [key: string]: string },
) => {
  const merkleTree = createTreeWithAccounts(airdropData);  
  return getAccountBalanceProof(merkleTree, account, airdropData[account]);
}

export const createTreeWithAccounts = (
  accounts: { [key: string]: string },
): MerkleTree => {
  const elements = Object.entries(accounts).map(([account, balance]) =>
    solidityKeccak256(['address', 'uint256'], [account, balance.toString()]),
  )
  return new MerkleTree(elements, hashFn, { sort: true })
}

export const getAccountBalanceProof = (
  tree: MerkleTree,
  account: string,
  amount: string | BigNumber,
) => {
  const element = solidityKeccak256(
    ['address', 'uint256'],
    [account, amount.toString()],
  )
  return tree.getHexProof(element)
}

export const verifyClaimAirdrop = (
  account: string, 
  tranche: string, 
  amount: string, 
  proofs: string[],
  signer: JsonRpcSigner,
) => {
  const contract = new Contract(DBR_AIRDROP, MERKLE_DROP_ABI, signer);
  return contract.verifyClaim(account, tranche, amount, proofs);
}

export const claimAirdrop = (
  account: string, 
  tranche: string, 
  amount: string, 
  proofs: string[],
  signer: JsonRpcSigner,
) => {
  const contract = new Contract(DBR_AIRDROP, MERKLE_DROP_ABI, signer);
  return contract.claimTranche(account, tranche, amount, proofs);
}