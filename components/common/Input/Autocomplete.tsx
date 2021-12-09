import { useState, useRef } from 'react'
import { Box, List, ListItem, InputGroup, InputLeftElement, ComponentWithAs, InputProps, BoxProps, ListItemProps, useDisclosure } from '@chakra-ui/react';
import { Input } from '.';
import { useEffect } from 'react';
import { useOutsideClick } from '@chakra-ui/react'
import { CloseIcon } from '@chakra-ui/icons';
import { isAddress } from 'ethers/lib/utils';
import { AutocompleteItem } from '@inverse/types';

const defaultList: AutocompleteItem[] = [];
const defaultInputComp = Input;

const AutocompleteListItem = (props: ListItemProps) => {
    return (
        <ListItem
            height="40px"
            lineHeight="40px"
            textAlign="left"
            pl="4"
            borderBottom="1px solid #cccccc22"
            cursor="pointer"
            transitionProperty="background-color"
            transitionDuration="400ms"
            transitionTimingFunction="ease"
            _hover={{ bgColor: 'purple.700' }}
            {...props}
        />
    )
}

const EMPTY_ITEM: AutocompleteItem = { label: '', value: '' }

export const Autocomplete = ({
    title = '',
    list = defaultList,
    defaultItem,
    placeholder = '',
    InputComp = defaultInputComp,
    onItemSelect = () => { },
    ...props
}: {
    title?: string,
    list: AutocompleteItem[],
    defaultItem?: AutocompleteItem,
    placeholder?: string,
    InputComp: ComponentWithAs<"input", InputProps>,
    onItemSelect: (selectedItem?: AutocompleteItem) => any,
} & Partial<BoxProps>) => {
    const [searchValue, setSearchValue] = useState('')
    const [selectedItem, setSelectedItem] = useState(defaultItem)
    const [isOpen, setIsOpen] = useState(false)
    const [filteredList, setFilteredList] = useState(list)
    const [notFound, setNotFound] = useState(false)
    const [isFocused, setIsFocused] = useState(false)

    const ref = useRef(null)

    useOutsideClick({
        ref: ref,
        handler: () => setIsOpen(false),
    })

    const getFilteredList = (list: AutocompleteItem[], searchValue: string) => {
        const regEx = new RegExp(searchValue?.replace(/([^a-zA-Z0-9])/g, "\\$1"), 'i')
        return list
            .filter(item => regEx.test(item.value) || regEx.test(item.label));
    }

    useEffect(() => {
        const newList = getFilteredList(list, searchValue)

        const notFound = newList.length === 0
        setNotFound(notFound)
        if (notFound) {
            newList.push({ label: `Select "${searchValue}"`, value: searchValue, isSearchValue: true });
        }

        setFilteredList(newList)
        setIsOpen(isFocused)
    }, [searchValue, list, isFocused])

    const handleSelect = (item?: AutocompleteItem) => {
        setSelectedItem(item)
        if(item) {
            setSearchValue(item.isSearchValue ? item.value : item.label)
        }
        onItemSelect(item || EMPTY_ITEM)
        setTimeout(() => setIsOpen(false), 200)
    }

    const listItems = filteredList
        .map((item, i) => {
            return <AutocompleteListItem
                key={i}
                onClick={() => handleSelect(item)}
                fontWeight={item.value === selectedItem?.value ? 'bold' : 'normal'}
            >
                {item.label}
            </AutocompleteListItem>
        })

    const clear = () => {
        handleSelect(EMPTY_ITEM)
    }

    const handleSearchChange = (value: string) => {
        setSearchValue(value)
        if(!value) {
            clear()
        } else if(isAddress(value)) {
            handleSelect({ value, label: value })
        } else {
            const perfectMatch = list.find((item) => item.value.toLowerCase() === value.toLowerCase() || item.label.toLowerCase() === value.toLowerCase())
            const filteredList = getFilteredList(list, value)
            if(perfectMatch && filteredList.length === 1) {
                handleSelect(perfectMatch)
            }
        }
    }

    return (
        <Box position="relative" ref={ref} {...props}>
            <InputGroup alignItems="center">
                <InputLeftElement
                    height="100%"
                    onClick={clear}
                    pointer="cursor"
                    children={<CloseIcon color={searchValue ? '#cccccc' : '#cccccc22'} fontSize="12px" boxSize="3" />}
                />
                <InputComp
                    placeholder={placeholder}
                    pl="10"
                    type="search"
                    value={searchValue}
                    textAlign="left"
                    fontSize="12px"
                    onChange={(e: any) => handleSearchChange(e.target.value)}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setTimeout(() => setIsFocused(false), 100)}
                />
            </InputGroup>
            {
                isOpen ?
                    <List
                        position="absolute"
                        bgColor={'darkPrimary'}
                        w="full"
                        zIndex="10"
                        borderRadius="5"
                        maxH="200px"
                        overflowY="auto"
                        boxShadow="0 0 2px 1px #aaaaaa"
                    >
                        {
                            title && !notFound ?
                                <AutocompleteListItem
                                    cursor="normal"
                                    _hover={{}}
                                    fontSize="16px"
                                    fontWeight="bold"
                                    borderBottom="2px solid #cccccc">
                                    {title}
                                </AutocompleteListItem>
                                : null
                        }
                        {
                            filteredList.length ? listItems :
                                <AutocompleteListItem _hover={{}}>
                                    No Result
                                </AutocompleteListItem>
                        }
                    </List>
                    : null
            }
        </Box>
    )
}