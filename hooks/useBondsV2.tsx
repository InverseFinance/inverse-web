
import useEtherSWR from '@app/hooks/useEtherSWR'
import { BondV2, SWR, UserBondV2 } from '@app/types'
import { getBnToNumber } from '@app/util/markets';

import { getToken, REWARD_TOKEN, TOKENS } from '@app/variables/tokens'
import { useLpPrices, usePrices } from '@app/hooks/usePrices';
import { formatUnits, parseUnits } from 'ethers/lib/utils';
import { useCustomSWR } from './useCustomSWR';
import { fetcher } from '@app/util/web3';
import { useContractEvents, useMultiContractEvents } from './useContractEvents';
import { BOND_V2_FIXED_TELLER_ABI } from '@app/config/abis';
import { BOND_V2_FIXED_TERM_TELLER } from '@app/variables/bonds';
import { useBlocksTimestamps } from './useBlockTimestamp';

export const useBondsV2Api = (): SWR & { bonds: BondV2[], allMarketIds: string[] } => {
  const { data, error, isLoading } = useCustomSWR(`/api/bonds?`, fetcher);

  return {
    bonds: data ? data.bonds : [],
    allMarketIds: data ? data.allMarketIds : [],
    isError: !!error,
    isLoading,
  }
}

export const useBondsV2 = (): SWR & { bonds: BondV2[], allMarketIds: string[] } => {
  const { prices: cgPrices } = usePrices();
  const { bonds: activeBonds, allMarketIds } = useBondsV2Api();

  const lpInputs = activeBonds.filter(b => !b.inputPrice).map(b => b.underlying)
  const { data: lpInputPrices } = useLpPrices(lpInputs, activeBonds.map(b => '1'));

  const { data: bondPrices, error: bondPricesError } = useEtherSWR([
    ...activeBonds.map(bond => {
      return [bond.bondContract, 'marketPrice', bond.id]
    }),
  ]);

  const { data: tellers, error: tellersError } = useEtherSWR([
    ...activeBonds.map(bond => {
      return [bond.bondContract, 'getTeller']
    }),
  ]);

  const { data: marketInfos, error: marketInfosError } = useEtherSWR([
    ...activeBonds.map(bond => {
      return [bond.bondContract, 'markets', bond.id]
    }),
  ]);

  const { data: bondTerms, error: bondTermsError } = useEtherSWR([
    ...activeBonds.map(bond => {
      return [bond.bondContract, 'terms', bond.id]
    }),
  ]);

  const error = bondPricesError || bondTermsError;

  const prices = (bondPrices);

  // const invOraclePrice = oraclePrices && oraclePrices[XINV];
  const invCgPrice = cgPrices && cgPrices['inverse-finance']?.usd;
  // const invCgPrice = cgPrices && cgPrices[RTOKEN_CG_ID]?.usd;

  // the ROI calculation makes more sense with cg price
  const marketPrice = invCgPrice;

  const inputPrices = activeBonds.map((bond, i) => {
    if(bond.underlying.symbol === 'DOLA') return 1;
    else if(bond.underlying.coingeckoId) return cgPrices[bond.underlying.coingeckoId]?.usd;
    return (lpInputPrices && lpInputPrices[lpInputs.map(lp => lp.symbol).indexOf(bond.underlying.symbol)]) || 0;
  })

  const now = Date.now();

  const bonds = activeBonds.map((bond, i) => {
    const bondPrice = !!prices && !!prices[i] ? getBnToNumber(prices[i], 36) : activeBonds[i].bondPrice
    const conclusion = bondTerms ? parseFloat(bondTerms[i][3].toString()) * 1000 : activeBonds[i].conclusion;
    const capacity = marketInfos ? getBnToNumber(marketInfos[i][5], REWARD_TOKEN?.decimals) : activeBonds[i].capacity;
    return {
      ...bond,
      marketPrice,
      roi: bondPrice ? (marketPrice / bondPrice - 1) * 100 : 0,
      bondPrice,
      inputUsdPrice: inputPrices[i],
      positiveRoi: bondPrice && marketPrice > bondPrice,
      vestingDays: bondTerms ? Math.round(parseFloat(bondTerms[i][2].toString()) / 86400) : activeBonds[i].vestingDays,
      conclusion,
      isNotConcluded: now < conclusion,
      isPurchasable: now < conclusion && capacity > 0,
      maxPayout: marketInfos ? getBnToNumber(marketInfos[i][8], REWARD_TOKEN?.decimals) : activeBonds[i].maxPayout,
      capacity,
      teller: tellers ? tellers[i] : activeBonds[i].teller,
    }
  });

  return {
    bonds,
    allMarketIds,
    isError: error,
  }
}

export const useBondV2PayoutFor = (bondContract: string, id: string, inputDecimals: number, amount: string, outputDecimals: number, referrer = ''): { payout: string } => {
  const inputAmount = amount ? parseUnits(amount, inputDecimals) : '0';

  const { data, error } = useEtherSWR([
    bondContract, 'payoutFor', inputAmount.toString(), id, referrer || bondContract
  ]);

  // handle abi variant
  const result = data && data.length === 2 ? data[0] : data

  return {
    payout: result ? formatUnits(result, outputDecimals) : '0',
  }
}

export const useAccountBondPurchases = (
  account: string,
  allMarketIds: string[],
): SWR & {
  userBonds: UserBondV2[]
} => {
  const { events: transferSingleEvents } = useContractEvents(
    BOND_V2_FIXED_TERM_TELLER,
    BOND_V2_FIXED_TELLER_ABI,
    'TransferSingle',
    [undefined, undefined, account],
  );

  const eventsToQuery = allMarketIds.map(bondId => {
    return [
      BOND_V2_FIXED_TERM_TELLER,
      BOND_V2_FIXED_TELLER_ABI,
      'Bonded',
      [parseInt(bondId)],
    ];
  });

  const { groupedEvents, error } = useMultiContractEvents(eventsToQuery, `multi-bond-query-${account}-${allMarketIds.join('-')}`);
  const bonded = groupedEvents.flat();

  const { timestamps } = useBlocksTimestamps(transferSingleEvents.map(e => e.blockNumber));

  const purchaseIds: string[] = [];
  transferSingleEvents.forEach(e => {
    const id = e.args.id.toString();
    if(!purchaseIds.includes(id)){
      purchaseIds.push(id);
    }
  });

  const { data: metadatas } = useEtherSWR({
    args: [
      ...purchaseIds.map(id => [BOND_V2_FIXED_TERM_TELLER, 'tokenMetadata', id])
    ],
    abi: BOND_V2_FIXED_TELLER_ABI,
  })

  const { data: tokenNames } = useEtherSWR({
    args: [
      ...purchaseIds.map(id => [BOND_V2_FIXED_TERM_TELLER, 'getTokenNameAndSymbol', id])
    ],
    abi: BOND_V2_FIXED_TELLER_ABI,
  })  

  const now = Date.now();

  const bondEvents = transferSingleEvents?.map((e, i) => {
    const id = e.args.id.toString();
    const index = purchaseIds.indexOf(id)
    const metadata = metadatas ? metadatas[index] : undefined;
    const purchaseDate = timestamps ? timestamps[i] : 0;
    const expiry = metadata ? metadata[3] * 1000 : 0;
    const bondedEvent = bonded?.find(be => be.transactionHash === e.transactionHash);    
    return {
      txHash: e.transactionHash,
      blocknumber: e.blockNumber,
      marketId: bondedEvent ? getBnToNumber(bondedEvent.args.id, 0) : 0,
      bondedEvent,
      amount: bondedEvent ? getBnToNumber(bondedEvent.args.amount) : 0,
      payout: getBnToNumber(e.args.amount),
      id,
      name: tokenNames ? tokenNames[index][0].replace(/inverse dao/i, 'INV') : '',
      active: metadata ? metadata[0] : 0,
      output: metadata ? metadata[1] : '',
      expiry: expiry,
      supply: metadata ? getBnToNumber(metadata[4]) : 0,
      underlying: metadata ? getToken(TOKENS, metadata[1]) : {},
      purchaseDate,
      vestingDays: Math.ceil(((expiry - purchaseDate) / 84000000) - 0.5),
      percentVestedFor: Math.min((Math.max(now - purchaseDate, 0)) / (expiry - purchaseDate) * 100, 100),
    }
  });
  

  const userBonds = purchaseIds.map(id => {
    const common = bondEvents.find(e => e.id === id);
    const grouped = bondEvents.filter(e => e.id === id).reduce((prev, curr) => {
      return {
        ...common,
        expiry: curr.expiry,
        vestingDays: curr.vestingDays,
        amount: prev.amount + curr.amount,
        payout: prev.payout + curr.payout,
        purchaseDate: Math.min(prev.purchaseDate, curr.purchaseDate),
        percentVestedFor: Math.max(prev.percentVestedFor, curr.percentVestedFor),
      }
    }, {
      underlying: {},
      amount: 0,
      payout: 0,
      vestingDays: 0,
      purchaseDate: Infinity,
      percentVestedFor: 0,
    });
    return grouped;
  })
  .filter(ub => ub.output.toLowerCase() === REWARD_TOKEN.address.toLowerCase());  
  return {
    userBonds,
    bondEvents,
  }
}

export const useAccountBonds = (
  account: string,  
  allMarketIds: string[],  
): SWR & {
  userBonds: UserBondV2[]
} => {
  return useAccountBondPurchases(account, allMarketIds) 
}