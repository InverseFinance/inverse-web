import { Flex, Stack, Text } from '@chakra-ui/react'
import { useMarkets } from '@inverse/hooks/useMarkets'
import { usePrices } from '@inverse/hooks/usePrices'
import { useProposals } from '@inverse/hooks/useProposals'
import { useTVL } from '@inverse/hooks/useTVL'
import { Proposal } from '@inverse/types'

type Stat = {
  value: number
  label: string
  showDollar?: boolean
  showPercentage?: boolean
}

const formatStat = ({ value, showDollar, showPercentage }: Stat): string => {
  const _value = value || 0

  if (showPercentage) {
    return `${(_value * 100).toFixed(0)}%`
  }

  let display = _value.toLocaleString()
  if (_value >= Math.pow(10, 9)) {
    display = `${(_value / Math.pow(10, 9)).toFixed(2)}b`
  } else if (_value >= Math.pow(10, 6)) {
    display = `${(_value / Math.pow(10, 6)).toFixed(2)}m`
  } else if (_value >= Math.pow(10, 4)) {
    display = `${(_value / Math.pow(10, 3)).toFixed(0)}k`
  }

  return `${showDollar ? '$' : ''}${display}`
}

export const Stats = () => {
  const { proposals } = useProposals()
  const { markets } = useMarkets()
  const { prices } = usePrices()
  const { tvl } = useTVL()

  const stats = [
    {
      label: 'TVL',
      value: tvl,
      showDollar: true,
    },
    {
      label: '$INV Price',
      value: prices['inverse-finance'] ? prices['inverse-finance'].usd : 0,
      showDollar: true,
    },
    {
      label: 'Markets',
      value: markets.length,
    },
    {
      label: 'Passed Proposals',
      value: proposals.filter(({ forVotes, againstVotes }: Proposal) => forVotes > againstVotes).length,
    },
    {
      label: 'Votes Casted',
      value: proposals.reduce((prev: number, curr: Proposal) => prev + curr.forVotes + curr.againstVotes, 0),
    },
  ]

  return (
    <Flex w="full" direction="column" align="center" pb={16} pl={8} pr={8} maxW="120rem">
      <Stack direction="row" spacing={0} w="full" justify="space-around" wrap="wrap" shouldWrapChildren>
        {stats.map((stat) => (
          <Stack key={stat.label} align="center" p={8} m={4} w={60} borderRadius={8} bgColor="purple.800">
            <Text fontSize="4xl" fontWeight="bold" lineHeight={1}>
              {formatStat(stat)}
            </Text>
            <Text>{stat.label}</Text>
          </Stack>
        ))}
      </Stack>
      <Text w="full" fontSize="4xl" fontWeight="semibold" textAlign="center" mt={24}>
        Innovative products bringing unconventional solutions to difficult problems
      </Text>
    </Flex>
  )
}

export default Stats
