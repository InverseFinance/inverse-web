import { Flex, FlexProps } from '@chakra-ui/react'
import Footer from '@app/components/common/Footer'

export const Layout = ({ children, isLanding, bgColor = 'mainBackgroundColor', bg = 'mainBackground', ...props }: {
  children?: React.ReactNode,
  bgColor?: FlexProps["bgColor"],
  bg?: FlexProps["bg"],
  isLanding?: boolean
}) => (
  <Flex w="full" minH="100vh" bgColor={bgColor} background={bg} direction="column" align="center" pt="74px" {...props}>
    <Flex
      zIndex={1}
      w="full"
      minH="100vh"
      direction="column"
      align="center"
      borderColor={`mainTextColorAlpha`}
      borderBottomWidth={1}
      pb={6}
    >
      {children}
    </Flex>
    <Footer isLanding={isLanding} />
  </Flex>
)

export default Layout
