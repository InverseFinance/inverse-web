import { Flex, Input, InputGroup, VStack, InputLeftElement } from '@chakra-ui/react';
import { useContext, useState } from 'react';
import { useDebouncedEffect } from '@app/hooks/useDebouncedEffect';
import { fetchJson } from 'ethers/lib/utils';
import { BlogContext } from '../../pages/_app';
import Excerpt from './excerpt';
import { SearchIcon } from '@chakra-ui/icons';
import useSWR from 'swr';
import BlogText from './common/text';
import DateComponent from './date';
import Link from 'next/link';
import { useAppTheme } from '@app/hooks/useAppTheme';

export default function PostSearch({ ...props }) {
    const [query, setQuery] = useState('');
    const [debouncedQuery, setDebouncedQuery] = useState(query);
    const [isFocused, setIsFocused] = useState(false);
    const { locale } = useContext(BlogContext);
    const { themeStyles } = useAppTheme();
    const { data: results } = useSWR(`/api/blog/post-search?search=${debouncedQuery}&locale=${locale}`, fetchJson);

    useDebouncedEffect(() => {
        setDebouncedQuery(query);
    }, [query], 300);

    return (
        <Flex
            position={isFocused ? { base: { 'fixed': 'relative', sm: 'relative' } } : 'relative'}
            zIndex="2"
            left="0"
            right="0"
            m="0"
            pr={{ base: '0', lg: '2' }}
            justifyContent="center"
            {...props}
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
                    w={isFocused ? { base: "100%", sm: '400px' } : { base: '100%', sm: '200px' }}
                    onBlur={() => setTimeout(() => setIsFocused(false), 200)}
                    onClick={() => setIsFocused(!isFocused)}
                    type="search"
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value)
                        if (!isFocused) { setIsFocused(true) }
                    }}

                />
            </InputGroup>
            {
                results && isFocused && <VStack
                    alignItems="flex-start"
                    position="absolute"
                    bgColor={"mainBackgroundColor"}                    
                    p="0"
                    maxH="500px"
                    overflowY="auto"
                    overflowX="hidden"
                    boxShadow={`0 0 5px 2px ${themeStyles.colors.mainTextColor}`}
                    top={{ base: '55px', sm: '60px' }}
                    left={{ base: '0', sm: 'auto' }}
                    right={{ base: '0', sm: 'auto' }}
                    spacing="0"
                    zIndex="2"
                    w={isFocused ? { base: "100%", sm: '500px' } : { base: '100%', sm: '200px' }}
                >
                    {
                        results && results?.map((item, i) => {
                            const url = `/blog/posts/${locale}/${item.slug}`
                            return <Link href={url} key={item.slug} legacyBehavior>
                                <VStack
                                    cursor="pointer"
                                    p="4"
                                    w='full'
                                    alignItems="flex-start"
                                    borderTop={i > 0 ? `1px solid ${themeStyles.colors.secondaryTextColor}` : undefined}
                                    _hover={{ bgColor: themeStyles.colors.secContrastMainTextColor }}
                                    as="a"
                                >
                                    <BlogText fontWeight="bold" color="mainTextColor">
                                        {item.title}
                                    </BlogText>
                                    <Excerpt asLink={false} excerpt={item.excerpt} content={item.content} url={url} charLimit={100} color={themeStyles.colors.secondaryTextColor} />
                                    <DateComponent dateString={item.date} readtime={item.readtime} fontSize="14px" color={themeStyles.colors.secondaryTextColor} />
                                </VStack>
                            </Link>
                        })
                    }
                    {
                        results && results.length === 0 &&
                        <VStack
                            cursor="pointer"
                            p="4"
                            w='full'
                            alignItems="flex-start"
                            _hover={{ bgColor: themeStyles.colors.mainBackgroundColor }}
                        >
                            <BlogText w='full'>No Result</BlogText>
                        </VStack>
                    }
                </VStack>
            }
        </Flex>
    )
}