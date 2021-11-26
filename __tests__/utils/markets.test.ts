/**
 * @jest-environment jsdom
 */

import { parseUnits } from '@ethersproject/units';
import { Market } from '@inverse/types';
import { getMonthlyRate, getMonthlyUsdRate, getTotalInterests } from '@inverse/util/markets';
import { getBalanceInInv } from '@inverse/util/markets';

describe('Markets utils', () => {
  it('correctly gets monthly rates', () => {
    expect(getMonthlyRate(120, 10)).toBe(1)
    expect(getMonthlyUsdRate(120, 10, 5)).toBe(5)
  })

  it('correctly converts rewards to INV balance', () => {
    const balances = { 'token': parseUnits('0.000005') }
    const exRates = { 'token': parseUnits('1000000'), 'xinv': parseUnits('1.1') }
    const balanceInInv = getBalanceInInv(balances, 'token', exRates, 'xinv', 8, 18);
    expect(balanceInInv).toBe(44)
  })

  describe('correctly calculate monthly interests', () => {
    const exRates = {
      'dola': parseUnits('207559356'),
      'eth': parseUnits('201342936'),
      'xinv': parseUnits('1.1'),
    }
    const markets: Partial<Market>[] = [
      { token: 'dola', underlying: { decimals: 18 }, supplyApy: 10, borrowApy: 25, rewardApy: 0, priceUsd: 1, priceXinv: 0.0022 },
      { token: 'eth', underlying: { decimals: 18 }, supplyApy: 1, borrowApy: 2, rewardApy: 6, priceUsd: 4060, priceXinv: 9.07 },
    ];

    it('should have zero if zero supplied and zero borrowed', () => {
      const supplied = {  }
      const borrowed = {  }
      // @ts-ignore
      const interests = getTotalInterests(markets, supplied, borrowed, exRates, 'xinv');
      expect(interests.total).toBe(0)
    })

    it('should have negative interests if only borrowing', () => {
      const supplied = { }
      const borrowed = { 'eth': parseUnits('10') }
      // @ts-ignore
      const interests = getTotalInterests(markets, supplied, borrowed, exRates, 'xinv');
      expect(interests.total).toBeNegative()
    })

    it('should have positive interests if supplying', () => {
      const supplied = { 'eth': parseUnits('10') }
      const borrowed = { }
      // @ts-ignore
      const interests = getTotalInterests(markets, supplied, borrowed, exRates, 'xinv');
      expect(interests.total).toBePositive()
    })

    it('should have correct interests for supplying', () => {
      const supplied = { 'dola': parseUnits('0.000004818') }// around 1000 dola
      const borrowed = { }
      // @ts-ignore
      const interests = getTotalInterests(markets, supplied, borrowed, exRates, 'xinv');
      expect(interests.total.toFixed(4)).toBe('8.3335')
      expect(interests.supplyUsdInterests.toFixed(4)).toBe('8.3335')
      expect(interests.borrowInterests).toBe(0)
      expect(interests.invUsdInterests).toBe(0)
    })
  })
})
