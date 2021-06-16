import { Flex, Stack, Text } from '@chakra-ui/react'
import { useEffect, useState } from 'react'

type Stat = {
  value: number
  label: string
  showDollar?: boolean
  showPercentage?: boolean
}

const formatStat = ({ value, showDollar, showPercentage }: Stat): string => {
  if (showPercentage) {
    return `${(value * 100).toFixed(0)}%`
  }

  let display = value.toLocaleString()
  if (value >= Math.pow(10, 9)) {
    display = `${(value / Math.pow(10, 9)).toFixed(2)}b`
  } else if (value >= Math.pow(10, 6)) {
    display = `${(value / Math.pow(10, 6)).toFixed(2)}m`
  } else if (value >= Math.pow(10, 4)) {
    display = `${(value / Math.pow(10, 3)).toFixed(0)}k`
  }

  return `${showDollar ? '$' : ''}${display}`
}

const StatDisplay = ({ stat }: { stat: Stat }) => (
  <Stack align="center" p={8} m={4} w={60} borderRadius={8} bgColor="purple.800">
    <Text fontSize="4xl" fontWeight="bold" lineHeight={1}>
      {formatStat(stat)}
    </Text>
    <Text>{stat.label}</Text>
  </Stack>
)

export const Stats = () => {
  const [stats, setStats] = useState<Stat[]>([])

  useEffect(() => {
    const init = async () => {
      const [_balances, _markets, _proposals, _price] = await Promise.all([
        fetch(`${process.env.API_URL}/inverse/tvl`),
        fetch(`${process.env.API_URL}/anchor/markets`),
        fetch(`${process.env.API_URL}/inverse/proposals`),
        fetch(`${process.env.COINGECKO_PRICE_API}?vs_currencies=usd&ids=inverse-finance`),
      ])

      const [balances, markets, proposals, price] = await Promise.all([
        _balances.json(),
        _markets.json(),
        _proposals.json(),
        _price.json(),
      ])
      setStats([
        {
          label: 'TVL',
          value: balances.tvl,
          showDollar: true,
        },
        {
          label: '$INV Price',
          value: price['inverse-finance'].usd,
          showDollar: true,
        },
        {
          label: 'Markets',
          value: markets.markets.length,
        },
        {
          label: 'Passed Proposals',
          value: proposals.passed,
        },
        {
          label: 'Votes Casted',
          value: proposals.forVotes,
        },
      ])
    }

    init()
  }, [])

  return (
    <Flex w="full" direction="column" align="center" pb={16} pl={8} pr={8} maxW="120rem">
      <Stack direction="row" spacing={0} w="full" justify="space-around" wrap="wrap" shouldWrapChildren>
        {stats.map((stat) => (
          <StatDisplay stat={stat} />
        ))}
      </Stack>
      <Text w="full" fontSize="4xl" fontWeight="semibold" textAlign="center" mt={24}>
        Innovative products bringing unconventional solutions to difficult problems
      </Text>
    </Flex>
  )
}

export default Stats
