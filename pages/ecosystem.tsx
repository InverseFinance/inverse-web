import { HStack, Image, Stack, SimpleGrid, StackProps, VStack, useMediaQuery, InputGroup, InputRightElement, CheckboxGroup, Checkbox } from '@chakra-ui/react'
import Layout from '@app/components/common/Layout'
import Head from 'next/head'
import { shortenNumber } from '@app/util/markets'
import { getLandingProps } from '@app/blog/lib/utils'
import { ArrowForwardIcon, CheckCircleIcon, ChevronDownIcon, ChevronRightIcon, ExternalLinkIcon, SearchIcon, SmallCloseIcon } from '@chakra-ui/icons'
import { LandingAnimation } from '@app/components/common/Animation/LandingAnimation'
import FloatingNav from '@app/components/common/Navbar/FloatingNav'
import { EcosystemBanner, ecosystemData, EcosystemGrid } from '@app/components/Landing/EcosystemBanner'
import Link from '@app/components/common/Link'
import { useEffect, useMemo, useState } from 'react'
import FirmLogo from '@app/components/common/Logo/FirmLogo'
import { GeistText, LandingBtn, LandingCard, landingDarkNavy2, landingGreenColor, LandingHeading, landingLightBorderColor, LandingLink, landingMainColor, landingMutedColor, LandingNoisedBtn, landingPurple, landingPurpleBg, landingPurpleText, LandingStat, LandingStatBasic, LandingStatBasicBig, landingYellowColor } from '@app/components/common/Landing/LandingComponents'
import { SimpleCard } from '@app/components/common/Cards/Simple'
import { Input } from '@app/components/common/Input'

const ResponsiveStack = (props: StackProps) => <Stack direction={{ base: 'column', md: 'row' }} justify="space-between" {...props} />

const firmLogo = <FirmLogo transform="translateY(12px)" position="absolute" top="0" w="65px" h="30px" theme="light" />;

const animWidthToHeightRatio = 1.78;

const bluePastel = "#ebecf7";

const MiniCard = ({ children, ...props }: { children: React.ReactNode, props: any }) => {
  return <SimpleCard boxShadow="none" border="1px solid #e3e3e3" borderRadius="4px" {...props}>
    {children}
  </SimpleCard>
}

const uniqueCategories = ecosystemData.reduce((acc, item) => {
  if (!acc.includes(item.category)) {
    acc.push(item.category);
  }
  return acc;
}, []);

export const EcosystemPage = ({
}: {
  }) => {
  const isSmallerThan = useMediaQuery('(max-width: 768px)');
  const [windowSize, setWindowSize] = useState(0);
  const [isAnimNeedStretch, setIsAnimNeedStretch] = useState(true);
  const [animStrechFactor, setAnimStrechFactor] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  // for mobile only
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setWindowSize(Math.max(window.innerWidth, window.innerHeight) / 2);
      const ratio = window.innerWidth / window.innerHeight;
      setIsAnimNeedStretch(true);
      setAnimStrechFactor((animWidthToHeightRatio - ratio) + 1);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const filteredEcosystemData = useMemo(() => {
    return ecosystemData
      .filter((item) => (!categories.length || categories.includes(item.category)))
      .filter((item) => (!searchTerm || item.label.toLowerCase().includes(searchTerm.toLowerCase())))
      .map(item => {
        return { ...item, categories: item.categories || [item.category] }
      })
  }, [categories, searchTerm]);

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
        <VStack bgColor={bluePastel} h='calc(100vh - 130px)' w='full' alignItems="flex-start" justifyContent={{ base: 'flex-start', md: 'center' }}>
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
              <Link href="mailto:hello@inverse.finance?subject=Partner%20Inquiry&body=Hello%2C%0A%0AI%20am%20interested%20in%20becoming%20a%20partner%20with%20Inverse%20Finance." isExternal>
                <LandingNoisedBtn mt="10">
                  Become Our Partner
                </LandingNoisedBtn>
              </Link>
            </VStack>
            <VStack maxH={{ base: '200px', md: 'unset' }} borderRadius="6px" overflow="hidden" w={{ base: 'full', md: '50%' }}>
              <VStack bgImage="/assets/landing/anim_bg.png" bgSize="cover" bgRepeat="no-repeat" bgPosition="center" height="80vh" width="100%">
                <LandingAnimation boxProps={{ transform: isAnimNeedStretch ? `translateY(${(animStrechFactor) / 2 * 100}%) scale3d(1, ${1 + animStrechFactor}, 1)` : 'none' }} loop={true} height={windowSize} width={windowSize} />
              </VStack>
            </VStack>
          </ResponsiveStack>
        </VStack>
        <ResponsiveStack bgColor="white" spacing="1px" w='full' alignItems="flex-start">
          <VStack spacing="8" alignItems="center" w={{ base: 'full', md: '25%' }} bgColor="white" py="4" px="6" borderRadius="0">
            <VStack spacing="4" w='full' alignItems="flex-end">
              <HStack justifyContent="space-between" w='full'>
                <GeistText fontSize="14px" color={landingMutedColor}>
                  Filters
                </GeistText>
                <VStack w="50%" h="1px" bgColor={landingLightBorderColor} ></VStack>
                <GeistText opacity={categories.length > 0 || !!searchTerm ? 1 : 0.8} fontSize="14px" color={landingPurpleText} cursor="pointer" onClick={() => {
                  setCategories([])
                  setSearchTerm('')
                }}>
                  Clear all
                </GeistText>
              </HStack>
              <InputGroup alignItems="center" maxH="48px" w='full'>
                <Input py="0" maxH="48px" fontSize="16px" bgColor="transparent" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search a project" textAlign="left" type="text" borderRadius="2px" border={`1px solid ${landingLightBorderColor}`} />
                <InputRightElement
                  pointerEvents='none'
                  children={<SearchIcon color='gray.300' />}
                />
              </InputGroup>
            </VStack>
            <VStack alignItems="flex-start" w='full'>
              <HStack spacing="4" w='full' alignItems="center" justifyContent="space-between">
                <GeistText fontSize="14px" color={landingMutedColor}>
                  Partner Category
                </GeistText>
                {
                  isSmallerThan ? <HStack cursor="pointer" onClick={() => setIsFiltersOpen(!isFiltersOpen)}>
                    {isFiltersOpen ? <ChevronDownIcon /> : <ChevronRightIcon />}
                  </HStack> : <VStack w="50%" h="1px" bgColor={landingLightBorderColor} ></VStack>
                }
              </HStack>
              <VStack alignItems="flex-start" w='full' display={isFiltersOpen ? 'flex' : 'none'}>
                <CheckboxGroup colorScheme='blue' defaultValue={[]} value={categories} onChange={setCategories}>
                  <VStack alignItems="flex-start" w='full' spacing="0" justifyContent="center">
                    {
                      uniqueCategories?.map((category) => {
                        return <Checkbox px="4" py="4" w='full' borderBottom="1px solid #e3e3e3" key={category} value={category}>
                          <GeistText textTransform="capitalize" fontSize="14px" color={landingMutedColor}>
                            {category.toLowerCase()}
                          </GeistText>
                        </Checkbox>
                      })
                    }
                  </VStack>
                </CheckboxGroup>
              </VStack>
            </VStack>
          </VStack>
          <VStack w={{ base: 'full', md: '75%' }} borderLeft={{ base: 'none', md: `1px solid ${landingLightBorderColor}` }}>
            <SimpleGrid columns={{ base: 1, md: 3, '2xl': 4 }} spacing="1px" bgColor={landingLightBorderColor}>
              {
                filteredEcosystemData.map((item, i) => {
                  return <Link flexDirection="column" display="flex" isExternal href={item.href} target="_blank" cursor="pointer" className="ecosystem-partner-card" position="relative" _hover={{ bgColor: landingLightBorderColor }} spacing="4" alignItems="flex-start" justifyContent="space-between" bgColor={"white"} p="4" borderRadius="0">
                    <VStack alignItems="flex-start" justifyContent="space-between" w='full'>
                      <VStack spacing="0">
                        <MiniCard p="4" bgColor="white">
                          <Image w="auto" h="40px" src={item.image} alt={item.label} />
                        </MiniCard>
                        <VStack display="none" className="ecosystem-partner-card-link" zIndex="1" cursor="pointer" position="absolute" top="4" right="4" alignItems="center" justifyContent="center" isExternal href={item.url} target="_blank" borderRadius="2px" w='30px' h="30px" bgColor={landingPurpleText}>
                          <ArrowForwardIcon transform="rotate(-45deg)" color={'white'} />
                        </VStack>
                      </VStack>
                      <LandingHeading fontSize="16px" fontWeight="bold">{item.label}</LandingHeading>
                      <GeistText fontSize="14px" color={landingMutedColor}>
                        {item.description}
                      </GeistText>
                    </VStack>
                    <HStack spacing="4">
                      {
                        item.categories?.map((category) => {
                          return <MiniCard bgColor="white" w="fit-content" h="auto" px="2" py="1">
                            <GeistText textTransform="capitalize" fontSize="14px" color={landingMutedColor}>
                              {category.toLowerCase()}
                            </GeistText>
                          </MiniCard>
                        })
                      }
                    </HStack>
                  </Link>
                })
              }
            </SimpleGrid>
          </VStack>
        </ResponsiveStack>
        {/* below fold */}
        {/* truested by the best banner section  */}

      </VStack>
    </Layout>
  )
}

export default EcosystemPage;
