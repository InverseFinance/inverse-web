import { Flex, Stack } from '@chakra-ui/react'
import { Fragment } from 'react'

type Column = {
  header: any
  value: any
}

type TableProps = {
  columns: Column[]
  items: any[]
  onClick?: any
}

export const Table = ({ columns, items, onClick }: TableProps) => (
  <Stack w="full" spacing={1} overflowX="scroll">
    <Flex
      w="full"
      fontSize="11px"
      fontWeight="semibold"
      color="purple.200"
      justify="space-between"
      textTransform="uppercase"
      pl={4}
      pr={4}
    >
      {columns.map(({ header }: Column, i) => (
        <Fragment key={i}>{header}</Fragment>
      ))}
    </Flex>
    {items?.map((token, i) => (
      <Flex
        key={i}
        w="full"
        justify="space-between"
        align="center"
        fontWeight="semibold"
        fontSize="sm"
        cursor="pointer"
        p={2}
        pl={4}
        pr={4}
        borderRadius={8}
        onClick={onClick ? (e) => onClick(token) : undefined}
        _hover={{ bgColor: 'purple.900' }}
      >
        {columns.map(({ value }, i) => (
          <Fragment key={i}>{value(token)}</Fragment>
        ))}
      </Flex>
    ))}
  </Stack>
)

export default Table
