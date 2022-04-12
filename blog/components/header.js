import Link from 'next/link'
import { useContext } from 'react'
import { BlogContext } from '../../pages/blog/[...slug]'

export default function Header() {
  const { locale } = useContext(BlogContext);
  return (
    <h2 className="text-2xl md:text-4xl font-bold tracking-tight md:tracking-tighter leading-tight mb-20 mt-8">
      <Link href={`/blog/${locale}`}>
        <a className="hover:underline">Inverse Finance Blog</a>
      </Link>
    </h2>
  )
}
