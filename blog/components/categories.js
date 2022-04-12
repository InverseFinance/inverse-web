import { HStack, Link } from '@chakra-ui/react'

export default function Categories({ categories, locale, active = "home" }) {
    return <HStack pb="5" spacing="10">
        {
            categories.map(c => {
                return <Link
                    key={c.order}
                    href={`/blog/${locale}/${c.name}`}
                    color={active === c.name ? '#1a202c' : '#777'}
                    fontSize="20px"
                    fontWeight={active === c.name ? 'extrabold' : 'bold'}
                    className="">
                    {c.label}
                </Link>
            })
        }
    </HStack>
}