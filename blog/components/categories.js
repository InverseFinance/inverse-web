import { HStack, Link } from '@chakra-ui/react'
import { useContext } from 'react'
import { BlogContext } from '../../pages/blog/[...slug]'

export default function Categories({ categories }) {
    const { locale, category } = useContext(BlogContext);
    return <HStack pb="5" spacing="10">
        {
            categories.map(c => {
                return <Link
                    key={c.order}
                    href={`/blog/${locale}/${c.name}`}
                    color={category === c.name ? '#1a202c' : '#777'}
                    fontSize="20px"
                    fontWeight={category === c.name ? 'extrabold' : 'bold'}
                    className="">
                    {c.label}
                </Link>
            })
        }
    </HStack>
}