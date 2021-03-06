import { Flex, FlexProps } from '@chakra-ui/react'
import Footer from '@app/components/common/Footer'

export const Layout = ({ children, bgColor = 'mainBackgroundColor', bg = 'mainBackground', ...props }: {
  children?: React.ReactNode,
  bgColor?: FlexProps["bgColor"],
  bg?: FlexProps["bg"],
}) => (
  <Flex w="full" minH="100vh" bgColor={bgColor} background={bg} direction="column" align="center" pt="74px" {...props}>
    <Flex
      zIndex={1}
      w="full"
      minH="100vh"
      direction="column"
      align="center"
      borderColor="primary.800"
      borderBottomWidth={1}
      pb={6}
    >
      {children}
    </Flex>
    <Footer />
  </Flex>
)

export default Layout
