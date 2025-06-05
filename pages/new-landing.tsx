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
const yes = <CheckCircleIcon color="#68CF1A" />;
const no = <VStack borderRadius="full" bgColor="gray"><SmallCloseIcon color="white" /></VStack>;

const compareData = [
  ["Features", "Interest rate stability", "Collateral protection", "Looping / leverage", "Borrow against LP tokens", "Points program"],
  [firmLogo, "Fixed", "Collateral is never loaned to others", "Up to x10 looping", true, "Continue earning partner points"],
  ["Aave", "Variable", "Collateral is loaned to others", "Limited", false, "Surrender earning partner points"],
]

const animWidthToHeightRatio = 1.78;

export const Landing = ({
  currentCirculatingSupply,
  dbrPriceUsd,
  firmTotalTvl,
  invPrice,
  dolaPrice,
  apy,
  projectedApy,
  dolaVolume,
  totalDebt,
  sDolaTvl,
}: {
  currentCirculatingSupply: number,
  dbrPriceUsd: number,
  firmTotalTvl: number,
  dolaPrice: number,
  invPrice: number,
  dolaVolume: number,
  apy: number,
  projectedApy: number,
  totalDebt: number,
  sDolaTvl: number,
}) => {
  const [windowSize, setWindowSize] = useState(0);
  const [isAnimNeedStretch, setIsAnimNeedStretch] = useState(true);
  const [animStrechFactor, setAnimStrechFactor] = useState(1);

  useEffect(() => {
    const handleResize = () => {
      setWindowSize(Math.max(window.innerWidth, window.innerHeight));
      const ratio = window.innerWidth / window.innerHeight;
      setIsAnimNeedStretch(ratio < animWidthToHeightRatio);
      setAnimStrechFactor(animWidthToHeightRatio - ratio);

      const sectionFirm1 = document.getElementById('section-firm-1')
      const sectionFirm2 = document.getElementById('section-firm-2')
      const firmHeight = sectionFirm2?.clientHeight
      if (sectionFirm1 && firmHeight) {
        sectionFirm1.style.height = `${firmHeight}px`
      }

      const sectionSdola1 = document.getElementById('section-sdola-1')
      const sectionSdola2 = document.getElementById('section-sdola-2')
      const sdolaHeight = sectionSdola1?.clientHeight
      if (sectionSdola2 && sdolaHeight) {
        if (window.innerWidth > 768) {
          sectionSdola2.style.height = `${sdolaHeight}px`
        } else {
          sectionSdola2.style.height = 'auto'
        }
      }

      const sectionSafety1 = document.getElementById('section-safety-1')
      const sectionSafety2 = document.getElementById('section-safety-2')
      const safetyHeight = sectionSafety1?.clientHeight
      if (sectionSafety1 && safetyHeight) {
        sectionSafety2.style.height = `${safetyHeight}px`
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const stats = [
    {
      name: 'sDOLA APY',
      value: `${shortenNumber(apy, 2, false)}%`,
    },
    {
      name: 'TVL',
      value: firmTotalTvl ? shortenNumber(firmTotalTvl, 2, true) : '-',
    },
    {
      name: 'DOLA Circulation',
      value: shortenNumber(currentCirculatingSupply, 2, true),
    },
    {
      name: 'FiRM Borrows',
      value: shortenNumber(totalDebt, 2, true),
    },
    // {
    //   name: 'DOLA 24h Vol.',
    //   value: dolaVolume,
    // },
    // {
    //   name: 'INV price',
    //   value: invPrice,
    // },
    // {
    //   name: 'DBR price',
    //   value: dbrPriceUsd ? dbrPriceUsd : '-',
    // },
  ];

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
        <VStack h='100vh' w='full' alignItems="center" justifyContent="center">
          <VStack bgImage="/assets/landing/anim_bg.png" bgSize="cover" bgRepeat="no-repeat" bgPosition="center" zIndex="-1" position="fixed" top="0" left="0" height="100vh" width="100%">
            <LandingAnimation boxProps={{ transform: isAnimNeedStretch ? `translateY(${(animStrechFactor) / 2 * 100}%) scale3d(1, ${1 + animStrechFactor}, 1)` : 'none' }} loop={true} height={windowSize} width={windowSize} />
          </VStack>
          <VStack position="fixed" zIndex="99999" top="0" maxW="2000px" w='full' px={{ base: 0, md: '4%' }} py={{ base: 0, md: '5' }} alignItems="center">
            <FloatingNav />
          </VStack>
          <VStack maxW="90%" w='full' alignItems="center" pt="50px">
            <VStack pt="8" spacing="8" w='full' alignItems="center">
              <VStack spacing="0" w='full' alignItems={{ base: 'flex-start', 'md': 'center' }}>
                <LandingHeading textAlign={{ base: 'flex-start', 'md': 'center' }} whiteSpace="pre-line" as="h1" fontSize={{ base: '30px', 'md': '5xl' }} fontWeight="bold">
                  Fixed Rates,
                  <br />
                  Unfixed <span className="landing-gradient-text">Potential</span>
                </LandingHeading>
              </VStack>
              <GeistText as="h2" fontSize="xl">
                Stack your leverage with locked rates and multiply your returns - all in one click
              </GeistText>
            </VStack>
            <VStack w='full' alignItems={{ base: 'flex-start', md: 'center' }} pt="2%" pb="5%">
              <LandingNoisedBtn btnProps={{ href: "/firm" }}>
                Launch App <Image ml="2" src="/assets/landing/rocket.svg" w="20px" h="20px" />
              </LandingNoisedBtn>
              <LandingCard bg="linear-gradient(to bottom, rgba(255, 255, 255, 1) 0%, rgba(250, 250, 250, 0.8) 2%, rgba(255, 255, 255, 1) 98%, rgba(0, 0, 0, 0.05) 100%)" borderRadius='4px' boxShadow="unset" mt="12" w="full" maxW="800px">
                <SimpleGrid columns={{ base: 2, md: 4 }} gap="2" w="full">
                  {
                    stats.map((stat) => (
                      <LandingStat key={stat.name} {...stat} />
                    ))
                  }
                </SimpleGrid>
              </LandingCard>
            </VStack>
          </VStack>
        </VStack>
        {/* below fold */}
        {/* truested by the best banner section  */}
        <VStack w='full' bg="linear-gradient(to bottom, rgba(255, 255, 255, 0) 0%, rgba(255, 255, 255, 1) 80%);" pt="100px">
          <LandingHeading textAlign="center" whiteSpace="pre-line" as="h1" fontSize="3xl" fontWeight="bold">
            Trusted by the Best
          </LandingHeading>
          <GeistText fontSize="md" textAlign="center">
            Inverse Finance is trusted by top DeFi protocols
          </GeistText>
        </VStack>
        <VStack w='full' bg="white" py="20">
          <EcosystemBanner />
        </VStack>
        {/* Lock in. Dream Bigger. section  */}
        <VStack alignItems="flex-start" bgColor={landingYellowColor} w='full' py={{ base: 4, md: 8 }} px={{ base: 5, md: 10 }}>
          <LandingHeading textAlign="flex-start" fontSize={{ base: '24px', 'md': '5xl' }} fontWeight="extrabold">
            Lock in. Dream Bigger.
          </LandingHeading>
        </VStack>
        <ResponsiveStack direction={{ base: 'column-reverse', md: 'row' }} borderBottom={`1px solid ${landingLightBorderColor}`} spacing="0" bgColor="white" w='full' alignItems="flex-start">
          {/* section-firm-1 */}
          <VStack maxHeight={{ base: '400px', md: 'unset' }} id="section-firm-1" w={{ base: 'full', md: '50%' }} bgImage="/assets/landing/firm-ui-sample-clean.png" bgSize="cover" bgRepeat="no-repeat" bgPosition={{ base: 'center', '2xl': '0 20%' }} h="476px">
          </VStack>
          {/* section-firm-2 */}
          <VStack id="section-firm-2" alignItems="flex-start" spacing="0" w={{ base: 'full', md: '50%' }} px="0" py="0">
            <VStack alignItems="flex-start" spacing="0">
              <VStack px={{ base: 4, md: 8 }} pt="4" alignItems="flex-start" spacing="4">
                <HStack border={`1px solid ${landingPurple}`} px="4" py="2" alignItems="center" borderRadius="20px" gap="2" bgColor={landingPurpleBg}>
                  <Image src="/assets/landing/safeguarded.png" alt="Safeguarded" w="14px" h="14px" />
                  <GeistText color={landingPurpleText} fontSize="md">
                    Safeguarded with on-chain monitoring
                  </GeistText>
                </HStack>
                <GeistText fontSize="md">
                  Whether it's longing ETH, looping LP tokens, or just borrowing at size, break free from the drag of unpredictable interest rates
                </GeistText>
                <VStack py="4">
                  <HStack spacing="8">
                    <LandingBtn href="/firm">
                      Try It Out Now
                    </LandingBtn>
                    <LandingLink whiteSpace="nowrap" href="https://docs.inverse.finance">
                      Read Docs <ArrowForwardIcon />
                    </LandingLink>
                  </HStack>
                </VStack>
              </VStack>
              <ResponsiveStack alignItems="center" justifyContent="space-evenly" borderTop={`1px solid ${landingLightBorderColor}`} w="full">
                <LandingStatBasicBig py="30px" borderRight={{ base: 'none', md: `1px solid ${landingLightBorderColor}` }} value={shortenNumber(firmTotalTvl, 2, true)} name="TVL" />
                <LandingStatBasicBig py="30px" borderTop={{ base: `1px solid ${landingLightBorderColor}`, md: 'none' }} value={`${shortenNumber(dbrPriceUsd * 100, 2, false)}%`} name="Fixed Rate" />
              </ResponsiveStack>
              <ResponsiveStack py="4" px={{ base: 4, md: 8 }} alignItems="flex-start" borderTop={`1px solid ${landingLightBorderColor}`} w="full">
                <Image mt={{ base: 0, md: 1 }} src="/assets/landing/one-click.png" alt="One-Click Hyperleverage" w="30px" h="30px" />
                <VStack pl={{ base: 0, md: 2 }} alignItems="flex-start">
                  <LandingHeading>
                    One-Click Hyperleverage
                  </LandingHeading>
                  <GeistText>
                    Turbocharge yield-bearing assets while keeping full control of your collateral—never loaned out, always yours.
                  </GeistText>
                </VStack>
              </ResponsiveStack>
            </VStack>
          </VStack>
        </ResponsiveStack>
        {/* Compare section  */}
        <VStack w='full' bg="white" py="20">
          <VStack alignItems="center" position="relative" pb="40px">
            <LandingHeading color={landingPurpleText} textAlign="center" fontSize="4xl" fontWeight="bold">
              Compare FiRM
            </LandingHeading>
            <VStack zIndex="1" top="20px" h="40px" position="absolute" w="full" bg="linear-gradient(to bottom, rgba(255, 255, 255, 0) 10%, rgba(255, 255, 255, 1) 100%)">
              &nbsp;
            </VStack>
          </VStack>
          <LandingCard px={{ base: 0, md: 8 }} position="relative" w='1000px' maxW="94vw" display="flex" flexDirection="row" gap="0">
            <VStack boxShadow="0 0px 4px 2px gold" zIndex="0" height="105%" bgColor="white" position="absolute" top="-10px" left="33%" w="33%" spacing="0" key={0} alignItems="flex-start">
              &nbsp;
            </VStack>
            {
              compareData.map((col, i) => {
                const firstCol = i === 0;
                return <VStack w={firstCol ? "33%" : "33%"} spacing="0" key={i} alignItems={firstCol ? "flex-start" : "center"}>
                  {
                    col.map((cell, j) => {
                      const isFirstCell = j === 0;
                      const isText = typeof cell === 'string';
                      const isBoolean = typeof cell === 'boolean';
                      return <VStack alignItems={firstCol ? "flex-start" : "center"} justifyContent="center" h="70px" position="relative" textAlign={firstCol ? "left" : "center"} py="4" w='full' borderTop={isFirstCell ? "none" : "1px solid #E3E3E3"} key={j}>
                        {
                          isText || isBoolean ?
                            <GeistText px={{ base: 4, md: 'unset' }} fontSize={{ base: '13px', md: '16px' }} textAlign={firstCol ? "left" : "center"} fontWeight={firstCol || isFirstCell ? "bold" : "normal"} key={j}>
                              {isBoolean ? (cell ? yes : no) : cell}
                            </GeistText>
                            :
                            cell
                        }
                        {!isText && !isBoolean && <GeistText>&nbsp;</GeistText>}
                      </VStack>
                    })
                  }
                </VStack>
              })
            }
          </LandingCard>
        </VStack>
        {/* sDOLA section  */}
        <VStack alignItems="flex-start" bgColor={landingGreenColor} w='full' py={{ base: 4, md: 8 }} px={{ base: 5, md: 10 }}>
          <LandingHeading textAlign="flex-start" fontSize={{ base: '24px', 'md': '5xl' }} fontWeight="extrabold">
            Save Different: sDOLA
          </LandingHeading>
        </VStack>
        <VStack bgColor="white" py="4" px="5%" w="full" alignItems="center" justify="center" minH={{ base: 'unset', lg: '95vh' }} position="relative">
          <video poster="/assets/landing/video_poster.png"
            preload="metadata"
            width="100%"
            height="auto"
            style={{ zIndex: 10, maxWidth: '98%' }}
            // width="600"
            // height="300"
            controls
            webkit-playsinline
            playsInline
          >
            <source src="sDOLA.mp4" type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        </VStack>
        {/* sDOLA sub-section  */}
        <ResponsiveStack px={{ base: 0, md: '5%' }} borderTop={`1px solid ${landingLightBorderColor}`} spacing="0" bgColor="white" w='full' alignItems="flex-start">
          {/* section-firm-2 */}
          <ResponsiveStack id="section-sdola-1" borderLeft="0px solid #B6B6B6" alignItems="flex-start" spacing="0" w='100%' px="0" py="0">
            <ResponsiveStack w='full' alignItems="center" spacing="0">
              <VStack w={{ base: 'full', md: '50%' }} px="8" py="8" alignItems="flex-start" spacing="4">
                <HStack border={`1px solid ${landingPurple}`} px="4" py="2" alignItems="center" borderRadius="20px" gap="2" bgColor={landingPurpleBg}>
                  <Image src="/assets/landing/safeguarded.png" alt="Safeguarded" w="14px" h="14px" />
                  <GeistText color={landingPurpleText} fontSize="md">
                    100% Organic Yield
                  </GeistText>
                </HStack>
                <GeistText fontSize="md">
                  DOLA enables some of the most attractive yield opportunities in DeFi. Now, sDOLA takes it further—a yield-bearing stablecoin born from our FiRM lending market, delivering pure, uncut DeFi returns fueled by real activity, not centralized compromises.
                </GeistText>
                <LandingNoisedBtn btnProps={{ href: "/sDOLA", maxH: '50px' }}>
                  Get Started <ArrowForwardIcon ml="2" />
                </LandingNoisedBtn>
              </VStack>
              <ResponsiveStack maxHeight={{ base: '400px', md: 'unset' }} id="section-sdola-2" borderTop={{ base: `1px solid ${landingLightBorderColor}`, md: 'none' }} w={{ base: 'full', md: '50%' }} alignItems="center" justifyContent="space-evenly">
                <LandingStatBasicBig justifyContent="center" maxHeight={{ base: '200px', md: 'unset' }} alignItems="center" py={{ base: 4, md: 8 }} h={{ base: 'auto', md: '100%' }} borderLeft={{ base: 'none', md: `1px solid ${landingLightBorderColor}` }} borderRight={{ base: 'none', md: `1px solid ${landingLightBorderColor}` }} value={shortenNumber(sDolaTvl, 2, true)} name="sDOLA TVL" />
                <LandingStatBasicBig justifyContent="center" maxHeight={{ base: '200px', md: 'unset' }} alignItems="center" py={{ base: 4, md: 8 }} h={{ base: 'auto', md: '100%' }} borderTop={{ base: `1px solid ${landingLightBorderColor}`, md: 'none' }} value={`${shortenNumber(apy, 2, false)}%`} name="sDOLA APY" />
              </ResponsiveStack>
            </ResponsiveStack>
          </ResponsiveStack>

        </ResponsiveStack>
        {/* Safety section  */}
        <VStack bgColor={landingPurple} w='full' py={{ base: 8, md: 20 }} px="5%">
          <ResponsiveStack direction={{ base: 'column', lg: 'row' }} maxW="1300px" position="relative" borderRadius="8px" bgColor={landingDarkNavy2} p="2" w='full' alignItems="flex-start">
            <VStack id="section-safety-1" w={{ base: 'full', lg: '50%' }}>
              <VStack px="6" py="4">
                <LandingHeading color="white" fontSize={{ base: '32px', 'md': '5xl' }}>
                  Our Obsession Is Safety
                </LandingHeading>
                <GeistText color="white">
                  Our obsession with safety includes security innovations like Personal Collateral Escrow accounts, ensuring your collateral is staked and isolated, never loaned out. We designed oracle safety measures to make price manipulation, flash loan, and similar attacks not just difficult, but financially unfeasible.
                </GeistText>
              </VStack>
              <ResponsiveStack spacing="2">
                <VStack alignItems="flex-start" borderRadius="2px" py={{ base: '16px', md: '48px' }} px={{ base: '12px', md: '32px' }} bgColor={"#FFFFFF1F"}>
                  <LandingHeading color="white" fontSize={{ base: '32px', 'md': '5xl' }}>
                    87%
                  </LandingHeading>
                  <LandingHeading color="white" fontSize="xl">
                    Defi Safety Score
                  </LandingHeading>
                  <GeistText color="white">
                    Inverse Finance maintains an elite DeFi Safety Score of 87, built on years of protocol risk and safety experience.
                  </GeistText>
                </VStack>
                <VStack alignItems="flex-start" borderRadius="2px" py={{ base: '16px', md: '48px' }} px={{ base: '12px', md: '32px' }} bgColor={"#FFFFFF1F"}>
                  <LandingHeading color="white" fontSize={{ base: '32px', 'md': '5xl' }}>
                    {shortenNumber(firmTotalTvl, 2, true)}
                  </LandingHeading>
                  <LandingHeading color="white" fontSize="xl">
                    Staked Collateral
                  </LandingHeading>
                  <GeistText color="white">
                    Fortified with rigorous audits and active bug bounty programs from Nomoi, yAudit, Code4rena, ImmuneFi, Peckshield, and others.
                  </GeistText>
                </VStack>
              </ResponsiveStack>
            </VStack>
            <VStack id="section-safety-2" borderRadius="4" w={{ base: 'full', lg: '50%' }} bgColor="white">
              <SimpleGrid border="1px solid white" borderRadius="4" bgColor="white" columns={{ base: 1, md: 2 }} gap={0} w="full" h="full">
                <VStack as="a" target="_blank" w={{ base: 'full' }} h={{ base: '80px', md: '150px' }} bgColor="white" alignItems="center" justify="center">
                  <Image maxW="150px" src="/assets/v2/landing/code4arena.png" alt="code4arena" />
                </VStack>
                <VStack as="a" target="_blank" w={{ base: 'full' }} h={{ base: '80px', md: '150px' }} bgColor="white" alignItems="center" justify="center">
                  <Image maxW="150px" src="/assets/partners/immunefi.svg" alt="immunefi" />
                </VStack>
                <VStack as="a" target="_blank" w={{ base: 'full' }} h={{ base: '80px', md: '150px' }} bgColor="white" alignItems="center" justify="center">
                  <Image maxW="150px" src="/assets/v2/landing/defimoon.png?v2" alt="defimoon" />
                </VStack>
                <VStack as="a" target="_blank" w={{ base: 'full' }} h={{ base: '80px', md: '150px' }} bgColor="white" alignItems="center" justify="center">
                  <Image maxW="150px" src="/assets/v2/landing/peckshield.png" alt="peckshield" />
                </VStack>
                <VStack as="a" target="_blank" w={{ base: 'full' }} h={{ base: '80px', md: '150px' }} bgColor="white" alignItems="center" justify="center">
                  <Image maxW="150px" src="/assets/v2/landing/defisafety.png" alt="defisafety" />
                </VStack>
                <VStack as="a" target="_blank" w={{ base: 'full' }} h={{ base: '80px', md: '150px' }} bgColor="white" alignItems="center" justify="center">
                  <Image maxW="150px" src="/assets/v2/landing/nomoi.png" alt="nomoi" />
                </VStack>
              </SimpleGrid>
            </VStack>
          </ResponsiveStack>
        </VStack>
        <VStack w='full' bg="white" py={{ base: 10, md: 20 }}>
          <LandingHeading textAlign="center" fontSize={{ base: '32px', 'md': '5xl' }} fontWeight="extrabold">
            Alliances Built On Trust
          </LandingHeading>
          <GeistText fontSize="md">
            Top DeFi protocols trust Inverse Finance
          </GeistText>
          <VStack w='full' bg="white" py={{ base: 0, md: 10 }}>
            <EcosystemGrid />
          </VStack>
          <VStack pt={{ base: '5', md: '20' }} spacing="10">
            <LandingHeading textAlign="center" fontSize={{ base: '36px', 'md': '5xl' }} fontWeight="extrabold">
              Ready to Experience Fixed Rates?
            </LandingHeading>
            <ResponsiveStack spacing="10" alignItems="center">
              <LandingNoisedBtn btnProps={{ href: "/firm" }}>
                Get Started Now <Image ml="2" src="/assets/landing/rocket.svg" w="20px" h="20px" />
              </LandingNoisedBtn>
              <LandingLink color={landingMutedColor} fontSize={{ base: '15px', "2xl": '17px' }} href="/ecosystem">
                Or explore our ecosystem
              </LandingLink>
            </ResponsiveStack>
          </VStack>
        </VStack>
      </VStack>
    </Layout>
  )
}

export default Landing;

export async function getServerSideProps(context) {
  context.res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=3600');
  return { ...await getLandingProps(context) }
}
