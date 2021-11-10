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

export const Table = ({ columns, items, onClick, ...props }: TableProps) => (
  <Stack w="full" spacing={1} overflowX="auto" {...props}>
    <Flex
      w="full"
      fontSize="11px"
      fontWeight="semibold"
      color="purple.300"
      justify="space-between"
      textTransform="uppercase"
      pb={2}
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
        bgColor={i % 2 === 0 ? 'purple.750' : 'purple.800'}
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
        _hover={{ bgColor: 'purple.850' }}
      >
        {columns.map(({ value }, j) => (
          <Fragment key={j}>{value(item, i)}</Fragment>
        ))}
      </Flex>
    ))}
  </Stack>
)

export default Table
