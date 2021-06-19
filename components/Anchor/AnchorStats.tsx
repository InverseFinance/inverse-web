import { Flex, Stack, Text } from '@chakra-ui/react'
import { formatUnits } from 'ethers/lib/utils'
import { usePrices } from '@inverse/hooks/usePrices'
import { useBorrowBalances, useSupplyBalances } from '@inverse/hooks/useBalances'
import { useAccountLiquidity, useExchangeRates } from '@inverse/hooks/useAccountLiquidity'
import { AnchorOperations } from './AnchorModals'

const StatBlock = ({ label, stats }: any) => (
  <Stack w="full" p={4} pt={2} spacing={1}>
    <Text fontSize="xs" fontWeight="semibold" color="purple.100" textTransform="uppercase">
      {label}
    </Text>
    {stats.map(({ label, value }: any) => (
      <Flex key={label} justify="space-between" fontSize="sm" fontWeight="medium" pl={2}>
        <Text>{label}</Text>
        <Text textAlign="end">{value}</Text>
      </Flex>
    ))}
  </Stack>
)

const SupplyDetails = ({ asset }: any) => {
  const { balances: supplyBalances } = useSupplyBalances()
  const { exchangeRates } = useExchangeRates()

  const supplyBalance =
    supplyBalances && exchangeRates
      ? parseFloat(formatUnits(supplyBalances[asset.token], asset.underlying.decimals)) *
        parseFloat(formatUnits(exchangeRates[asset.token]))
      : 0

  return (
    <StatBlock
      label="Supply Stats"
      stats={[
        {
          label: 'Supply APY',
          value: `${asset.supplyApy.toFixed(2)}%`,
        },
        {
          label: 'Supply Balance',
          value: `${supplyBalance.toFixed(2)} ${asset.underlying.symbol}`,
        },
      ]}
    />
  )
}

const BorrowDetails = ({ asset }: any) => {
  const { balances: borrowBalances } = useBorrowBalances()

  const borrowBalance =
    borrowBalances && borrowBalances[asset.token]
      ? parseFloat(formatUnits(borrowBalances[asset.token], asset.underlying.decimals))
      : 0

  return (
    <StatBlock
      label="Borrow Stats"
      stats={[
        {
          label: 'Borrow APY',
          value: `${asset.borrowApy.toFixed(2)}%`,
        },
        {
          label: 'Borrow Balance',
          value: `${borrowBalance.toFixed(2)} ${asset.underlying.symbol}`,
        },
      ]}
    />
  )
}

const BorrowLimit = ({ asset, amount }: any) => {
  const { prices } = usePrices()
  const { usdBorrow, usdBorrowable } = useAccountLiquidity()

  const change = prices ? asset.collateralFactor * amount * prices[asset.underlying.coingeckoId].usd : 0
  const borrowable = usdBorrow + usdBorrowable
  const newBorrowable = borrowable + change

  return (
    <StatBlock
      label="Borrow Limit"
      stats={[
        {
          label: 'Borrow Limit',
          value: `$${borrowable.toFixed(2)} -> $${newBorrowable.toFixed(2)}`,
        },
        {
          label: 'Borrow Limit Used',
          value: `${(borrowable !== 0 ? (usdBorrow / borrowable) * 100 : 0).toFixed(2)}% -> ${(newBorrowable !== 0
            ? (usdBorrow / newBorrowable) * 100
            : 0
          ).toFixed(2)}%`,
        },
      ]}
    />
  )
}

const BorrowLimitRemaining = ({ asset, amount }: any) => {
  const { prices } = usePrices()
  const { usdBorrow, usdBorrowable } = useAccountLiquidity()

  const change = prices ? amount * prices[asset.underlying.coingeckoId].usd : 0
  const borrow = usdBorrow
  const newBorrow = borrow - (amount > 0 ? change : 0)
  const borrowable = usdBorrow + usdBorrowable
  const newBorrowable = borrowable + (amount < 0 ? change : 0)

  return (
    <StatBlock
      label="Borrow Limit"
      stats={[
        {
          label: 'Borrow Limit Remaining',
          value: `$${usdBorrowable.toFixed(2)} -> $${(usdBorrowable + change).toFixed(2)}`,
        },
        {
          label: 'Borrow Limit Used',
          value: `${(borrowable !== 0 ? (borrow / borrowable) * 100 : 0).toFixed(2)}% -> ${(newBorrowable !== 0
            ? (newBorrow / newBorrowable) * 100
            : 0
          ).toFixed(2)}%`,
        },
      ]}
    />
  )
}

export const AnchorStats = ({ operation, asset, amount }: any) => {
  switch (operation) {
    case AnchorOperations.supply:
      return (
        <>
          <SupplyDetails asset={asset} />
          <BorrowLimit asset={asset} amount={amount && !isNaN(amount) ? parseFloat(amount) : 0} />
        </>
      )
    case AnchorOperations.withdraw:
      return (
        <>
          <SupplyDetails asset={asset} />
          <BorrowLimit asset={asset} amount={amount && !isNaN(amount) ? -1 * parseFloat(amount) : 0} />
        </>
      )
    case AnchorOperations.borrow:
      return (
        <>
          <BorrowDetails asset={asset} />
          <BorrowLimitRemaining asset={asset} amount={amount && !isNaN(amount) ? -1 * parseFloat(amount) : 0} />
        </>
      )
    case AnchorOperations.repay:
      return (
        <>
          <BorrowDetails asset={asset} />
          <BorrowLimitRemaining asset={asset} amount={amount && !isNaN(amount) ? parseFloat(amount) : 0} />
        </>
      )
  }

  return <></>
}
