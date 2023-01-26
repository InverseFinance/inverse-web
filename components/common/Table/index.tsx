import { ChevronDownIcon, ChevronUpIcon } from '@chakra-ui/icons'
import { Flex, Stack, Box, VStack, IconProps, BoxProps, useMediaQuery, HStack, Text } from '@chakra-ui/react'
import { TEST_IDS } from '@app/config/test-ids'
import { Fragment, useEffect, useState, ReactNode } from 'react'
import { AnimatedInfoTooltip } from '@app/components/common/Tooltip';
import { InfoMessage } from '../Messages';
import { Autocomplete } from '../Input/Autocomplete';
import { isAddress } from 'ethers/lib/utils';
import { namedAddress } from '@app/util';
import { uniqueBy } from '@app/util/misc';
import { AutocompleteProps } from '@app/types';
import React from 'react';
import { RSubmitButton } from '../Button/RSubmitButton';

export type Column = {
  label: string
  field: string
  header: any
  value: any
  tooltip?: ReactNode
  showFilter?: boolean
  filterWidth?: any
  customSubheader?: React.ReactChild
  filterItemRenderer?: AutocompleteProps["itemRenderer"]
}

type TableProps = {
  columns: Column[]
  items: any[]
  keyName?: string
  defaultSort?: string
  defaultSortDir?: string
  alternateBg?: boolean
  onClick?: (e: any) => void
  onFilter?: (items: any[], filters: any) => void
  noDataMessage?: string
  defaultFilters?: { [key: string]: any }
  sortChevronProps?: IconProps
  colBoxProps?: BoxProps
  enableMobileRender?: boolean
  mobileThreshold?: number
  mobileClickBtnLabel?: string
}

const emptyObj = {};

export const MobileTable = ({
  keyName,
  filteredItems,
  columns,
  mobileClickBtnLabel,
  onClick,
}: {
  keyName: TableProps["keyName"],
  filteredItems: TableProps["items"],
  columns: TableProps["columns"],
  mobileClickBtnLabel: TableProps["mobileClickBtnLabel"],
  onClick: TableProps["onClick"],
}) => {
  return <VStack spacing="4" w='full'>
    {
      filteredItems?.map((item, i) => {
        const isNotFirst = i > 0;
        return <VStack
          key={item[keyName] ?? i}
          w='full'
          spacing="4"
          borderTop={isNotFirst ? '1px solid #cccccc' : undefined}
          pt={isNotFirst ? '4' : undefined}
        >
          <VStack w='full' spacing="2">
            {
              columns.map((col: Column, j) => {
                const isNotFirstCol = j > 0;
                const Value = col.value(item, i);

                const MobileAdaptedValue = () => React.cloneElement(Value, {
                  minWidth: '0',
                  minW: '0',
                  textAlign: 'right',
                  alignItems: 'flex-end',
                  onClick: (isNotFirstCol || !onClick) ? undefined : (e) => onClick(item, e),
                }, <>{Value.props.children}</>);

                return <HStack spacing="0" key={j} w='full' justify={isNotFirstCol ? 'space-between' : 'center'}>
                  <HStack display={isNotFirstCol ? 'inline-flex' : 'none'}>
                    {
                      col.tooltip ?
                        <AnimatedInfoTooltip iconProps={{ fontSize: '12px', mr: "1", color: 'accentTextColor' }} zIndex="2" message={col.tooltip} size="small" />
                        : null
                    }
                    <Text>{col.label}</Text>
                  </HStack>
                  <MobileAdaptedValue />
                </HStack>
              })
            }
          </VStack>
          {
            !!onClick && <RSubmitButton onClick={onClick ? (e) => onClick(item, e) : undefined} fontSize='16px'>
              {mobileClickBtnLabel}
            </RSubmitButton>
          }
        </VStack>
      })
    }
  </VStack>
}

export const Table = ({
  columns,
  noDataMessage,
  items,
  keyName,
  defaultSortDir = 'asc',
  defaultSort,
  alternateBg = true,
  defaultFilters = emptyObj,
  onClick,
  onFilter,
  sortChevronProps,
  colBoxProps,
  enableMobileRender = false,
  mobileThreshold = 821,
  mobileClickBtnLabel = 'View Details',
  ...props
}: TableProps) => {
  const [isLargerThan] = useMediaQuery(`(min-width: ${mobileThreshold}px)`);
  const [sortBy, setSortBy] = useState(defaultSort === null ? defaultSort : defaultSort || columns[0].field);
  const [sortDir, setSortDir] = useState(defaultSortDir);
  const [filters, setFilters] = useState(defaultFilters);
  const [filteredItems, setFilteredItems] = useState([]);

  const hasSubheader = columns.filter(c => c.showFilter || !!c.customSubheader).length > 0;

  const [sortedItems, setSortedItems] = useState(items?.map((item) => {
    return ({ ...item, symbol: item?.symbol || item?.underlying?.symbol })
  }));

  useEffect(() => {
    setSortBy(defaultSort === null ? defaultSort : defaultSort || columns[0].field);
  }, [defaultSort])

  useEffect(() => {
    let filteredItems = [...sortedItems];
    Object.entries(filters).forEach(([key, val]) => {
      if (val === null) { return }
      filteredItems = filteredItems.filter(item => item[key] === val);
    });
    setFilteredItems(filteredItems);
    if (onFilter) {
      onFilter(filteredItems, filters);
    }
  }, [sortedItems, filters])

  useEffect(() => {
    if (sortBy === null) {
      setSortedItems(items);
      return;
    }
    const itemsToSort = items?.map((item) => ({
      ...item,
      symbol: item?.symbol || item?.underlying?.symbol,
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

  const chevronProps = { color: 'accentTextColor', w: 4, h: 4, ...sortChevronProps };

  if (!isLargerThan && enableMobileRender) {
    return <MobileTable
      keyName={keyName}
      filteredItems={filteredItems}
      columns={columns}
      mobileClickBtnLabel={mobileClickBtnLabel}
      onClick={onClick}
    />
  }

  return (
    <Stack w="full" spacing={1} overflowX={{ base: 'auto', lg: 'visible' }} data-sort-by={sortBy} data-sort-dir={sortDir} {...props}>
      <Flex
        w="full"
        fontSize="11px"
        fontWeight="semibold"
        justify="space-between"
        textTransform="capitalize"
        pb={2}
        pl={4}
        pr={4}
      >
        {columns.map((col: Column, i) => {
          const ColHeader = col.header;
          const FilterItem = col.filterItemRenderer;
          const filterItems = uniqueBy(
            sortedItems?.map(item => {
              const v = item[col.field]?.toString();
              const label = isAddress(v) ? namedAddress(v) : v;
              return {
                value: v,
                label: label || '',
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
                {...colBoxProps}
              >
                {
                  col.tooltip ?
                    <AnimatedInfoTooltip iconProps={{ fontSize: '12px', mr: "1", color: 'accentTextColor' }} zIndex="2" message={col.tooltip} size="small" />
                    : null
                }
                <VStack alignItems={i === 0 ? 'flex-start' : i === (columns.length - 1) ? 'flex-end' : 'center'} justifyContent="flex-start" cursor="pointer">
                  <Box
                    data-testid={`${TEST_IDS.colHeaderText}-${col.field}`}
                    onClick={(e) => {
                      if (!!e && e.target.id.startsWith('popover-')) {
                        return;
                      }
                      return toggleSort(col)
                    }}
                    userSelect="none"
                    position="relative"
                    color="accentTextColor"
                    fontSize="12px"
                  >
                    {col.label}
                    {
                      sortBy === col.field ?
                        <Box position="absolute" display="inline-block" right="-14px">
                          {sortDir === 'desc' ? <ChevronDownIcon {...chevronProps} /> : <ChevronUpIcon {...chevronProps} />}
                        </Box>
                        : null
                    }
                  </Box>
                  {
                    col.showFilter && <Autocomplete
                      color="secondaryTextColor"
                      list={filterItems}
                      textTransform="capitalize"
                      w={col.filterWidth}
                      p="0"
                      showChevron={false}
                      inputProps={{ p: '0' }}
                      defaultValue={filters[col.field]}
                      itemRenderer={
                        col.filterItemRenderer ?
                          (value) => <FilterItem {...{ [col.field]: value }} />
                          : undefined
                      }
                      onItemSelect={(item) => {
                        setFilters({ ...filters, [col.field]: item.value === '' ? null : item.value })
                      }}
                    />
                  }
                  {
                    hasSubheader && !col.showFilter && !col.customSubheader && <Box w='full' cursor="default" h="40px">&nbsp;</Box>
                  }
                  {
                    !!col.customSubheader && col.customSubheader
                  }
                </VStack>
              </Box>
            </ColHeader>
          )
        })}
      </Flex>
      {filteredItems?.map((item, i) => (
        <Flex
          key={item[keyName] ?? i}
          // bgColor={!alternateBg || (i % 2 === 0) ? 'primary.750' : 'primary.800'}
          justify="space-between"
          align="center"
          fontWeight="semibold"
          fontSize="sm"
          cursor={!!onClick ? 'pointer' : undefined}
          py={2.5}
          pl={4}
          pr={4}
          minW='fit-content'
          w="full"
          borderRadius={8}
          onClick={onClick ? (e: React.MouseEvent<HTMLElement>) => {
            if (!!e && e?.target?.id.startsWith('popover-')) {
              return;
            }
            return onClick(item, e);
          } : undefined}
          _hover={{ bgColor: 'primary.850' }}
        >
          {columns.map(({ value }, j) => (
            <Fragment key={j}>{value(item, i)}</Fragment>
          ))}
        </Flex>
      ))}
      {
        !filteredItems.length > 0 && !!noDataMessage &&
        <InfoMessage description={noDataMessage} alertProps={{ w: 'full', color: 'secondaryTextColor', fontSize: '12px' }} />
      }
    </Stack>
  )
}

export default Table
