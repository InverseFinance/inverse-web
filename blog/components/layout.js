import { Image } from '@chakra-ui/react'
import Link from 'next/link'
import Meta from '../components/meta'
import Footer from './footer'

export default function Layout({ preview, children }) {
  return (
    <>
      <Meta />
      <div className="min-h-screen">
        {/* <Alert preview={preview} /> */}
        <main>
          <Link href="/anchor">
            <Image              
              cursor="pointer"
              src="/assets/inv-square-dark.jpeg"
              h="30px"
              position="absolute"
              top="15px"
              left="15px"
              borderRadius="30px"
            />
          </Link>
          {children}
        </main>
      </div>
      <Footer />
    </>
  )
}
