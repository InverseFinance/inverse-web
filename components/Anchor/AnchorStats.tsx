import { Flex, Stack, Text } from '@chakra-ui/react'
import { AnchorOperations } from '@inverse/components/Anchor/AnchorModals'
import { useAccountLiquidity } from '@inverse/hooks/useAccountLiquidity'
import { useBorrowBalances, useSupplyBalances } from '@inverse/hooks/useBalances'
import { useExchangeRates } from '@inverse/hooks/useExchangeRates'
import { useAnchorPrices, usePrices } from '@inverse/hooks/usePrices'
import { Market } from '@inverse/types'
import { BigNumber } from 'ethers'
import { formatUnits } from 'ethers/lib/utils'

type Stat = {
  label: string
  value: string
}

type StatBlockProps = {
  label: string
  stats: Stat[]
}

type AnchorStatBlockProps = {
  asset: Market
  amount?: number
}

type AnchorStatsProps = {
  asset: Market
  amount: string
  operation: AnchorOperations
}

const StatBlock = ({ label, stats }: StatBlockProps) => (
  <Stack w="full" pt={2} spacing={1}>
    <Text fontSize="xs" fontWeight="semibold" color="purple.100" textTransform="uppercase">
      {label}
    </Text>
    {stats.map(({ label, value }) => (
      <Flex key={label} justify="space-between" fontSize="sm" fontWeight="medium" pl={2}>
        <Text>{label}</Text>
        <Text textAlign="end">{value}</Text>
      </Flex>
    ))}
  </Stack>
)

const SupplyDetails = ({ asset }: AnchorStatBlockProps) => {
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
          value: `${Math.floor(supplyBalance * 1e8) / 1e8} ${asset.underlying.symbol}`,
        },
      ]}
    />
  )
}

const MarketDetails = ({ asset }: AnchorStatBlockProps) => {

  return (
    <StatBlock
      label="Market Stats"
      stats={[
        {
          label: 'Collateral Factor',
          value: `${asset.collateralFactor*100}%`,
        }
      ]}
    />
  )
}

const BorrowDetails = ({ asset }: AnchorStatBlockProps) => {
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

const BorrowLimit = ({ asset, amount }: AnchorStatBlockProps) => {
  const { prices } = useAnchorPrices()
  const { usdBorrow, usdBorrowable } = useAccountLiquidity()

  const change =
    prices && amount
      ? asset.collateralFactor *
        amount *
        parseFloat(formatUnits(prices[asset.token], BigNumber.from(36).sub(asset.underlying.decimals)))
      : 0
  const borrowable = usdBorrow + usdBorrowable
  const newBorrowable = borrowable + change

  return (
    <StatBlock
      label="Borrow Limit Stats"
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

const BorrowLimitRemaining = ({ asset, amount }: AnchorStatBlockProps) => {
  const { prices } = useAnchorPrices()
  const { usdBorrow, usdBorrowable } = useAccountLiquidity()
  const change =
    prices && amount
      ? amount * parseFloat(formatUnits(prices[asset.token], BigNumber.from(36).sub(asset.underlying.decimals)))
      : 0
  const borrow = usdBorrow
  const newBorrow = borrow - (change > 0 ? change : 0)
  const borrowable = usdBorrow + usdBorrowable
  const newBorrowable = borrowable + (change < 0 ? change : 0)

  return (
    <StatBlock
      label="Borrow Limit Stats"
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

export const AnchorStats = ({ operation, asset, amount }: AnchorStatsProps) => {
  const parsedAmount = amount && !isNaN(amount as any) ? parseFloat(amount) : 0
  switch (operation) {
    case AnchorOperations.supply:
      return (
        <>
          <SupplyDetails asset={asset} />
          <BorrowLimit asset={asset} amount={parsedAmount} />
          <MarketDetails asset={asset} />
        </>
      )
    case AnchorOperations.withdraw:
      return (
        <>
          <SupplyDetails asset={asset} />
          <BorrowLimit asset={asset} amount={-1 * parsedAmount} />
          <MarketDetails asset={asset} />
        </>
      )
    case AnchorOperations.borrow:
      return (
        <>
          <BorrowDetails asset={asset} />
          <BorrowLimitRemaining asset={asset} amount={-1 * parsedAmount} />
        </>
      )
    case AnchorOperations.repay:
      return (
        <>
          <BorrowDetails asset={asset} />
          <BorrowLimitRemaining asset={asset} amount={parsedAmount} />
        </>
      )
  }

  return <></>
}
