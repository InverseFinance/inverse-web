import { Flex, Stack, Text } from '@chakra-ui/react'
import { useAccountLiquidity } from '@inverse/hooks/useAccountLiquidity'
import { useBorrowBalances, useSupplyBalances } from '@inverse/hooks/useBalances'
import { useExchangeRates } from '@inverse/hooks/useExchangeRates'
import { useAnchorPrices } from '@inverse/hooks/usePrices'
import { Market, AnchorOperations, BigNumberList } from '@inverse/types'
import { BigNumber } from 'ethers'
import { formatUnits } from 'ethers/lib/utils'
import { shortenNumber } from '@inverse/util/markets';
import { AnimatedInfoTooltip } from '@inverse/components/common/Tooltip'

type Stat = {
  label: string
  value: React.ReactNode
  color?: string
  tooltipMsg?: string
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
    <Text fontSize="xs" fontWeight="semibold" color="purple.300" textTransform="uppercase">
      {label}
    </Text>
    {stats.map(({ label, value, color, tooltipMsg }) => (
      <Flex key={label} justify="space-between" fontSize="sm" fontWeight="medium" pl={2}>
        <Text color={color}>
          {label}
          {tooltipMsg && <AnimatedInfoTooltip iconProps={{ ml: '2', fontSize: '12px' }} message={tooltipMsg} />}
        </Text>
        <Text color={color} textAlign="end">{value}</Text>
      </Flex>
    ))}
  </Stack>
)

const getCollateralFactor = (market: Market): Stat => {
  return {
    label: 'Collateral Factor',
    value: `${market.collateralFactor * 100}%`,
    tooltipMsg: "Defines the max worth in USD you can borrow against your supplied collateral USD worth, if this max amount is reached then liquidation can be triggered. The Max Borrowable Limit Amount in USD = Collateral Factor X Collateral Worth in USD, this fluctuates with the assets prices."
  }
}

const getBorrowLimitUsed = (perc: number, before: string, after: string): Stat => {
  return {
    label: 'Borrow Limit Used',
    value: `${before}% -> ${after}%`,
    color: (perc > 75 ? 'red.500' : perc <= 75 && perc > 50 ? 'orange.500' : 'white'),
    tooltipMsg: "Reminder: if the Borrow Limit % reaches 100% you may get liquidated or won't receive the loan to avoid liquidation"
  }
}

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
          value: `${shortenNumber(Math.floor(supplyBalance * 1e8) / 1e8)} ${asset.underlying.symbol}`,
        },
      ]}
    />
  )
}

const WithdrawDetails = ({ asset }: AnchorStatBlockProps) => {
  return (
    <StatBlock
      label="Withdrawal Stats"
      stats={[
        {
          label: 'Available Liquidity',
          value: `${shortenNumber(asset.liquidity, 2)} ${asset.underlying.symbol}`,
        },
      ]}
    />
  )
}

const formatUsdTotal = (value: number, prices: BigNumberList, asset: Market) => {
  return prices && value
    ? `${shortenNumber(
      (
        value *
        parseFloat(formatUnits(prices[asset.token], BigNumber.from(36).sub(asset.underlying.decimals)))
      ), 2, true
    )}`
    : '-'
}

const MarketDetails = ({ asset }: AnchorStatBlockProps) => {
  const { prices } = useAnchorPrices()
  const totalBorrowsUsd = formatUsdTotal(asset.totalBorrows, prices, asset);
  const totalReservesUsd = formatUsdTotal(asset.totalReserves, prices, asset);
  const totalSuppliedUsd = formatUsdTotal(asset.supplied, prices, asset);
  const reserveFactor = asset.reserveFactor ? `${asset.reserveFactor * 100}%` : '-'

  return (
    <StatBlock
      label="Market Stats"
      stats={[
        getCollateralFactor(asset),
        {
          label: 'Reserve Factor',
          value: reserveFactor,
        },
        {
          label: 'Total Supplied',
          value: totalSuppliedUsd,
        },
        {
          label: 'Total Borrows',
          value: totalBorrowsUsd,
        },
        {
          label: 'Total Reserves',
          value: totalReservesUsd,
        },
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
          label: 'Borrow APR',
          value: `${asset.borrowApy.toFixed(2)}%`,
        },
        {
          label: 'Borrow Balance',
          value: `${borrowBalance.toFixed(2)} ${asset.underlying.symbol}`,
        },
        {
          label: 'Available Liquidity',
          value: `${shortenNumber(asset.liquidity, 2)} ${asset.underlying.symbol}`,
        },
      ]}
    />
  )
}

const getBorrowLimitLabel = (newBorrowLimit: number, isReduceLimitCase = false) => {
  const newBorrowLimitLabel = newBorrowLimit > 100 || (newBorrowLimit < 0 && !isReduceLimitCase) ?
    '+100' :
    (newBorrowLimit < 0 && isReduceLimitCase) ?
      '0' : newBorrowLimit.toFixed(2)
  return newBorrowLimitLabel;
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

  const newBorrowLimit = (newBorrowable !== 0
    ? (usdBorrow / newBorrowable) * 100
    : 0
  )
  const newBorrowLimitLabel = getBorrowLimitLabel(newBorrowLimit, (amount || 0) > 0)
  const cleanPerc = Number(newBorrowLimitLabel.replace(/'+'/, ''))

  const before = (borrowable !== 0 ? (usdBorrow / borrowable) * 100 : 0).toFixed(2)

  const stats = [
    getCollateralFactor(asset),
    {
      label: 'Borrow Limit',
      value: `${shortenNumber(borrowable, 2, true)} -> ${shortenNumber(newBorrowable, 2, true)}`,
    },
    getBorrowLimitUsed(cleanPerc, before , newBorrowLimitLabel),
  ]

  if (cleanPerc > 75) {
    stats.push({ label: 'Reminder:', value: 'Risk of liquidation if Borrow Limit reaches 100%', color: 'red.500' })
  }

  return (
    <StatBlock
      label="Borrow Limit Stats"
      stats={stats}
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

  const newBorrowLimit = (newBorrowable !== 0
    ? (newBorrow / newBorrowable) * 100
    : 0
  )
  const newBorrowLimitLabel = getBorrowLimitLabel(newBorrowLimit, (amount || 0) > 0)
  const cleanPerc = Number(newBorrowLimitLabel.replace(/'+'/, ''))
  const before = (borrowable !== 0 ? (borrow / borrowable) * 100 : 0).toFixed(2)

  const stats = [
    getCollateralFactor(asset),
    {
      label: 'Borrow Limit Remaining',
      value: `${shortenNumber(usdBorrowable, 2, true)} -> ${shortenNumber(usdBorrowable + change, 2, true)}`,
    },
    getBorrowLimitUsed(cleanPerc, before , newBorrowLimitLabel),
  ]

  if (cleanPerc > 75) {
    stats.push({ label: 'Reminder:', value: 'Risk of liquidation if Borrow Limit reaches 100%', color: 'red.500' })
  }

  return (
    <StatBlock
      label="Borrow Limit Stats"
      stats={stats}
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
          {asset.underlying.symbol !== 'INV' && <WithdrawDetails asset={asset} />}
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
