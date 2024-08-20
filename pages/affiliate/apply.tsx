import { VStack, Text, Stack, RadioGroup, Radio, SimpleGrid, Divider, Checkbox, TextProps, Textarea, Flex, Image, HStack, useMediaQuery } from '@chakra-ui/react'
import { ErrorBoundary } from '@app/components/common/ErrorBoundary'
import Layout from '@app/components/common/Layout'
import { AppNav } from '@app/components/common/Navbar'
import Head from 'next/head'
import { FirmAffiliateDashboard } from '@app/components/F2/Infos/FirmAffiliateDashboard'
import { Steps } from '@app/components/common/Step'
import { DashBoardCard } from '@app/components/F2/UserDashboard'
import { RSubmitButton } from '@app/components/common/Button/RSubmitButton'
import { SplashedText } from '@app/components/common/SplashedText'
import { lightTheme } from '@app/variables/theme'
import { Input } from '@app/components/common/Input'
import { useState } from 'react'
import { InfoMessage, SuccessMessage } from '@app/components/common/Messages'
import { isAddress } from 'ethers/lib/utils'
import { BURN_ADDRESS } from '@app/config/constants'
import Link from '@app/components/common/Link'
import { FAQ } from '@app/components/common/FAQ'
import { ExternalLinkIcon } from '@chakra-ui/icons'

const steps = [
    {
        text: <Text>Fill out the application form to become a FiRM Affiliate. Our team will review your application to ensure you meet the criteria.</Text>,
    },
    {
        text: <Text>Once approved, create and share your unique Affiliate link with your audiences.</Text>,
    },
    {
        text: <Text>Sit back and earn! As the borrowers you refer spend DBR on new DOLA loans, you'll receive 10% of their spent DBR.</Text>,
    },
]


const InputZone = ({
    text,
    value,
    setter,
    placeholder,
    ...props
}: {
    text: string,
    value: string,
    setter: () => void,
    placeholder?: string,
}) => {
    return <VStack w='full' spacing="0" alignItems="flex-start">
        <Text fontWeight="bold">
            {text}
        </Text>
        <Input w='full' placeholder={placeholder} value={value} onChange={e => setter(e.target.value)} {...props} />
    </VStack>
}

const CheckboxZone = ({
    text,
    value,
    setter,
    placeholder,
    ...props
}: {
    text: string,
    value: string,
    setter: () => void,
    placeholder?: string,
}) => {
    return <VStack w='full' spacing="0" alignItems="flex-start">
        <Checkbox w='full' value={value} onClick={e => setter(!value)} {...props}>
            {text}
        </Checkbox>
    </VStack>
}

const FaqText = (props: TextProps) => <Text color="secondaryTextColor" lineHeight="1.5" {...props} />
const FaqStack = (props: TextProps) => <VStack alignItems="flex-start" spacing="2" {...props} />
const FaqLink = (props: TextProps) => <Link fontWeight="bold" style={{ 'text-decoration-skip-ink': 'none' }} mt="10px" color="mainTextColor" textDecoration="underline" isExternal target="_blank" {...props} />

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

const DarkCard = (props) => <DashBoardCard position="relative" p="0" gap="8" direction="column" color={whitish} bgColor={cardBg} border={`1px solid ${cardBorder}`} {...props} />
const GrayCard = (props) => <DashBoardCard position="relative" p="0" gap="8" direction="column" color={whitish} bgColor={'#7C7F83'} border={`1px solid ${'#A4A6A8'}`} {...props} />

const MainTitle = (props) => <Text fontWeight="extrabold" fontSize="9vw" color={mainColor} {...props} />
const BigTitle = (props) => <Text fontWeight="extrabold" fontSize="48px" color={mainColor} {...props} />
const Title = (props) => <Text fontWeight="bold" fontSize="20px" color={mainColor} {...props} />
const SimpleText = (props) => <Text color={mainColor} {...props} />

const OrangeBubble = (props) => <VStack transform="rotate(-5deg)" borderRadius="120px" lineHeight="normal" p="8" fontSize={{ base: "18px", lg: "34px" }} border="8px solid white" bgColor="secAccentTextColor" {...props} />

const SectionOne = () => <VStack alignItems="flex-start" position="relative" p={{ base: 8, lg: 20 }} borderRadius="50px" bgImage="/assets/affiliate/bg1.png">
    <VStack alignItems="flex-start">
        <HStack w='full' justify="flex-start" spacing={{ base: "20px", lg: "40px" }}>
            <MainTitle>
                Become a
            </MainTitle>
            <Image src="/assets/firm/firm-big.png" alt="FiRM" minW='100px' maxW='33vw' w={"45vh"} />
        </HStack>
        <HStack>
            <MainTitle>
                Affiliate
            </MainTitle>
        </HStack>
    </VStack>
    <Stack direction={{ base: 'column', lg: 'row' }}>
        <VStack w={{ base: 'full', lg: '60%' }} alignItems="flex-start">
            <Title fontWeight="bold">
                Ready to join the fixed-rate DeFi lending rebellion and start earning serious commissions?
            </Title>
            <SimpleText>
                As a FiRM Affiliate, you'll have the opportunity to earn a whopping 10% of the DBR spent by borrowers you refer. That's right, you'll be making money while helping to spread the word about the incredible potential of FiRM!
            </SimpleText>
        </VStack>
        <VStack right="-120px" bottom="0" position={{ base: 'relative', lg: 'absolute' }}>
            <OrangeBubble transform={{ base: "translate3D(-90px, 40px, 0) rotate(-5deg)", lg: 'translate3D(-200px, 40px, 0) rotate(-5deg)' }}>
                <VStack alignItems="flex-start" w='full'>
                    <Text color={mainColor}>Earn <b>10%</b> Commissions</Text>
                    <Text color={mainColor}>By Promoting <b>FiRM</b></Text>
                </VStack>
            </OrangeBubble>
            <Image zIndex="1" src="/assets/affiliate/megaphone.png" minW='150px' w="20vw" />
        </VStack>
    </Stack>
</VStack>

const InfoBar = () => <VStack zIndex="2" overflow="hidden" transform="translateY(-40px) rotate(2deg)" bgColor={lightTheme.colors.accentTextColor} w='110%'>
    <Text fontWeight="extrabold" whiteSpace="nowrap" textOverflow="clip" color={whitish} fontSize="68px">
        INFO INFO INFO INFO INFO INFO INFO INFO INFO INFO INFO INFO INFO INFO
    </Text>
</VStack>

const FaqBar = () => <VStack zIndex="2" overflow="hidden" transform="translateY(-40px) rotate(-2deg)" bgColor={lightTheme.colors.accentTextColor} w='110%'>
    <Text fontWeight="extrabold" whiteSpace="nowrap" textOverflow="clip" color={whitish} fontSize="68px">
        FAQ FAQ FAQ FAQ FAQ FAQ FAQ FAQ FAQ FAQ FAQ FAQ FAQ FAQ FAQ FAQ FAQ FAQ FAQ FAQ
    </Text>
</VStack>

const HowDoesItWorkSection = () => <VStack spacing="8" transform="translateY(-70px)" w='full' alignItems="flex-start" position="relative" px={{ base: 8, lg: 20 }} py="20" bgColor={mainColor}>
    <Stack w='full' pl={{ base: 0, lg: '20%' }} spacing="8" color={whitish} direction={{ base: 'column', lg: 'row' }} alignItems={{ base: 'flex-start', lg: 'flex-end' }}>
        <VStack spacing="0" alignItems="flex-start">
            <BigTitle whiteSpace="nowrap" color={whitish} textTransform="uppercase">How does</BigTitle>
            <BigTitle color={whitish} textTransform="uppercase">it <b className="splash-orange-circled">work</b>?</BigTitle>
        </VStack>
        <Title ml={{ base: 0, lg: 8 }} transform="translateY(-11px)" color={whitish} borderBottom={`1px solid ${lightTheme.colors.secAccentTextColor}`}>
            It's quite simple
        </Title>
    </Stack>
    <SimpleGrid gap="8" columns={{ base: 1, lg: 3 }}>
        <DarkCard alignItems="flex-start">
            <Text px="8" pt="8" color={whitish}>
                <b style={{ color: lightTheme.colors.secAccentTextColor }}>Fill out the application form below to become a FiRM Affiliate</b>. Our team will review your application to ensure you meet the criteria.
            </Text>
            <Link href="/affiliate/register" textDecoration="underline" px="8" mb="140px" color={lightTheme.colors.secAccentTextColor}>
                Application Form <ExternalLinkIcon color={lightTheme.colors.secAccentTextColor} />
            </Link>
            <Image right="0" position="absolute" bottom="0" src="/assets/affiliate/step1.png" w="100px" />
        </DarkCard>
        <DarkCard>
            <Text mb="140px" p="8" color={whitish}>
                Once approved, create and share your unique Affiliate link with your audiences. <b style={{ color: lightTheme.colors.secAccentTextColor }}>Promote FIRM to your audiences</b> as much or as little as you like.
            </Text>
            <Image transform="translate3d(-41px, 30px, 0)" position="absolute" bottom="0" src="/assets/affiliate/step2.png" w="90%" />
        </DarkCard>
        <DarkCard>
            <Text mb="140px" p="8" color={whitish}>
                <b style={{ color: lightTheme.colors.secAccentTextColor }}>Sit back and earn!</b> As the borrowers you refer spend DBR on new DOLA loans, you'll receive 10% of their spent DBR.
            </Text>
            <Image position="absolute" left="0" bottom="0" src="/assets/affiliate/step3.png" w="75%" />
        </DarkCard>
    </SimpleGrid>
</VStack>

const WhoIsEligibleSection = () => <VStack spacing="8" transform="translateY(-70px)" w='full' alignItems="flex-start" position="relative" px={{ base: 8, lg: 20 }} py="20" bgColor={mainColor}>
    <Stack w='full' pl={{ base: 0, lg: '20%' }} spacing={{ base: '20', lg: '8' }} color={whitish} direction={{ base: 'column', lg: 'row' }} alignItems={{ base: 'flex-start', lg: 'flex-end' }}>
        <VStack spacing="0" alignItems="flex-start">
            <BigTitle whiteSpace="nowrap" color={whitish} textTransform="uppercase">Who is</BigTitle>
            <BigTitle color={whitish} textTransform="uppercase" className="splash-orange-circled">eligible?</BigTitle>
        </VStack>
        <VStack w="345px" alignItems="center">
            <GrayCard>
                <Image right="0" position="absolute" bottom="-5px" src="/assets/affiliate/influencers.png" w="343px" h="200px" />
            </GrayCard>
            <Text textAlign="justify" p="4" color={whitish} fontSize="16px">
                The program is brand new and we're initially limiting signups to influencers, community leaders, and others with a sizeable audience, including:
            </Text>
        </VStack>
    </Stack>
    <SimpleGrid justifyContent="center" mt="10" gap="8" columns={{ base: 1, lg: 5 }}>
        {
            personas.map((persona, i) => {
                return <VStack alignItems={{ base: 'center', lg: 'flex-start' }}>
                    <GrayCard h="200px" w="200px">
                        <Image position="absolute" bottom="0" src={`/assets/affiliate/persona${i + 1}.png`} w="100%" {...persona.imageProps} />
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
    <VStack w='full' alignItems="center">
        <Title fontSize={{ base: '30px', lg: '30px' }} p={{ base: 2, lg: 20 }} w={{ base: '90%', lg: '66%' }} textAlign="center" color={whitish}>
            The <b>FiRM</b> <b style={{ color: lightTheme.colors.secAccentTextColor }}>Affiliate Program</b> offers a <b>no-hassle opportunity</b> to <b className="splash-underline">introduce FiRM</b> to your audience while adding to your topline revenue number!
        </Title>
    </VStack>
</VStack>

const WhatElseSection = () => <VStack transform="translateY(-70px)" spacing="8" w='full' alignItems="flex-start" position="relative" px={{ base: 8, lg: 20 }} py="20" bgColor={mainColor}>
    <Stack spacing="8" direction={{ base: 'column', lg: 'row' }}>
        <DarkCard justifyContent="center" w={{ base: 'full', lg: '40%' }} bgColor={lightTheme.colors.secAccentTextColor} bgImage="url(/assets/affiliate/splash-bowl.png)" bgPosition="0 0" bgSize="75%" bgRepeat="no-repeat">
            <VStack spacing="0" alignItems="flex-start" py="10" px="20">
                <BigTitle whiteSpace="nowrap" color={mainColor} textTransform="uppercase">what</BigTitle>
                <BigTitle color={mainColor} textTransform="uppercase" className="splash-circled">else?</BigTitle>
            </VStack>
        </DarkCard>
        <DarkCard w={{ base: 'full', lg: '30%' }}>
            <Text mb="100px" p="8" color={whitish}>
                When a new borrower uses the dedicated Affiliate URL, the borrower <b>signs a message</b> confirming the referral from an Affiliate's address.
            </Text>
            <Image position="absolute" bottom="-7px" maxW="200px" src="/assets/affiliate/sign.png" w="100%" />
        </DarkCard>
        <DarkCard w={{ base: 'full', lg: '30%' }}>
            <Text mb="100px" p="8" color={whitish}>
                Affiliates reward activity is viewable via an <b style={{ color: lightTheme.colors.secAccentTextColor }}>Affiliate dashboard</b> and a dedicated Discord channel is available to Affiliates for support.
            </Text>
            <Image position="absolute" bottom="0" src="/assets/affiliate/dashboard.png" w="50%" />
        </DarkCard>
    </Stack>
    <DarkCard w='full' p="8">
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
    <Stack w='full' spacing="8" direction={{ base: 'column', lg: 'row' }}>
        <DarkCard justifyContent="center" w={{ base: 'full', lg: '50%' }}>
            <Text py="4" px="8" color={whitish}>90-day beta test runs from August 15 thru November 15th. Program may be extended by governance.</Text>
        </DarkCard>
        <DarkCard justifyContent="center" w={{ base: 'full', lg: '50%' }}>
            <Text py="4" px="8" color={whitish}>Referrals made via sybil attacks or other prohibited means may be denied payment.</Text>
        </DarkCard>
    </Stack>
    <DarkCard w='full'>
        <Text py="4" px="8" color={whitish}>Don't miss out on this opportunity to be one of our first FiRM Affiliates and begin earning today! Apply now and start making a difference in the world of finance!</Text>
        <Stack w='full' direction={{ base: 'column', lg: 'row' }} justify="space-between">
            <Text>&nbsp;</Text>
            <Text color={lightish}>* Note: Governance reserves the right to make changes to the program at any time.</Text>
        </Stack>
    </DarkCard>
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

const FaqSection = (props) => <VStack alignItems="flex-start" position="relative" p={{ base: 8, lg: 20 }} borderRadius="50px" bgImage="/assets/affiliate/bg1.png">
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

const personas = [
    { title: 'Individuals', imageProps: { w: "80%" } },
    { title: 'Social media\nInfluencers', imageProps: { maxH: "220px" }, subtitle: 'with 5,000+ followers or subscribers on one or more social media platforms including Twitter, YouTube, Facebook, and Instagram.' },
    { title: 'Financial\nLeaders', subtitle: 'with a community of 500+ members on one or more community groups on Telegram, Facebook, Discord, WeChat, and/or Reddit.' },
    { title: 'Opinion\nLeaders', imageProps: { bottom: "-7px", left: "-8px" }, subtitle: 'with a community of 500+ members on one or more community groups on Telegram, Facebook, Discord, WeChat, and/or Reddit.' },
    { title: 'DEX or Similar\nTrading Platforms' },
    { title: 'Businesses or\nOrganizations' },
    { title: 'Those with a user\nbase of 2,000+' },
    { title: 'Market analysis\nplatforms with\n5,000+ daily visits' },
    { title: 'Industry Media\nPlatforms' },
    { title: 'Crypto Funds', imageProps: { left: '-18px' } },
]

export const FirmAffiliateRegisterPage = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [emailConfirm, setEmailConfirm] = useState('');
    const [affiliateType, setAffiliateType] = useState('individual');
    const [infos, setInfos] = useState({});
    const [wallet, setWallet] = useState('');
    const [otherInfo, setOtherInfo] = useState('');
    const [isSuccess, setIsSuccess] = useState(false);
    const [isLargerThan] = useMediaQuery('(min-width: 768px)')

    const isInvalidWallet = !!wallet && (!isAddress(wallet) || wallet === BURN_ADDRESS);
    const isInvalidEmail = !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    const isFormValid = !!wallet && !isInvalidWallet && !!email && email === emailConfirm && !isInvalidEmail && !!name.trim();

    const register = async () => {
        const res = await fetch(`/api/referral?isApply=true`, {
            method: 'POST',
            body: JSON.stringify({
                wallet,
                name,
                email,
                emailConfirm,
                affiliateType,
                infos,
                otherInfo,
            }),
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
        });
        return res.json();
    }

    const handleSuccess = () => {
        setIsSuccess(true);
    }

    return (
        <Layout bgColor="white" bg="white">
            <Head>
                <title>Inverse Finance - Affiliate Program Registration</title>
            </Head>
            <AppNav active="More" activeSubmenu="Affiliate Dashboard" hideAnnouncement={true} hideVampireBar={true} />
            <ErrorBoundary>
                <VStack overflow="hidden" spacing="0" w='full' maxW="1307px" mt="8">
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
