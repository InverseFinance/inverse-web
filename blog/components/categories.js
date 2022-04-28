import { HStack, Link } from '@chakra-ui/react'
import { useContext } from 'react'
import { BlogContext } from '../../pages/_app';
import { BLOG_THEME } from '../lib/constants';

export default function Categories({ categories, isNotOnCategoryPage = false, customPage = '' }) {
    const { locale, category } = useContext(BlogContext);
    return <HStack pb="5" spacing="10" overflow="auto">
        {
            categories.filter(c => !!c).map(c => {
                const isActive = (category === '' && c.name === 'home') || (category === c.label && !isNotOnCategoryPage) || (c.isCustomPage && c.name === customPage);
                const url = !c.isCustomPage ? `/blog/${locale}/${c.label}` : `/blog/${c.label}/${locale}`;
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
        }
    </HStack>
}