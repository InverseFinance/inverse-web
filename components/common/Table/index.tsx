import { ChevronDownIcon, ChevronUpIcon } from '@chakra-ui/icons'
import { Flex, Stack, Box, VStack } from '@chakra-ui/react'
import { TEST_IDS } from '@app/config/test-ids'
import { Fragment, useEffect, useState, ReactNode } from 'react'
import { AnimatedInfoTooltip } from '@app/components/common/Tooltip';
import { InfoMessage } from '../Messages';
import { Autocomplete } from '../Input/Autocomplete';
import { isAddress } from 'ethers/lib/utils';
import { namedAddress } from '@app/util';
import { uniqueBy } from '@app/util/misc';

export type Column = {
  label: string
  field: string
  header: any
  value: any
  tooltip?: ReactNode
  showFilter?: boolean
  filterWidth?: any
}

type TableProps = {
  columns: Column[]
  items: any[]
  keyName?: string
  defaultSort?: string
  defaultSortDir?: string
  alternateBg?: boolean
  onClick?: (e: any) => void
  noDataMessage?: string
}

export const Table = ({ columns, noDataMessage, items, keyName, defaultSortDir = 'asc', defaultSort, alternateBg = true, onClick, ...props }: TableProps) => {
  const [sortBy, setSortBy] = useState(defaultSort || columns[0].field);
  const [sortDir, setSortDir] = useState(defaultSortDir);
  // const [filters, setFilters] = useState({});
  // const [filteredItems, setFilteredItems] = useState([]);

  const hasOneColWithFilter = columns.filter(c => c.showFilter).length > 0;

  const [sortedItems, setSortedItems] = useState(items?.map((item) => {
    return ({ ...item, symbol: item?.underlying?.symbol })
  }));

  // useEffect(() => {
  //   let filteredItems = [...sortedItems];
  //   Object.entries(filters).forEach(([key, val]) => {
  //     if (val === null) { return }
  //     filteredItems = filteredItems.filter(item => item[key] === val);
  //   });
  //   setFilteredItems(filteredItems)
  // }, [sortedItems, filters])

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

  const chevronProps = { color: 'primary.300', w: 4, h: 4 };

  return (
    <Stack w="full" spacing={1} overflowX={{ base: 'auto', lg: 'visible' }} data-sort-by={sortBy} data-sort-dir={sortDir} {...props}>
      <Flex
        w="full"
        fontSize="11px"
        fontWeight="semibold"
        justify="space-between"
        textTransform="uppercase"
        pb={2}
        pl={4}
        pr={4}
      >
        {columns.map((col: Column, i) => {
          const ColHeader = col.header;
          const filterItems = uniqueBy(
            sortedItems?.map(item => {
              const v = item[col.field]?.toString();
              const label = isAddress(v) ? namedAddress(v) : v;
              return {
                value: v,
                label: label,
              }
            }),
            (a, b) => a.value === b.value,
          )
          return (
            <ColHeader key={i}>
              <Box
                data-testid={`${TEST_IDS.colHeaderBox}-${col.field}`}
                display="inline-flex"
                fontWeight={sortBy === col.field ? 'bold' : 'normal'}
                alignItems="center"
                color="primary.300"
              >

                {
                  col.tooltip ?
                    <AnimatedInfoTooltip message={col.tooltip} size="small" />
                    : null
                }
                <VStack alignItems="center" justifyContent="flex-start" cursor="pointer">
                  <Box
                    data-testid={`${TEST_IDS.colHeaderText}-${col.field}`}
                    onClick={() => toggleSort(col)}
                    userSelect="none"
                    position="relative">
                    {col.label}
                    {
                      sortBy === col.field ?
                        <Box position="absolute" display="inline-block" right="-14px">
                          {sortDir === 'desc' ? <ChevronDownIcon {...chevronProps} /> : <ChevronUpIcon {...chevronProps} />}
                        </Box>
                        : null
                    }
                  </Box>
                  {/* {
                    col.showFilter && <Autocomplete
                      color="secondaryTextColor"
                      list={filterItems}
                      textTransform="capitalize"
                      w={col.filterWidth}
                      p="0"
                      showChevron={false}
                      inputProps={{ p: '0' }}
                      defaultValue={filters[col.field]}
                      onItemSelect={(item) => {
                        setFilters({ ...filters, [col.field]: item.value === '' ? null : item.value })
                      }}
                    />
                  }
                  {
                    hasOneColWithFilter && !col.showFilter && <Box w='full' cursor="default" h="40px">&nbsp;</Box>
                  } */}
                </VStack>
              </Box>
            </ColHeader>
          )
        })}
      </Flex>
      {sortedItems?.map((item, i) => (
        <Flex
          key={item[keyName] || i}
          bgColor={!alternateBg || (i % 2 === 0) ? 'primary.750' : 'primary.800'}
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
          _hover={{ bgColor: 'primary.850' }}
        >
          {columns.map(({ value }, j) => (
            <Fragment key={j}>{value(item, i)}</Fragment>
          ))}
        </Flex>
      ))}
      {
        !sortedItems.length > 0 && !!noDataMessage &&
        <InfoMessage description={noDataMessage} alertProps={{ w: 'full', color: 'secondaryTextColor', fontSize: '12px' }} />
      }
    </Stack>
  )
}

export default Table
