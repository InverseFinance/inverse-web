import { Flex, Stack, Text } from '@chakra-ui/react'

type Stat = {
  value: string
  label: string
}

const INVERSE_STATS: Stat[] = [
  {
    value: '$2.03b',
    label: 'TVL',
  },
  {
    value: '$7,654',
    label: '$INV Price',
  },
  {
    value: '15k+',
    label: 'DAO Members',
  },
  {
    value: '130k+',
    label: 'Votes Casted',
  },
  {
    value: '65%',
    label: 'xINV Staked',
  },
]

const StatDisplay = ({ stat }: { stat: Stat }) => (
  <Stack align="center" p={8} m={4} w={60} borderRadius={8} bgColor="purple.800">
    <Text fontSize="4xl" fontWeight="bold" lineHeight={1}>
      {stat.value}
    </Text>
    <Text>{stat.label}</Text>
  </Stack>
)

export const Stats = () => (
  <Flex w="full" direction="column" align="center" pb={16} pl={8} pr={8} maxW="120rem">
    <Stack direction="row" spacing={0} w="full" justify="space-around" wrap="wrap" shouldWrapChildren>
      {INVERSE_STATS.map((stat) => (
        <StatDisplay stat={stat} />
      ))}
    </Stack>
    <Text w="full" fontSize="4xl" fontWeight="semibold" textAlign="center" mt={24}>
      Innovative products bringing unconventional solutions to difficult problems
    </Text>
  </Flex>
)

export default Stats
