import { Box } from '@chakra-ui/react'
import BlogFooter from './blog-footer'
import { AppNav } from '@app/components/common/Navbar';

export default function Layout({ preview, isNewsletter = false, children }) {
  return (
    <>
      <div className="min-h-screen">
        <main>
          <AppNav active={isNewsletter ? '' : 'More'} activeSubmenu="Blog" isBlog={true} />
          <Box pt="74px">
            {children}
          </Box>
        </main>
      </div>
      <BlogFooter includeNewsletter={!isNewsletter} />
    </>
  )
}
