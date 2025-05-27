import { HStack, Image, Stack, SimpleGrid, StackProps, VStack, useMediaQuery } from '@chakra-ui/react'
import Layout from '@app/components/common/Layout'
import Head from 'next/head'
import { shortenNumber } from '@app/util/markets'
import { getLandingProps } from '@app/blog/lib/utils'
import { ArrowForwardIcon, CheckCircleIcon, SmallCloseIcon } from '@chakra-ui/icons'
import { LandingAnimation } from '@app/components/common/Animation/LandingAnimation'
import FloatingNav from '@app/components/common/Navbar/FloatingNav'
import { EcosystemBanner, EcosystemGrid } from '@app/components/Landing/EcosystemBanner'
import Link from '@app/components/common/Link'
import { useEffect, useState } from 'react'
import FirmLogo from '@app/components/common/Logo/FirmLogo'
import { GeistText, LandingBtn, LandingCard, landingDarkNavy2, landingGreenColor, LandingHeading, landingLightBorderColor, LandingLink, landingMainColor, landingMutedColor, LandingNoisedBtn, landingPurple, landingPurpleBg, landingPurpleText, LandingStat, LandingStatBasic, LandingStatBasicBig, landingYellowColor } from '@app/components/common/Landing/LandingComponents'

const ResponsiveStack = (props: StackProps) => <Stack direction={{ base: 'column', md: 'row' }} justify="space-between" {...props} />

const firmLogo = <FirmLogo transform="translateY(12px)" position="absolute" top="0" w="65px" h="30px" theme="light" />;

const animWidthToHeightRatio = 1.78;

const bluePastel = "#ebecf7";

export const EcosystemPage = ({
}: {
  }) => {
  const [windowSize, setWindowSize] = useState(0);
  const [isAnimNeedStretch, setIsAnimNeedStretch] = useState(true);
  const [animStrechFactor, setAnimStrechFactor] = useState(1);

  useEffect(() => {
    const handleResize = () => {
      setWindowSize(Math.max(window.innerWidth, window.innerHeight)/2);
      const ratio = window.innerWidth / window.innerHeight;
      setIsAnimNeedStretch(true);
      setAnimStrechFactor((animWidthToHeightRatio - ratio)+1);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <Layout isLanding={true} isLandingV2={true} pt="0" overflow="hidden">
      <Head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
        <link href="https://fonts.googleapis.com/css2?family=Funnel+Display:wght@300..800&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Funnel+Display:wght@300..800&family=Geist:wght@100..900&display=swap" rel="stylesheet"></link>
        <title>Inverse Finance - Fixed-Rate DeFi borrowing</title>
        <meta name="og:image" content="https://inverse.finance/assets/social-previews/landing.png" />
        <link rel="canonical" href="https://inverse.finance" />
        <link rel="stylesheet" href="/landing.css" />
      </Head>
      <VStack spacing="0" className="landing-v3" w='full' alignItems="center">
        <VStack bgColor={bluePastel} h='100vh' w='full' alignItems="flex-start" justifyContent={{ base: 'flex-start', md: 'center' }}>
          <VStack position="fixed" zIndex="99999" top="0" maxW="2000px" w='full' px={{ base: 0, md: '4%' }} py={{ base: 0, md: '5' }} alignItems="center">
            <FloatingNav />
          </VStack>
          <ResponsiveStack spacing={{ base: '10', md: '0' }} pt={{ base: '100px', md: '0' }} w='full' px="4%" alignItems={{ base: 'flex-start', md: 'center' }}>
            <VStack w={{ base: 'full', md: '50%' }} alignItems={'flex-start'}>
              <LandingHeading as="h1" fontSize={{ base: '30px', 'md': '64px' }} fontWeight="bold">
                Explore Our Growing Partner Ecosystem
              </LandingHeading>
              <GeistText fontSize={{ base: '16px', 'md': '20px' }}>
                Backed by the biggest protocols and organizations.  A credit framework for all your blockchain activities.
              </GeistText>
              <LandingNoisedBtn mt="10">
                Become Our Partner
              </LandingNoisedBtn>
            </VStack>
            <VStack maxH={{ base: '200px', md: 'unset' }} borderRadius="6px" overflow="hidden" w={{ base: 'full', md: '50%' }}>
              <VStack bgImage="/assets/landing/anim_bg.png" bgSize="cover" bgRepeat="no-repeat" bgPosition="center" height="80vh" width="100%">
                <LandingAnimation boxProps={{ transform: isAnimNeedStretch ? `translateY(${(animStrechFactor) / 2 * 100}%) scale3d(1, ${1 + animStrechFactor}, 1)` : 'none' }} loop={true} height={windowSize} width={windowSize} />
              </VStack>
            </VStack>
          </ResponsiveStack>
        </VStack>
        {/* below fold */}
        {/* truested by the best banner section  */}

      </VStack>
    </Layout>
  )
}

export default EcosystemPage;
