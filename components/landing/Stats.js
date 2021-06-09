import { Flex, Stack, Text } from '@chakra-ui/react'

const INVERSE_STATS = [
  {
    value: '$7,654',
    label: '$INV Price',
  },
  {
    value: '15,000',
    label: 'Token Holders',
  },
  {
    value: '130,434',
    label: 'Votes',
  },
  {
    value: '65%',
    label: 'xINV Staked',
  },
  {
    value: '$2,032,349,585',
    label: 'Total Value Locked (TVL)',
  },
]

const Stat = ({ stat }) => (
  <Stack color="white" align="center">
    <Text fontSize="4xl" fontWeight="bold" lineHeight={1}>
      {stat.value}
    </Text>
    <Text>{stat.label}</Text>
  </Stack>
)

export const Stats = () => (
  <Flex width="full" justify="space-around" p={16}>
    {INVERSE_STATS.map((stat) => (
      <Stat stat={stat} />
    ))}
  </Flex>
)

export default Stats
