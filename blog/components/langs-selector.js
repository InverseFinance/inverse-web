import { ChevronDownIcon } from '@chakra-ui/icons';
import { Box, Popover, PopoverBody, PopoverTrigger, Text, PopoverContent, VStack } from '@chakra-ui/react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useContext } from 'react'
import { BlogContext } from '../../pages/_app';
import { BLOG_THEME } from '../lib/constants';

const flags = {
    'en-US': '🇺🇸',
    'fr': '🇫🇷',
}

const { activeTextColor, passiveTextColor } = BLOG_THEME.colors;

export default function LangsSelector({ ...props }) {
    const { locale } = useContext(BlogContext);
    const { asPath } = useRouter()

    return (
        <Box minW="fit-content" {...props}>
            <Popover trigger="hover">
                <PopoverTrigger>
                    <Text w='full' cursor="pointer" color={activeTextColor} textTransform="uppercase">
                        {flags[locale]} {locale.substring(0, 2)} <ChevronDownIcon />
                    </Text>
                </PopoverTrigger>
                <PopoverContent border="1px solid #ccc" _focus={{ outline: 'none' }} maxW="70px">
                    <PopoverBody>
                        <VStack w='full'>
                            {Object.entries(flags).map(([key, val]) => {
                                return <Link
                                    key={key}
                                    w='full'
                                    href={asPath.replace(locale, key)}     
                                    legacyBehavior                               
                                >
                                    <Text cursor="pointer" w='full' color={locale === key ? activeTextColor : passiveTextColor} textTransform="uppercase">
                                        {val} {key.substring(0, 2)}
                                    </Text>
                                </Link>
                            })}
                        </VStack>
                    </PopoverBody>
                </PopoverContent>
            </Popover>
        </Box>
    )
}