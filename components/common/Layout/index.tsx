import { Flex, FlexProps } from '@chakra-ui/react'
import Footer from '@app/components/common/Footer'

export const Layout = ({ children, bgColor = 'purple.900' }: { children?: React.ReactNode, bgColor?: FlexProps["bgColor"] }) => (
  <Flex w="full" minH="100vh" bgColor={bgColor} direction="column" align="center">
    <Flex
      zIndex={1}
      w="full"
      minH="100vh"
      direction="column"
      align="center"
      borderColor="purple.800"
      borderBottomWidth={1}
      pb={6}
    >
      {children}
    </Flex>
    <Flex
      zIndex={0}
      position="absolute"
      w={{ base: '0', md: '3xl' }}
      h={{ base: '0', md: '3xl' }}
      left="50%"
      top="50%"
      transform="translate(-50%, -50%)"
      bgColor="purple.800"
      borderRadius={512}
      filter="blur(100px)"
    />
    <Footer />
  </Flex>
)

export default Layout
