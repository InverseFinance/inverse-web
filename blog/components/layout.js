import { HStack, Image } from '@chakra-ui/react'
import Link from 'next/link'
import Meta from '../components/meta'
import BlogFooter from './blog-footer'
import LangsSelector from './langs-selector'
import PostSearch from './post-search'

export default function Layout({ preview, children }) {
  return (
    <>
      <Meta />
      <div className="min-h-screen">
        <main>
          <HStack spacing="0" justifyContent="space-between" m={{ base: '10px', sm: '15px' }} w='full'>
            <Link href="/anchor">
              <Image
                cursor="pointer"
                src="/assets/inv-square-dark.jpeg"
                h="30px"
                borderRadius="30px"
              />
            </Link>
            <PostSearch display={{ base: 'inline-flex', sm: 'none' }} />
            <HStack spacing={{ base: '0', sm: '2' }}>
              <PostSearch display={{ base: 'none', sm: 'inline-flex' }} maxW="500px" />
              <LangsSelector />
            </HStack>
          </HStack>
          {children}
        </main>
      </div>
      <BlogFooter />
    </>
  )
}
