import { Flex, Stack } from '@chakra-ui/react'
import { Fragment } from 'react'

type Column = {
  header: any
  value: any
}

type TableProps = {
  columns: Column[]
  items: any[]
  onClick?: (e: any) => void
}

export const Table = ({ columns, items, onClick }: TableProps) => (
  <Stack w="full" spacing={1} overflowX="auto">
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
    {items?.map((item, i) => (
      <Flex
        key={i}
        w="full"
        justify="space-between"
        align="center"
        fontWeight="semibold"
        fontSize="sm"
        cursor="pointer"
        p={2.5}
        pl={4}
        pr={4}
        borderRadius={8}
        onClick={onClick ? (e: React.MouseEvent<HTMLElement>) => onClick(item) : undefined}
        _hover={{ bgColor: 'purple.900' }}
      >
        {columns.map(({ value }, i) => (
          <Fragment key={i}>{value(item)}</Fragment>
        ))}
      </Flex>
    ))}
  </Stack>
)

export default Table
