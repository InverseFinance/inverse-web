import { Flex, FlexProps, Stack } from '@chakra-ui/react'
import Footer from '@app/components/common/Footer'
import { lightTheme } from '@app/variables/theme'
import { LandingNav } from '../Navbar'
import FooterV2 from '../Footer/FooterV2'

export const Layout = ({ children, isLanding, isLandingV2 = false, bgColor = 'mainBackgroundColor', bg = 'mainBackground', ...props }: {
  children?: React.ReactNode,
  bgColor?: FlexProps["bgColor"],
  bg?: FlexProps["bg"],
  isLanding?: boolean,
  isLandingV2?: boolean
}) => (
  <Flex
    w="full"
    minH="100vh"
    bgColor={isLanding ? lightTheme.colors.mainBackgroundColor : bgColor}
    background={isLanding ? lightTheme.colors.mainBackground : bg}
    direction="column"
    align="center"
    pt="74px"
    {...props}>
    <Flex
      zIndex={1}
      w="full"
      minH="100vh"
      direction="column"
      align="center"
      borderColor={`mainTextColorAlpha`}
      borderBottomWidth={isLanding ? 0 : 1}
      pb={0}
    >
      {children}
    </Flex>
    {
      isLandingV2 ? null : isLanding ?
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
            px="8%"
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
