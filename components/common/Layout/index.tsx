import { Flex, FlexProps, Stack } from '@chakra-ui/react'
import Footer from '@app/components/common/Footer'
import { lightTheme } from '@app/variables/theme'
import { LandingNav } from '../Navbar'

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
      borderBottomWidth={isLanding ? 0 : 1}
      pb={6}
    >
      {children}
    </Flex>
    {
      isLanding ?
        <Stack
          bgColor={lightTheme.colors.accentTextColor}
          borderLeftRadius="50px"
          borderRightRadius="50px"
          w='full'
          spacing="0"
        >
          <Stack
            alignItems="center"                        
            direction={{ base: 'column', md: 'row' }}
            px="7vw"
            py="8"
            spacing={2}
          >
            <LandingNav isBottom={true} />
          </Stack>
          <Footer isLanding={isLanding} />
        </Stack>
        :
        <Footer isLanding={isLanding} />
    }
  </Flex>
)

export default Layout
