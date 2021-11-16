import { ChevronDownIcon, ChevronUpIcon } from '@chakra-ui/icons'
import { Flex, Stack, Box, Text } from '@chakra-ui/react'
import { TEST_IDS } from '@inverse/config/test-ids'
import { Fragment, useEffect, useState } from 'react'
import { InfoTooltip } from '@inverse/components/common/Tooltip';

type Column = {
  label: string
  field: string
  header: any
  value: any
  tooltip?: string
}

type TableProps = {
  columns: Column[]
  items: any[]
  onClick?: (e: any) => void
}

export const Table = ({ columns, items, onClick, ...props }: TableProps) => {
  const [sortBy, setSortBy] = useState(columns[0].field);
  const [sortDir, setSortDir] = useState('asc');

  const [sortedItems, setSortedItems] = useState(items?.map((item) => {
    return ({ ...item, symbol: item?.underlying?.symbol })
  }));

  useEffect(() => {
    const itemsToSort = items?.map((item) => ({
      ...item,
      symbol: item?.underlying?.symbol,
    })) || [];

    setSortedItems([...itemsToSort].sort((a, b) => {
      const returnVal = sortDir === 'asc' ? -1 : 1;
      const aVal = Array.isArray(a[sortBy]) ? a[sortBy].length : a[sortBy];
      const bVal = Array.isArray(b[sortBy]) ? b[sortBy].length : b[sortBy];
      if (aVal < bVal) { return 1 * returnVal; }
      if (aVal > bVal) { return -1 * returnVal; }
      return 0;
    }))
  }, [sortBy, sortDir, items]);

  const toggleSort = (col: Column) => {
    if (col.field === sortBy) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(col.field);
    }
  }

  const chevronProps = { color: 'purple.300', w: 4, h: 4 };

  return (
    <Stack w="full" spacing={1} overflowX="auto" data-sort-by={sortBy} data-sort-dir={sortDir} {...props}>
      <Flex
        w="full"
        fontSize="11px"
        fontWeight="semibold"
        justify="space-between"
        textTransform="uppercase"
        pb={2}
        pl={3}
        pr={3}
      >
        {columns.map((col: Column, i) => {
          const ColHeader = col.header
          return (
            <ColHeader key={i}>
              <Box
                data-testid={`${TEST_IDS.colHeaderBox}-${col.field}`}
                display="inline-flex"
                fontWeight={sortBy === col.field ? 'bold' : 'normal'}
                cursor="pointer"
                alignItems="center"
                color="purple.300"
              >
                {col.tooltip ? <InfoTooltip message={col.tooltip} iconProps={{ mr: "1", fontSize: "10px" }} /> : null}
                <Box
                  data-testid={`${TEST_IDS.colHeaderText}-${col.field}`}
                  onClick={() => toggleSort(col)}
                  position="relative">
                  {col.label}
                  {
                    sortBy === col.field ?
                      <Box position="absolute" display="inline-block" right="-4">
                        {sortDir === 'desc' ? <ChevronDownIcon {...chevronProps} /> : <ChevronUpIcon {...chevronProps} />}
                      </Box>
                      : null
                  }
                </Box>
              </Box>
            </ColHeader>
          )
        })}
      </Flex>
      {sortedItems?.map((item, i) => (
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
}

export default Table
