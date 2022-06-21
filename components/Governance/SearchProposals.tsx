import { Flex, Input, InputGroup, InputLeftElement } from '@chakra-ui/react';
import { useState } from 'react';
import { SearchIcon } from '@chakra-ui/icons';

export const SearchProposals = ({ onSearch }: { onSearch: (v: string) => void }) => {
    const [query, setQuery] = useState('');

    return (
        <Flex           
            justifyContent="center"
        >
            <InputGroup
                left="0"
                w='95%'
          
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
                    placeholder="Search text"
                    onChange={(e) => {
                        setQuery(e.target.value);
                        onSearch(e.target.value);
                    }}
                />
            </InputGroup>            
        </Flex>
    )
}