/**
 * @jest-environment jsdom
 */

import { parseUnits } from '@ethersproject/units';
import { Market } from '@inverse/types';
import { getMonthlyRate, getMonthlyUsdRate, getTotalInterests } from '@inverse/util/markets';
import { getBalanceInInv } from '@inverse/util/markets';
import { BigNumber } from 'ethers';
import { formatUnits } from 'ethers/lib/utils';

describe('Markets utils', () => {
  it('correctly gets monthly rates', () => {
    expect(getMonthlyRate(120, 10)).toBe(1)
    expect(getMonthlyUsdRate(120, 10, 5)).toBe(5)
  })

  it('correctly converts rewards to INV balance', () => {
    const balances = { 'token': parseUnits('0.000005') }
    const exRates = { 'token': parseUnits('1000000'), 'xinv': parseUnits('1.1') }
    const balanceInInv = getBalanceInInv(balances, 'token', exRates, 10, 1000, 18);
    expect(balanceInInv).toBe(0.05)
  })

  describe('correctly calculate monthly interests', () => {
    // exRates corresponding to specific market prices => dont change exRates & prices
    const exRates = {
      'dola': parseUnits('207559356'),
      'eth': parseUnits('201342936'),
      'xinv': parseUnits('1.1'),
    }

    const dolaMarket: Partial<Market> = { token: 'dola', underlying: { decimals: 18 }, supplyApy: 10, borrowApy: 25, rewardApy: 0, priceUsd: 1, priceXinv: 0.0022 };
    const ethMarket: Partial<Market> = { token: 'eth', underlying: { decimals: 18 }, supplyApy: 1, borrowApy: 2, rewardApy: 6, priceUsd: 4060, priceXinv: 9.07 };

    const markets: Partial<Market>[] = [
      dolaMarket,
      ethMarket,
    ];

    const getAnBalance = (balance: number, exRate: BigNumber) => {
      return parseUnits((balance / parseFloat(formatUnits(exRate))).toFixed(18))
    }

    it('should have zero if zero supplied and zero borrowed', () => {
      const anTokenBalances = {  }
      const borrowed = {  }
      // @ts-ignore
      const interests = getTotalInterests(markets, anTokenBalances, borrowed, exRates, 'xinv');
      expect(interests.total).toBe(0)
    })

    it('should have negative interests if only borrowing', () => {
      const anTokenBalances = { }
      const borrowed = { 'eth': parseUnits('10') }
      // @ts-ignore
      const interests = getTotalInterests(markets, anTokenBalances, borrowed, exRates, 'xinv');
      expect(interests.total).toBeNegative()
    })

    it('should have positive interests if supplying', () => {
      const anTokenBalances = { 'eth': parseUnits('10') }
      const borrowed = { }
      // @ts-ignore
      const interests = getTotalInterests(markets, anTokenBalances, borrowed, exRates, 'xinv');
      expect(interests.total).toBePositive()
    })

    it('should have negative interests if suppling and borrowing same amount of dola', () => {
      // supply balances are anToken version
      const anTokenBalances = { 'dola': getAnBalance(1000, exRates['dola']) }// worth 1000 dola
      const borrowed = { 'dola': parseUnits('1000') }
      // @ts-ignore
      const interests = getTotalInterests(markets, anTokenBalances, borrowed, exRates, 'xinv');
      expect(interests.total).toBeNegative()
      expect(interests.supplyUsdInterests.toFixed(2)).toBe('8.33')
      expect(interests.borrowInterests.toFixed(2)).toBe('-20.83')
      expect(interests.invUsdInterests).toBe(0)
      expect(interests.total.toFixed(2)).toBe('-12.50')
    })

    it('should have correct supply, borrow, inv and total usd interests', () => {
      const ethSupplied = 1;
      const dolaBorrowed = 1000;
      // supply balances are anToken version
      const anTokenBalances = { 'eth': getAnBalance(ethSupplied, exRates['eth']) }
      const borrowed = { 'dola': parseUnits(dolaBorrowed.toString()) }
      // @ts-ignore
      const interests = getTotalInterests(markets, anTokenBalances, borrowed, exRates, 'xinv');

      const expectedSupplyUsdInterests = (ethSupplied * ethMarket.priceUsd! * ethMarket.supplyApy! / 100 / 12)
      const expectedBorrowUsdInterests = -(dolaBorrowed * dolaMarket.priceUsd! * dolaMarket.borrowApy! / 100 / 12)
      const expectedRewardUsdInterests = (ethSupplied * ethMarket.priceUsd! * ethMarket.rewardApy! / 100 / 12)

      expect(interests.supplyUsdInterests.toFixed(2)).toBe(expectedSupplyUsdInterests.toFixed(2))
      expect(interests.borrowInterests.toFixed(2)).toBe(expectedBorrowUsdInterests.toFixed(2))
      expect(interests.invUsdInterests.toFixed(2)).toBe(expectedRewardUsdInterests.toFixed(2))
      expect(interests.total.toFixed(2)).toBe((expectedSupplyUsdInterests + expectedRewardUsdInterests + expectedBorrowUsdInterests).toFixed(2))
    })
  })
})
