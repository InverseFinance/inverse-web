import { VStack, Text, Stack, SimpleGrid, Image, HStack, Flex } from '@chakra-ui/react'
import { ErrorBoundary } from '@app/components/common/ErrorBoundary'
import Layout from '@app/components/common/Layout'
import { AppNav } from '@app/components/common/Navbar'
import Head from 'next/head'
import { DashBoardCard } from '@app/components/F2/UserDashboard'
import { RSubmitButton } from '@app/components/common/Button/RSubmitButton'
import { lightTheme } from '@app/variables/theme'
import Link from '@app/components/common/Link'
import { ArrowForwardIcon, ExternalLinkIcon } from '@chakra-ui/icons'

export const individualInputs = [
    { text: 'X (Twitter)', key: 'x' },
    { text: 'Instagram', key: 'instagram' },
    { text: 'Telegram', key: 'telegram' },
    { text: 'Discord', key: 'discord' },
    { text: 'Youtube', key: 'youtube' },
    { text: 'TikTok', key: 'tiktok' },
    { text: 'Facebook', key: 'facebook' },
    { text: 'Other', key: 'other' },
];

export const businessChecks = [
    { text: 'Crypto media platform', key: 'crypto-media' },
    { text: 'Crypto Fund', key: 'crypto-fund' },
    { text: 'DEX', key: 'dex' },
    { text: 'Yield Aggregator', key: 'yield' },
    { text: 'Other', key: 'other-business' },
];

const mainColor = "#252627";
const cardBg = "#323334";
const cardBorder = "#57595C";
const whitish = "#FFFCF9";
const lightish = "#D9D9D9";
const grayColor = "#7C7F83";

const DarkCard = (props) => <DashBoardCard position="relative" p="0" gap="8" direction="column" color={whitish} bgColor={cardBg} border={`1px solid ${cardBorder}`} {...props} />
const GrayCard = (props) => <DashBoardCard position="relative" p="0" gap="8" direction="column" color={whitish} bgColor={grayColor} border={`1px solid ${'#A4A6A8'}`} {...props} />

const MainTitle = (props) => <Text fontWeight="extrabold" fontSize={{ base: '28px', sm: '6vw', 'xl': '80px' }} color={mainColor} {...props} />
const BigTitle = (props) => <Text fontWeight="extrabold" fontSize="48px" color={mainColor} {...props} />
const Title = (props) => <Text fontWeight="bold" fontSize="20px" color={mainColor} {...props} />
const SimpleText = (props) => <Text color={mainColor} {...props} />

const OrangeBubble = (props) => <VStack transform="rotate(-5deg)" borderRadius="120px" lineHeight="normal" p="8" fontSize={{ base: "18px", lg: "34px" }} border="8px solid white" bgColor="secAccentTextColor" {...props} />

const RegisterBtn = (props) => <RSubmitButton target="_blank" href="/affiliate/register" _hover={{ bgColor: lightTheme.colors.secAccentTextColor, color: lightTheme.colors.mainTextColor }} fontSize={{ base: '16px', lg: '18px' }} w='fit-content' color={whitish} bgColor={lightTheme.colors.mainTextColor} p={{ base: 6, lg: 8 }}>
    Become an Affiliate
</RSubmitButton>

const SectionOne = () => <VStack maxW="1300px" w="100%" alignItems="flex-start" position="relative" p={{ base: 8, lg: 20 }} borderRadius="50px" bgImage="/assets/affiliate/bg1.png" bgRepeat="no-repeat" bgSize="cover">
    <VStack alignItems="flex-start">
        <Stack direction={{ base: 'column', sm: 'row' }} w='full' justify="flex-start" spacing={{ base: "0px", sm: '20px', lg: "40px" }}>
            <HStack spacing={{ base: "15px", sm: '20px', lg: "40px" }}>
                <MainTitle>
                    Become a
                </MainTitle>
                <Image src="/assets/firm/firm-big.png" alt="FiRM" minW='60px' maxW='330px' w={{ base: '30%', sm: '100px', md: '20vw' }} />
            </HStack>
            <MainTitle>
                Affiliate
            </MainTitle>
        </Stack>
    </VStack>
    <Stack direction={{ base: 'column', md: 'row' }} pt={{ base: '30px', lg: '75px' }} pb={{ base: '0px', lg: '80px' }}>
        <VStack w={{ base: 'full', md: '50%' }} alignItems="flex-start">
            <Title fontWeight="bold">
                Ready to join the fixed-rate DeFi lending rebellion and start earning serious commissions?
            </Title>
            <SimpleText>
                As a FiRM Affiliate, you'll have the opportunity to earn a whopping 10% of the DBR spent by borrowers you refer. That's right, you'll be making money while helping to spread the word about the incredible potential of FiRM!
            </SimpleText>
            <VStack pt={{ base: 8, lg: '20' }} pb={{ base: 0, sm: 10, lg: 0 }}>
                <RegisterBtn />
            </VStack>
        </VStack>
        <VStack right={{ base: '-40%', md: '-42px' }} bottom="0" position={{ base: 'relative', md: 'absolute' }}>
            <OrangeBubble transform={{ base: "translate3D(-90px, 40px, 0) rotate(-5deg)", 'xl': 'translate3D(-200px, 40px, 0) rotate(-5deg)' }}>
                <VStack alignItems="flex-start" w='full'>
                    <Text color={mainColor}>Earn <b>10%</b> Commissions</Text>
                    <Text color={mainColor}>By Promoting <b>FiRM</b></Text>
                </VStack>
            </OrangeBubble>
            <Image zIndex="1" src="/assets/affiliate/megaphone.png" minW='200px' w="29.5vw" maxW='475px' />
        </VStack>
    </Stack>
</VStack>

const INFOitem = <Text fontWeight="extrabold" textOverflow="clip" color={whitish} fontSize={{ base: '30px', lg: '68px' }}>INFO</Text>

const InfoBar = () => <VStack zIndex="2" overflow="hidden" transform="translateY(-40px) rotate(1deg)" bgColor={lightTheme.colors.accentTextColor} w='110%'>
    <HStack spacing="20">
        {INFOitem}{INFOitem}{INFOitem}{INFOitem}{INFOitem}{INFOitem}{INFOitem}{INFOitem}{INFOitem}{INFOitem}{INFOitem}{INFOitem}{INFOitem}
    </HStack>
</VStack>

const FAQitem = <Text fontWeight="extrabold" textOverflow="clip" color={whitish} fontSize={{ base: '30px', lg: '68px' }}>FAQ</Text>

const FaqBar = () => <VStack zIndex="2" overflow="hidden" transform="translateY(-40px) rotate(-2deg)" bgColor={lightTheme.colors.accentTextColor} w='110%'>
    <HStack spacing="20">
        {FAQitem}{FAQitem}{FAQitem}{FAQitem}{FAQitem}{FAQitem}{FAQitem}{FAQitem}{FAQitem}{FAQitem}{FAQitem}{FAQitem}{FAQitem}
    </HStack>
</VStack>

const HowDoesItWorkSection = () => <VStack spacing="0" transform="translateY(-70px)" w='full' alignItems="center" position="relative" px={{ base: 8, lg: 20 }} py="20" bgColor={mainColor}>
    <Image display={{ base: 'none', sm: 'block' }} src="/assets/affiliate/graffiti2.svg" right="0" w="300px" position="absolute" className="graffiti-bg" />
    <VStack spacing={{ base: 10, lg: 20 }} maxW='1307px' alignItems="center" justify="center" w='full'>
        <Stack w='full' pl={{ base: 0, lg: '20%' }} spacing="8" color={whitish} direction={{ base: 'column', lg: 'row' }} alignItems={{ base: 'flex-start', lg: 'flex-end' }}>
            <VStack className="graffiti-1" spacing="0" alignItems="flex-start">
                <BigTitle whiteSpace="nowrap" color={whitish} textTransform="uppercase">How does</BigTitle>
                <BigTitle color={whitish} textTransform="uppercase">it <b className="splash-orange-circled">work</b>?</BigTitle>
            </VStack>
            <Title ml={{ base: 0, lg: 8 }} transform="translateY(-11px)" color={whitish} borderBottom={`1px solid ${lightTheme.colors.secAccentTextColor}`}>
                It's quite simple
            </Title>
        </Stack>
        <SimpleGrid gap="8" columns={{ base: 1, xl: 3 }} maxW={{ base: '400px', xl: 'full' }}>
            <DarkCard alignItems="flex-start">
                <Text px="8" pt="8" color={whitish}>
                    <b style={{ color: lightTheme.colors.secAccentTextColor }}>Fill out the application form below to become a FiRM Affiliate</b>. Our team will review your application to ensure you meet the criteria.
                </Text>
                <Link _hover={{ color: lightTheme.colors.secAccentTextColor }} href="/affiliate/register" isExternal target="_blank" textDecoration="underline" px="8" mb="140px" color={lightTheme.colors.secAccentTextColor}>
                    Application Form <ExternalLinkIcon color={lightTheme.colors.secAccentTextColor} />
                </Link>
                <Image right="0" position="absolute" bottom="0" src="/assets/affiliate/step1.png" w="100px" />
            </DarkCard>
            <DarkCard overflow="hidden">
                <Text mb="140px" p="8" color={whitish}>
                    Once approved, create and share your unique Affiliate link with your audiences. <b style={{ color: lightTheme.colors.secAccentTextColor }}>Promote FIRM to your audiences</b> as much or as little as you like.
                </Text>
                <Image transform="translate3d(-47px, 30px, 0)" position="absolute" bottom="0" src="/assets/affiliate/step2.png" w="90%" />
            </DarkCard>
            <DarkCard>
                <Text mb="140px" p="8" color={whitish}>
                    <b style={{ color: lightTheme.colors.secAccentTextColor }}>Sit back and earn!</b> As the borrowers you refer spend DBR on new DOLA loans, you'll receive 10% of their spent DBR.
                </Text>
                <Image position="absolute" left="0" bottom="0" src="/assets/affiliate/step3.png" w="75%" />
            </DarkCard>
        </SimpleGrid>
    </VStack>
</VStack>

const WhoIsEligibleSection = () => <VStack spacing="0" transform="translateY(-70px)" w='full' alignItems="center" position="relative" px={{ base: 8, md: 20 }} py="20" bgColor={mainColor}>
    <Image display={{ base: 'none', sm: 'block' }} src="/assets/affiliate/graffiti3.svg" top="-200px" left="0" w="300px" position="absolute" className="graffiti-bg" />
    <Image display={{ base: 'none', sm: 'block' }} src="/assets/affiliate/graffiti4.png" top="-100px" right="0" w="300px" position="absolute" className="graffiti-bg" />
    <Image display={{ base: 'none', sm: 'block' }} src="/assets/affiliate/graffiti5.svg" bottom="150px" left="0" w="300px" position="absolute" className="graffiti-bg" />
    <Image display={{ base: 'none', sm: 'block' }} src="/assets/affiliate/graffiti6.svg" bottom="250px" left="0" w="300px" position="absolute" className="graffiti-bg" />
    <VStack spacing="8" maxW='1307px' w='full'>
        <Stack w='full' pl={{ base: 0, lg: '20%' }} spacing={{ base: '20', md: '8' }} color={whitish} direction={{ base: 'column', md: 'row' }} alignItems={{ base: 'center', md: 'flex-end' }}>
            <VStack className="graffiti-1-reverse" spacing="0" alignItems={{ base: 'center', md: 'flex-start' }}>
                <BigTitle whiteSpace="nowrap" color={whitish} textTransform="uppercase">Who is</BigTitle>
                <BigTitle color={whitish} textTransform="uppercase" className="splash-orange-circled">eligible?</BigTitle>
            </VStack>
            <VStack alignItems="center" w={{ base: 'full' }}>
                <VStack w="345px" alignItems="center">
                    <GrayCard>
                        <Image position="absolute" bottom="-7px" left="25%" src="/assets/affiliate/persona4.png" h="170px" />
                    </GrayCard>
                    <Text textAlign="justify" p="4" color={whitish} fontSize="16px">
                        The program is brand new and we're initially limiting signups to influencers, community leaders, and others with a sizeable audience, including:
                    </Text>
                </VStack>
            </VStack>
        </Stack>
        <SimpleGrid justifyContent="center" mt="10" gap="8" columns={{ base: 1, xl: 5 }}>
            {
                personas.map((persona, i) => {
                    return <VStack key={i} alignItems={{ base: 'center', xl: 'flex-start' }} position="relative">
                        <GrayCard position="relative" h="200px" w="200px" bgImage={persona.src} bgPosition={persona.bgPosition || 'center'} bgSize={persona.bgSize || '50%'} bgRepeat="no-repeat">
                            &nbsp;
                            {
                                !!persona.badge && <Flex>
                                    <Text width="180px" textAlign="center" left="10px" borderBottomRadius="5px" position="absolute" top="-1px" bgColor={cardBg} whiteSpace="break-spaces" fontWeight="bold" pt="4" pb="2" color={whitish} fontSize="16px">
                                        {persona.badge}
                                    </Text>
                                    <ArrowForwardIcon position="absolute" right={{ base: '0', xl: '-30%' }} left={{ base: '0', xl: 'unset' }} margin="auto" h="200px" top={{ base: 'unset', xl: '0' }} transform={{ base: 'rotate(90deg)', xl: 'unset' }} bottom={{ base: '-133px', xl: '0' }} fontSize="50px" color={grayColor} />
                                </Flex>
                            }
                        </GrayCard>
                        <Text whiteSpace="break-spaces" fontWeight="bold" pt="4" pb="2" color={whitish} fontSize="16px">
                            {persona.title}
                        </Text>
                        {
                            !!persona.subtitle && <Text color={lightish} fontSize="14px">
                                {persona.subtitle}
                            </Text>
                        }
                    </VStack>
                })
            }
        </SimpleGrid>
        <VStack w='full' alignItems="center" py={{ base: 10, lg: 20 }}>
            <Title fontSize={{ base: '30px', lg: '30px' }} p={{ base: 2, lg: 20 }} w={{ base: '90%', lg: '66%' }} textAlign="center" color={whitish}>
                The <b>FiRM</b> <b style={{ color: lightTheme.colors.secAccentTextColor }}>Affiliate Program</b> offers a <b>no-hassle opportunity</b> to <b className="splash-underline">introduce FiRM</b> to your audience while adding to your topline revenue number!
            </Title>
        </VStack>
    </VStack>
</VStack>

const WhatElseSection = () => <VStack spacing="0" transform="translateY(-70px)" spacing="8" w='full' alignItems="center" position="relative" px={{ base: 8, lg: 20 }} pb="20" bgColor={mainColor}>
    <Image display={{ base: 'none', sm: 'block' }} src="/assets/affiliate/graffiti3.svg" top="-200px" right="0" transform="rotate(180deg)" w="300px" position="absolute" className="graffiti-bg" />
    <VStack spacing="8" maxW='1307px' w='full'>
        <Stack spacing="8" direction={{ base: 'column', lg: 'row' }} maxW={{ base: '400px', lg: 'full' }}>
            <DarkCard justifyContent="center" w={{ base: 'full', xl: '40%' }} bgColor={lightTheme.colors.secAccentTextColor} bgImage="url(/assets/affiliate/splash-bowl.png)" bgPosition="0 0" bgSize="75%" bgRepeat="no-repeat">
                <VStack spacing="0" alignItems="flex-start" py="10" px="20">
                    <BigTitle whiteSpace="nowrap" color={mainColor} textTransform="uppercase">what</BigTitle>
                    <BigTitle color={mainColor} textTransform="uppercase" className="splash-circled">else?</BigTitle>
                </VStack>
            </DarkCard>
            <DarkCard w={{ base: 'full', xl: '30%' }}>
                <Text mb="100px" p="8" color={whitish}>
                    When a new borrower uses the dedicated Affiliate URL, the borrower <b>signs a message</b> confirming the referral from an Affiliate's address.
                </Text>
                <Image position="absolute" bottom="-7px" maxW="200px" src="/assets/affiliate/sign.png" w="100%" />
            </DarkCard>
            <DarkCard w={{ base: 'full', xl: '30%' }}>
                <Text mb="100px" p="8" color={whitish}>
                    Affiliates reward activity is viewable via an <b style={{ color: lightTheme.colors.secAccentTextColor }}>Affiliate dashboard</b> and a dedicated Discord channel is available to Affiliates for support.
                </Text>
                <Image position="absolute" bottom="0" src="/assets/affiliate/dashboard.png" w="50%" />
            </DarkCard>
        </Stack>
        <DarkCard maxW={{ base: '400px', lg: 'full' }} p="8">
            <SimpleGrid gap="4" columns={{ base: 1, lg: 2 }}>
                <GrayCard p="8">
                    <Stack alignItems="center" direction={{ base: 'column', lg: 'row' }}>
                        <Image src="/assets/affiliate/calendar.png" w="200px" />
                        <VStack alignItems="flex-start">
                            <Title color={whitish}>Monthly Payments</Title>
                            <Text textAlign="justify" color={whitish}>Payments are sent to the Affiliate wallet address monthly.</Text>
                        </VStack>
                    </Stack>
                </GrayCard>
                <GrayCard p="8">
                    <Stack alignItems="center" direction={{ base: 'column', lg: 'row' }}>
                        <Image src="/assets/affiliate/matrix.png" w="130px" />
                        <VStack pl={{ base: 0, lg: 8 }} alignItems="flex-start">
                            <Title color={whitish}>Eligibility</Title>
                            <Text textAlign="justify" color={whitish}>Affiliates are eligible for reward payments for each borrower they bring to FiRM for up to <b>12 consecutive months</b>.</Text>
                        </VStack>
                    </Stack>
                </GrayCard>
                <GrayCard p="8">
                    <VStack spacing="4">
                        <Image src="/assets/affiliate/progress.png" w="100%" />
                        <VStack alignItems="flex-start" w='full'>
                            <Text textAlign="justify" color={whitish}>For the sake of clarity, the DAO will pay an Affiliate reward for a 12 month DOLA loan from a single borrower, but for a 13 month DOLA loan, the Affiliate payments for that borrower would end after the 12th month. </Text>
                        </VStack>
                    </VStack>
                </GrayCard>
                <GrayCard p="8">
                    <Stack alignItems="center" direction={{ base: 'column', lg: 'row' }}>
                        <Image src="/assets/affiliate/dbr-meter.png" w="140px" transform="translateY(-25px)" />
                        <VStack pl={{ base: 0, lg: 8 }} alignItems="flex-start">
                            <Title color={whitish}>Maximum Pay</Title>
                            <Text textAlign="justify" color={whitish}>The maximum monthly payout to any single Affiliate during the beta test period is <b>200,000 DBR</b>.</Text>
                        </VStack>
                    </Stack>
                </GrayCard>
            </SimpleGrid>
        </DarkCard>
        <Stack maxW={{ base: '400px', lg: 'full' }} spacing="8" direction={{ base: 'column', lg: 'row' }}>
            <DarkCard justifyContent="center" w={{ base: 'full', lg: '50%' }}>
                <Text py="4" px="8" color={whitish}>Referrals made via sybil attacks or other prohibited means may be denied payment.</Text>
            </DarkCard>
        </Stack>
        <DarkCard maxW={{ base: '400px', lg: 'full' }}>
            <Text py="4" px="8" color={whitish}>Don't miss out on this opportunity to be one of our first FiRM Affiliates and begin earning today! Apply now and start making a difference in the world of finance!</Text>
            <Stack alignItems="center" py="4" px="8" w='full' direction={{ base: 'column', lg: 'row' }} justify="space-between">
                <RegisterBtn />
                <Text color={lightish}><b>* Note</b>: Governance reserves the right to make changes to the program at any time.</Text>
            </Stack>
        </DarkCard>
    </VStack>
</VStack>

const faq = [
    {
        title: <Title><b className="splash-underline">What is the criteria</b> to become a FiRM Affiliate?</Title>,
        answer: "It varies depending on the category of Affiliate but we're seeking leaders and influencers with a verifiable following or community that we think can help bring new users to FiRM. For questions, try @patb on Twitter.",
    },
    {
        title: <Title><b className="splash-underline">How do I earn</b> commissions as an affiliate?</Title>,
        answer: "You earn commissions when the borrowers you refer borrow on FiRM. When they borrow, you’ll receive a commission, paid in DBR, equal to 10% of the DBR they spend on their loan.",
    },
    {
        title: <Title>How will I receive my commissions and <b className="splash-underline">how often will I be paid</b>?</Title>,
        answer: "You will receive your commissions on a monthly basis. This means that you will receive payments for your commissions earned in the previous month at the beginning of each month. You will be able to see the details of each payment in your affiliate dashboard, including the amount, date, and status of each payment.",
    },
    {
        title: <Title><b className="splash-underline">How do I track</b> my referrals and commissions?</Title>,
        answer: "Affiliates can login to the affiliate dashboard and view referral and commission information. Your referrals will be listed in your affiliate dashboard, along with the date they were made, their status, and the commission amount earned",
    },
    {
        title: <Title><b className="splash-underline">Is there a limited number</b> of referrals i can refer?</Title>,
        answer: "No. Affiliates can refer as many borrowers as they wish",
    },
];

const FaqSection = (props) => <VStack px="0" alignItems="center" transform="translateY(-70px)" w='full' bgColor={'white'} bgImage="/assets/affiliate/black-splash.png" bgRepeat="no-repeat" bgSize={{ base: 'contain', '2xl': 'cover' }} pt={{ base: '100px', lg: '250px' }} pb="10">
    <FaqBar />
    <VStack spacing="8" maxW='1307px' w='full' px="4">
        <VStack alignItems="flex-start" position="relative" p={{ base: 8, lg: 20 }} bgImage="/assets/affiliate/bg1.png" bgRepeat="no-repeat" bgSize="cover" mt={{ base: '0', lg: '250px' }} borderRadius={'50px'}>
            <VStack spacing="4" w='full' alignItems="flex-start">
                {
                    faq.map(({ title, answer }, i) => {
                        return <VStack key={i} alignItems="flex-start">
                            {title}
                            <Text>{answer}</Text>
                        </VStack>
                    })
                }
            </VStack>
        </VStack>
    </VStack>
</VStack>

const personas = [
    { badge: 'Individuals', src: '/assets/affiliate/person.png' },
    { title: 'Social media\nInfluencers', src: '/assets/affiliate/x.png', subtitle: 'with 5,000+ followers or subscribers on one or more social media platforms including Twitter, YouTube, Facebook, and Instagram.' },
    { title: 'Financial\nLeaders', src: '/assets/affiliate/finance.png', subtitle: 'with a community of 500+ members on one or more community groups on Telegram, Facebook, Discord, WeChat, and/or Reddit.' },
    { title: 'Opinion\nLeaders', src: '/assets/affiliate/opinion.png', subtitle: 'with a community of 500+ members on one or more community groups on Telegram, Facebook, Discord, WeChat, and/or Reddit.' },
    { title: 'DEX or Similar\nTrading Platforms', src: '/assets/affiliate/dex.png' },
    { badge: 'Businesses or\nOrganizations', src: '/assets/affiliate/business.png', bgPosition: "center 80%" },
    { title: 'Those with a user\nbase of 2,000+', src: '/assets/affiliate/users.png' },
    { title: 'Market analysis\nplatforms with\n5,000+ daily visits', src: '/assets/affiliate/activity.png' },
    { title: 'Industry Media\nPlatforms', src: '/assets/affiliate/media.png' },
    { title: 'Crypto Funds', src: '/assets/affiliate/fund.png' },
];

export const FirmAffiliateRegisterPage = () => {
    return (
        <Layout bgColor="white" bg="white">
            <Head>
                <title>Inverse Finance - Affiliate Program Registration</title>
                <meta name="description" content="As a FiRM Affiliate, you'll have the opportunity to earn a whopping 10% of the DBR spent by borrowers you refer" />
                <meta name="keywords" content="Inverse Finance, FiRM, affiliate, affiliation, commission, rewards" />
                <meta name="og:title" content="Inverse Finance - Affiliate Program Registration" />
                <meta name="og:description" content="As a FiRM Affiliate, you'll have the opportunity to earn a whopping 10% of the DBR spent by borrowers you refer" />
                <meta name="og:image" content="https://inverse.finance/assets/social-previews/affiliate.png" />
            </Head>
            <AppNav active="More" activeSubmenu="Affiliate Dashboard" hideAnnouncement={true} hideCampaignBar={true} />
            <ErrorBoundary>
                <VStack overflow="hidden" spacing="0" w='full' mt="8">
                    <SectionOne />
                    <InfoBar />
                    <HowDoesItWorkSection />
                    <WhoIsEligibleSection />
                    <WhatElseSection />
                    <FaqSection />
                </VStack>
            </ErrorBoundary>
        </Layout>
    )
}

export default FirmAffiliateRegisterPage
