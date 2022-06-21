import { Flex, Input, InputGroup, InputLeftElement } from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import { SearchIcon } from '@chakra-ui/icons';
import { useDebouncedEffect } from '@app/hooks/useDebouncedEffect';

export const SearchProposals = ({ 
    onSearch,
    defaultValue = '',
 }: { 
    onSearch: (v: string) => void,
    defaultValue: string,
 }) => {
    const [query, setQuery] = useState(defaultValue);

    useEffect(() => {
        setQuery(defaultValue);
    }, [defaultValue]);

    useDebouncedEffect(() => {
        onSearch(query);
    }, [query], 200);

    return (
        <Flex           
            justifyContent="center"
            w={{ base: 'full', sm: 'auto' }}
            pt={{ base: '2' }}
        >
            <InputGroup
                left="0"
                w='full'          
                bgColor="transparent"
            >
                <InputLeftElement
                    pointerEvents='none'
                    children={<SearchIcon color='gray.300' />}
                />
                <Input
                    color="mainTextColor"
                    borderRadius="20px"
                    type="search"
                    value={query}            
                    placeholder="Search text / tag"
                    onChange={(e) => {
                        setQuery(e.target.value);
                    }}
                />
            </InputGroup>            
        </Flex>
    )
}