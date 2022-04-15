import { Flex, Input, InputGroup, VStack, InputLeftElement } from '@chakra-ui/react';
import { useContext, useState } from 'react';
import { useDebouncedEffect } from '@app/hooks/useDebouncedEffect';
import { fetchJson } from 'ethers/lib/utils';
import { BlogContext } from '../../pages/blog/[...slug]';
import Excerpt from './excerpt';
import BlogLink from './common/blog-link';
import { BLOG_THEME } from '../lib/constants';
import { SearchIcon } from '@chakra-ui/icons';
import useSWR from 'swr';
import BlogText from './common/text';
import DateComponent from './date';
import Link from 'next/link';

export default function PostSearch({ ...props }) {
    const [query, setQuery] = useState('');
    const [debouncedQuery, setDebouncedQuery] = useState(query);
    const [isFocused, setIsFocused] = useState(false);
    const { locale } = useContext(BlogContext);
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
            {...props}
        >
            <InputGroup
                left="0"
                w='full'
                bgColor="#fff"
            >
                <InputLeftElement
                    pointerEvents='none'
                    children={<SearchIcon color='gray.300' />}
                />
                <Input
                    w={isFocused ? { base: "100%", sm: '500px' } : { base: '100%', sm: '200px' }}
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
                    position="fixed"
                    bgColor={BLOG_THEME.colors.badgeBgColor}
                    p="0"
                    maxH="500px"
                    overflowY="auto"
                    overflowX="hidden"
                    boxShadow="0 0 5px 5px #ddd"
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
                            return <Link href={url}>
                                <VStack
                                    key={item.slug}
                                    cursor="pointer"
                                    p="4"
                                    w='full'
                                    alignItems="flex-start"
                                    borderTop={i > 0 ? '1px solid #ddd' : undefined}
                                    _hover={{ bgColor: '#ddd' }}
                                    as="a"
                                >
                                    <BlogText>
                                        {item.title}
                                    </BlogText>
                                    <Excerpt excerpt={item.excerpt} content={item.content} url={url} charLimit={100} />
                                    <DateComponent dateString={item.date} readtime={item.readtime} fontSize="14px" />
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
                            _hover={{ bgColor: '#ddd' }}
                        >
                            <BlogText w='full'>No Result</BlogText>
                        </VStack>
                    }
                </VStack>
            }
        </Flex>
    )
}