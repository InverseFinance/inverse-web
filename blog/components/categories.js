import { HStack, Link, SimpleGrid } from '@chakra-ui/react'
import { useContext } from 'react'
import { BlogContext } from '../../pages/_app';
import { BLOG_THEME } from '../lib/constants';

export default function Categories({ categories, isNotOnCategoryPage = false, customPage = '' }) {
    const { locale, category } = useContext(BlogContext);
    const content = categories.filter(c => !!c).map(c => {
        const isActive = (category === '' && c.name === 'home') || (category === c.name && !isNotOnCategoryPage) || (c.isCustomPage && c.name === customPage);
        const url = !c.isCustomPage ? `/blog/${locale}/${c.name}` : `/blog/${c.name}/${locale}`;
        return <Link
            _focus={{}}
            key={c.order}
            href={url}
            color={isActive ? BLOG_THEME.colors.activeTextColor : BLOG_THEME.colors.passiveTextColor}
            fontSize="20px"
            fontWeight={isActive ? 'extrabold' : 'bold'}
            className="">
            {c.label}
        </Link>
    })
    return <>
        <SimpleGrid pb="4" display={{ base: 'grid', lg: 'none' }} spacing="1" w="100%" minChildWidth="150px">{content}</SimpleGrid>
        <HStack pb="4" display={{ base: 'none', lg: 'flex' }} spacing="10">{content}</HStack>
    </>
}