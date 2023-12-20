import { ChevronDownIcon, ChevronUpIcon } from '@chakra-ui/icons'
import { Flex, Stack, Box, VStack, IconProps, BoxProps, useMediaQuery, HStack, Text, SimpleGrid, Image, Badge } from '@chakra-ui/react'
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
import { useAppTheme } from '@app/hooks/useAppTheme';
import { smartShortNumber } from '@app/util/markets';

export type Column = {
  label: string
  field: string
  totalField: string
  header: any
  value: any
  totalValue: any
  tooltip?: ReactNode
  showFilter?: boolean
  filterWidth?: any
  customSubheader?: React.ReactChild
  boxProps?: BoxProps
  filterItemRenderer?: AutocompleteProps["itemRenderer"]
}

type TableProps = {
  columns: Column[]
  pinnedItems?: string[]
  pinnedLabels?: string[]
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
  showRowBorder?: boolean
  mobileThreshold?: number
  mobileClickBtnLabel?: string
  showHeader?: boolean
  showTotalRow?: boolean
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
  const length = filteredItems?.length;
  return <SimpleGrid columns={{ base: 1, md: 2 }} spacing={{ base: 4, md: 4 }} w='full'>
    {
      filteredItems?.map((item, i) => {
        return <VStack
          key={item[keyName] ?? i}
          w='full'
          spacing="4"
          border="1px solid #cccccc"
          borderRadius="5"
          bgColor="containerContentBackground"
          justify="space-between"
          px={{ base: '4', md: '8' }}
          py='4'
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

                return <HStack position="relative" alignItems="flex-start" spacing="0" key={j} w='full' justify={isNotFirstCol ? 'space-between' : 'center'}>
                  {
                    !isNotFirstCol && item._isPinned &&
                    <Badge textTransform="capitalize" borderRadius="50px"
                      px="8px" fontWeight="normal" bgColor="mainTextColor" color="contrastMainTextColor" w='fit-content' mr="1" position="absolute" top="-10px" left="-10px">
                      New
                    </Badge>
                  }
                  <HStack display={isNotFirstCol ? 'inline-flex' : 'none'}>
                    {
                      col.tooltip ?
                        <AnimatedInfoTooltip iconProps={{ fontSize: '12px', mr: "1", color: 'mainTextColorLight2' }} zIndex="2" message={col.tooltip} size="small" />
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
  </SimpleGrid>
}

const defaultTotalValue = (field: string, items: any[]) => {
  return smartShortNumber(items.reduce((prev, curr) => prev + curr[field], 0), 2);
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
  showRowBorder = false,
  showHeader = true,
  showTotalRow = false,
  pinnedItems,
  pinnedLabels,
  ...props
}: TableProps) => {
  const { themeStyles } = useAppTheme();
  const [isReady, setIsReady] = useState(false);
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
    setIsReady(true);
  }, []);

  useEffect(() => {
    setSortBy(defaultSort === null ? defaultSort : defaultSort || columns[0].field);
  }, [defaultSort])

  useEffect(() => {
    let filteredItems = [...sortedItems];
    Object.entries(filters).forEach(([key, val]) => {
      if (val === null) { return }
      const isBool = ['true', 'false'].includes(val);
      filteredItems = filteredItems.filter(item => isBool ? item[key].toString() === val : item[key] === val);
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

  const chevronProps = { color: 'mainTextColorLight2', w: 4, h: 4, ...sortChevronProps };

  if (pinnedItems?.length > 0 && filteredItems.length >= 2) {
    pinnedItems?.forEach((p, pinIndex) => {
      const pinnedItemIndex = filteredItems.findIndex(item => item[keyName] === p);
      if (pinnedItemIndex !== -1) {
        const pinnedItem = filteredItems.splice(pinnedItemIndex, 1)[0];
        pinnedItem._isPinned = true;
        pinnedItem._pinLabel = pinnedLabels?.[pinIndex] || '';
        filteredItems.splice(pinIndex, 0, pinnedItem);
      }
    });
  }

  if (isReady && !isLargerThan && enableMobileRender) {
    return <MobileTable
      keyName={keyName}
      filteredItems={filteredItems}
      columns={columns}
      mobileClickBtnLabel={mobileClickBtnLabel}
      onClick={onClick}
    />
  }

  const filteredRows = filteredItems?.map((item, i) => (
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
      border={showRowBorder ? `1px solid ${item._isPinned ? themeStyles.colors.mainTextColorLightAlpha : themeStyles.colors.primary[600]}` : undefined}
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
      position="relative"
    >
      {
        item._isPinned && item._pinLabel &&
        <Badge textTransform="capitalize" borderRadius="50px"
          px="8px" fontWeight="normal" bgColor="mainTextColor" color="contrastMainTextColor" w='fit-content' mr="1" position="absolute" top="-10px" left="-10px">
          {item._pinLabel}
        </Badge>
      }
      {columns.map(({ value, field }, j) => (
        <Box key={j} data-col={field}>{value(item, i)}</Box>
      ))}
    </Flex>
  ));

  const totalRow = !showTotalRow ? null : <Flex
    // bgColor={!alternateBg || (i % 2 === 0) ? 'primary.750' : 'primary.800'}
    justify="space-between"
    align="center"
    fontWeight="semibold"
    fontSize="sm"
    cursor={!!onClick ? 'pointer' : undefined}
    py={2.5}
    pl={4}
    pr={4}
    border={showRowBorder ? `1px solid ${themeStyles.colors.primary[600]}` : undefined}
    minW='fit-content'
    w="full"
    borderRadius={8}
    _hover={{ bgColor: 'primary.850' }}
  >
    {columns.map(({ field, totalValue, totalField, value }, j) => (
      <Box key={j} data-col={field}>
        {
          !totalValue && field === keyName ? <Text>Totals</Text> :
            (totalValue || defaultTotalValue)(totalField || field, filteredItems)
        }
      </Box>
    ))}
  </Flex>

  const noDataEntity = filteredItems.length === 0 && !!noDataMessage &&
    <InfoMessage description={noDataMessage} alertProps={{ w: 'full', color: 'secondaryTextColor', fontSize: '12px' }} />;

  return (
    <Stack w="full" spacing={1} overflowX={{ base: 'auto', lg: 'visible' }} data-sort-by={sortBy} data-sort-dir={sortDir} {...props}>
      {
        showHeader && <Flex
          w="full"
          fontSize="11px"
          fontWeight="semibold"
          justify="space-between"
          textTransform="capitalize"
          pb={showRowBorder ? 4 : 2}
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
                      <AnimatedInfoTooltip iconProps={{ fontSize: '12px', mr: "1", color: 'mainTextColorLight2' }} zIndex="2" message={col.tooltip} size="small" />
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
                      color="mainTextColorLight2"
                      fontSize="12px"
                      {...col.boxProps}
                    >
                      {col.label}
                      {
                        sortBy === col.field ?
                          <Box position="absolute" display="inline-block" right="-14px">
                            {sortDir === 'desc' ? <ChevronDownIcon {...chevronProps} color={col.boxProps?.color} /> : <ChevronUpIcon {...chevronProps} color={col.boxProps?.color} />}
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
                        allowUnlisted={false}
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
      }
      {
        showRowBorder ? <VStack mt={showRowBorder ? "0 !important" : undefined} w='full' spacing={showRowBorder ? '4' : '0'}>
          {filteredRows}
          {totalRow}
          {noDataEntity}
        </VStack>
          : <>
            {filteredRows}
            {totalRow}
            {noDataEntity}
          </>
      }
    </Stack>
  )
}

export default Table
