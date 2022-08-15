import { SWR } from "@app/types"
import { getBnToNumber } from "@app/util/markets";
import { getNetworkConfigConstants } from "@app/util/networks"
import { BigNumber } from "ethers/lib/ethers";
import useEtherSWR from "./useEtherSWR"

const { DBR } = getNetworkConfigConstants();

const zero = BigNumber.from('0');

export const useAccountDBR = (account: string): SWR & {
  balance: number,
  allowance: number,
  debt: number,
  interests: number,
  signedBalance: number,
} => {
  const { data, error } = useEtherSWR([
    [DBR, 'balanceOf', account],
    [DBR, 'allowance', account],
    [DBR, 'debts', account],
    [DBR, 'dueTokensAccrued', account],
    [DBR, 'signedBalanceOf', account],
    // [DBR, 'lastUpdated', account],
  ]);

  const [balance, allowance, debt, interests, signedBalance] = data || [zero, zero, zero, zero, zero];

  return {
    balance: getBnToNumber(balance),
    allowance: getBnToNumber(allowance),
    debt: getBnToNumber(debt),
    interests: getBnToNumber(interests),
    signedBalance: getBnToNumber(signedBalance),
    isLoading: !error && !data,
    isError: error,
  }
}