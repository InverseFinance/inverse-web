import { Flex } from '@chakra-ui/react';
import Link from 'next/link'
import { useContext } from 'react'
import { BlogContext } from '../../pages/_app';

export default function Header() {
  const { locale } = useContext(BlogContext);
  return (
    <Flex direction="row" justifyContent="space-between" alignItems="center" my="10">
      <h2 className="text-2xl md:text-4xl font-bold tracking-tight md:tracking-tighter leading-tight">
        <Link href={`/blog/${locale}`} legacyBehavior>
          <a className="hover:underline">Inverse Finance Blog</a>
        </Link>
      </h2>
    </Flex>
  )
}
