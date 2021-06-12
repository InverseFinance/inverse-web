import { Flex, Stack, Text } from '@chakra-ui/react'
import { Token, TOKENS } from '@inverse/constants'
import Logo from '../Logo'

type Column = {
  label: string
  width?: string | number
  justify?: string
  value: any
}

const Table = ({ columns }: { columns: Column[] }) => (
  <Stack w="full" spacing={4}>
    <Flex
      w="full"
      fontSize="11px"
      fontWeight="medium"
      color="purple.200"
      justify="space-between"
      textTransform="uppercase"
    >
      {columns.map(({ label, width, justify }: Column) => (
        <Flex key={label} width={width} justify={justify}>
          {label}
        </Flex>
      ))}
    </Flex>
    {Object.values(TOKENS).map((token) => (
      <Flex w="full" justify="space-between" fontWeight="semibold" fontSize="15px">
        {columns.map(({ label, width, justify, value }) => (
          <Flex key={label} width={width} justify={justify}>
            {value(token)}
          </Flex>
        ))}
      </Flex>
    ))}
  </Stack>
)

export const SupplyTable = () => {
  const columns = [
    {
      label: 'Asset',
      width: 1 / 3,
      value: ({ symbol }: Token) => (
        <Stack direction="row" align="center">
          <Logo boxSize={5} />
          <Text>{symbol}</Text>
        </Stack>
      ),
    },
    {
      label: 'APY',
      width: 1 / 3,
      justify: 'center',
      value: ({ symbol }: Token) => <Text>1.15%</Text>,
    },
    {
      label: 'Wallet',
      width: 1 / 3,
      justify: 'flex-end',
      value: ({ symbol }: Token) => <Text color="purple.200">{`0 ${symbol}`}</Text>,
    },
  ]

  return <Table columns={columns} />
}

export const BorrowTable = () => {
  const columns = [
    {
      label: 'Asset',
      width: 1 / 3,
      value: ({ symbol }: Token) => (
        <Stack direction="row" align="center">
          <Logo boxSize={5} />
          <Text>{symbol}</Text>
        </Stack>
      ),
    },
    {
      label: 'APY',
      width: 1 / 3,
      justify: 'center',
      value: ({ symbol }: Token) => <Text>1.15%</Text>,
    },
    {
      label: 'Wallet',
      width: 1 / 3,
      justify: 'flex-end',
      value: ({ symbol }: Token) => <Text color="purple.200">{`0 ${symbol}`}</Text>,
    },
  ]

  return <Table columns={columns} />
}
