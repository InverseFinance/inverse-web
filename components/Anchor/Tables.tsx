import { Flex, Stack, Text } from '@chakra-ui/react'
import { Market } from '@inverse/types'
import Logo from '../Logo'

type Column = {
  label: string
  width?: string | number
  justify?: string
  value: any
}

const Table = ({ columns, items }: { columns: Column[]; items: any[] }) => (
  <Stack w="full" spacing={1}>
    <Flex
      w="full"
      fontSize="11px"
      fontWeight="medium"
      color="purple.200"
      justify="space-between"
      textTransform="uppercase"
      pl={4}
      pr={4}
    >
      {columns.map(({ label, width, justify }: Column) => (
        <Flex key={label} width={width} justify={justify}>
          {label}
        </Flex>
      ))}
    </Flex>
    {items?.map((token, i) => (
      <Flex
        key={i}
        w="full"
        justify="space-between"
        fontWeight="semibold"
        fontSize="15px"
        cursor="pointer"
        p={2}
        pl={4}
        pr={4}
        borderRadius={8}
        _hover={{ bgColor: 'purple.900' }}
      >
        {columns.map(({ label, width, justify, value }) => (
          <Flex key={label} width={width} justify={justify}>
            {value(token)}
          </Flex>
        ))}
      </Flex>
    ))}
  </Stack>
)

export const SupplyTable = ({ markets }: { markets: Market[] }) => {
  const columns = [
    {
      label: 'Asset',
      width: 1 / 3,
      value: ({ symbol }: Market) => (
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
      value: ({ supplyApy }: Market) => <Text>{supplyApy ? `${supplyApy.toFixed(2)}%` : '-'}</Text>,
    },
    {
      label: 'Wallet',
      width: 1 / 3,
      justify: 'flex-end',
      value: ({ symbol }: Market) => <Text color="purple.200">{`0 ${symbol}`}</Text>,
    },
  ]

  return <Table columns={columns} items={markets} />
}

export const BorrowTable = ({ markets }: { markets: Market[] }) => {
  const columns = [
    {
      label: 'Asset',
      width: 1 / 3,
      value: ({ symbol }: Market) => (
        <Stack direction="row" align="center">
          <Logo boxSize={5} />
          <Text>{symbol}</Text>
        </Stack>
      ),
    },
    {
      label: 'APR',
      width: 1 / 3,
      justify: 'center',
      value: ({ borrowApy }: Market) => <Text>{borrowApy ? `${borrowApy.toFixed(2)}%` : '-'}</Text>,
    },
    {
      label: 'Wallet',
      width: 1 / 3,
      justify: 'flex-end',
      value: ({ symbol }: Market) => <Text color="purple.200">{`0 ${symbol}`}</Text>,
    },
  ]

  return <Table columns={columns} items={markets.filter(({ borrowApy }) => borrowApy)} />
}
