import { Image } from '@chakra-ui/react'
import Link from 'next/link'
import Meta from '../components/meta'
import BlogFooter from './blog-footer'
import LangsSelector from './langs-selector'

export default function Layout({ preview, children }) {
  return (
    <>
      <Meta />
      <div className="min-h-screen">
        <main>
          <Link href="/anchor">
            <Image              
              cursor="pointer"
              src="/assets/inv-square-dark.jpeg"
              h="30px"
              position="absolute"
              top={{ base: '5px', sm: '15px' }}
              left={{ base: '5px', sm: '15px' }}
              borderRadius="30px"
            />
          </Link>
          <LangsSelector position="absolute" top={{ base: '5px', sm: '15px' }} right={{ base: '5px', sm: '15px' }} />
          {children}
        </main>
      </div>
      <BlogFooter />
    </>
  )
}
