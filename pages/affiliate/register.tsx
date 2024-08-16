import { VStack, Text, Stack, RadioGroup, Radio, SimpleGrid, Divider, Checkbox } from '@chakra-ui/react'
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
import { InfoMessage } from '@app/components/common/Messages'
import { isAddress } from 'ethers/lib/utils'
import { BURN_ADDRESS } from '@app/config/constants'

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

const BigTitle = (props) => <Text fontWeight="bold" fontSize="28px" {...props} />
const Title = (props) => <Text fontWeight="bold" fontSize="20px" {...props} />
const SimpleText = (props) => <Text color="mainTextColorLight2" {...props} />

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



export const FirmAffiliateRegisterPage = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [emailConfirm, setEmailConfirm] = useState('');
    const [affiliateType, setAffiliateType] = useState('individual');
    const [infos, setInfos] = useState({});
    const [wallet, setWallet] = useState('');
    const [otherInfo, setOtherInfo] = useState('');

    const individualInputs = [
        { text: 'X (Twitter)', key: 'x' },
        { text: 'Instagram', key: 'instagram' },
        { text: 'Telegram', key: 'telegram' },
        { text: 'Discord', key: 'discord' },
        { text: 'Youtube', key: 'youtube' },
        { text: 'TikTok', key: 'tiktok' },
        { text: 'Facebook', key: 'facebook' },
        { text: 'Other', key: 'other' },
    ];

    const businessChecks = [
        { text: 'Crypto media platform', key: 'crypto-media' },
        { text: 'Crypto Fund', key: 'crypto-fund' },
        { text: 'DEX', key: 'dex' },
        { text: 'Yield Aggregator', key: 'yield' },
        { text: 'Other', key: 'other-business' },
    ];

    const isInvalidWallet = !!wallet && (isAddress(wallet) || wallet === BURN_ADDRESS);

    return (
        <Layout>
            <Head>
                <title>Inverse Finance - Affiliate Program Registeration</title>
            </Head>
            <AppNav active="More" activeSubmenu="Affiliate Dashboard" hideAnnouncement={true} />
            <ErrorBoundary>
                <VStack spacing="20" w='full' maxW="1200px" mt="8">
                    <SplashedText
                        as="h1"
                        color={`mainTextColor`}
                        fontSize={'40px'}
                        fontWeight="extrabold"
                        color={`mainTextColor`}
                        splashColor={`success`}
                        lineHeight='1'
                        splashProps={{
                            top: '20px',
                            left: '-14px',
                            w: '700px',
                            opacity: 0.3,
                        }}
                    >
                        Build Wealth with Inverse Finance
                    </SplashedText>

                    <Stack pt="8" w='full' justify="space-between" alignItems="center" direction={{ base: 'column', lg: 'row' }}>
                        <VStack alignItems="flex-start" spacing="2">
                            <SimpleText>
                                Ready to join the fixed-rate DeFi lending rebellion and start earning serious commissions?
                            </SimpleText>
                            <SimpleText>As a FiRM Affiliate, you'll have the opportunity to <b>earn a whopping 10%</b> of the DBR spent by borrowers you refer.</SimpleText>
                            <SimpleText>That's right, you'll be making money while helping to spread the word about the incredible potential of FiRM!</SimpleText>
                        </VStack>
                        <VStack spacing="0">
                            <SplashedText
                                splash="large"
                                zIndex="3"
                                color={lightTheme.colors.mainTextColor}
                                fontWeight="900"
                                fontSize="100px"
                                textShadow={`2px 2px ${lightTheme.colors.mainTextColorAlpha}`}
                                splashProps={{
                                    left: '-80px',
                                    top: '-55px',
                                    w: '350px',
                                    h: '300px',
                                    zIndex: '2',
                                    bgColor: `accentTextColor`,
                                }}
                            >
                                10%
                            </SplashedText>
                            <BigTitle
                                transform="translateY(-30px)"
                                zIndex="4"
                                fontSize="24px"
                                color={lightTheme.colors.mainTextColor}
                                textShadow={`2px 2px ${lightTheme.colors.mainTextColorAlpha}`}
                                fontWeight="bold"
                            >
                                Commission
                            </BigTitle>
                        </VStack>
                    </Stack>
                    <VStack alignItems="">
                        <Stack justify="space-between" spacing="10" direction={{ base: 'column', xl: 'row' }}>
                            <VStack w='full' spacing="6">
                                <BigTitle>
                                    How does it work? It's simple:
                                </BigTitle>
                                <Steps steps={steps} />
                                <BigTitle>Who is Eligible?</BigTitle>
                                <VStack alignItems="flex-start">
                                    <SimpleText>The program is brand new and we're initially limiting signups to influencers, community leaders, and others with a sizeable audience, including:</SimpleText>
                                    <SimpleText fontWeight="bold">- Individuals</SimpleText>
                                    <VStack spacing="0" pl="8" alignItems="flex-start">
                                        <SimpleText>- Social media influencers with 5,000+ followers or subscribers on one or more social media platforms including Twitter, YouTube, Facebook, and Instagram.</SimpleText>
                                        <SimpleText>- Financial leaders or opinion leaders with a community of 500+ members on one or more community groups on Telegram, Facebook, Discord, WeChat, and/or Reddit.</SimpleText>
                                    </VStack>
                                    <SimpleText fontWeight="bold">- Businesses or organizations</SimpleText>
                                    <VStack spacing="0" pl="8" alignItems="flex-start">
                                        <SimpleText>- Those with a user base of 2,000+</SimpleText>
                                        <SimpleText>- Market analysis platforms with 5,000+ daily visits</SimpleText>
                                        <SimpleText>- Industry Media Platforms</SimpleText>
                                        <SimpleText>- Crypto Funds</SimpleText>
                                        <SimpleText>- DEX or Similar Trading Platforms</SimpleText>
                                    </VStack>
                                    <SimpleText>The program is brand new and we're initially limiting signups to influencers, community leaders, and others with a sizeable audience, including:</SimpleText>
                                </VStack>
                            </VStack>
                            <DashBoardCard spacing="2" alignItems="flex-start">
                                <VStack spacing="4" w='full'>
                                    <SimpleGrid w='full' columns={{ base: 1, lg: 1 }} gap="2">
                                        <InputZone text="Name / Alias *" placeholder={'Satoshi'} fontSize="14px" value={name} setter={setName} />
                                        <InputZone text="Email *" placeholder={'satoshi@gmail.com'} fontSize="14px" value={email} setter={setEmail} />
                                        <InputZone text="Confirm Email *" placeholder={'satoshi@gmail.com'} fontSize="14px" value={emailConfirm} setter={setEmailConfirm} />
                                    </SimpleGrid>
                                    <VStack w='full' spacing="0" alignItems="flex-start">
                                        <Text fontWeight="bold">
                                            Affiliate Type *
                                        </Text>
                                        <RadioGroup w='full' bgColor="mainBackground" p="2" onChange={setAffiliateType} value={affiliateType}>
                                            <Stack direction='row' w='full' justify="space-between">
                                                <Radio value='individual'>Individual / Influencer</Radio>
                                                <Radio value="business">Business / Organization</Radio>
                                            </Stack>
                                        </RadioGroup>
                                    </VStack>
                                    <Divider />
                                    <VStack w='full' spacing="0" alignItems="flex-start">
                                        {
                                            affiliateType === 'individual' ?
                                                <>
                                                    {/* <InfoMessage alertProps={{ w: 'full' }} description="Social media influencers with 5,000+ followers or subscribers on one or more social media platforms.  Financial leaders or opinion leaders with a community of 500+ members on one or more community groups" /> */}
                                                    <VStack w='full' alignItems="flex-start">
                                                        <Text>
                                                            Please fill out any relevant social media account:
                                                        </Text>
                                                        <SimpleGrid columns={{ base: 2, lg: 3 }} gap="2">
                                                            {
                                                                individualInputs.map(({ key, text, placeholder }) => {
                                                                    return <InputZone fontSize="14px" key={key} text={text} placeholder={placeholder} value={infos[key]} setter={(v) => setInfos({ ...infos, [key]: v })} />
                                                                })
                                                            }
                                                        </SimpleGrid>
                                                    </VStack>
                                                </>
                                                : <VStack w='full' alignItems="flex-start">
                                                    <Text>
                                                        Please check all that apply:
                                                    </Text>
                                                    <SimpleGrid w='full' columns={{ base: 2, lg: 2 }} gap="2">
                                                        {
                                                            businessChecks.map(({ key, text }) => {
                                                                return <CheckboxZone key={key} text={text} value={infos[key]} setter={(v) => setInfos({ ...infos, [key]: v })} />
                                                            })
                                                        }
                                                    </SimpleGrid>

                                                    {/* <InfoMessage alertProps={{ w: 'full' }} description="User base of 2,000+, Market Analysis platform with 5,000+ daily visits" /> */}
                                                </VStack>
                                        }
                                    </VStack>
                                    <Divider />
                                    <InputZone text="Wallet Address" placeholder={BURN_ADDRESS} fontSize="14px" value={wallet} setter={setWallet} isInvalid={isInvalidWallet} />
                                    <InputZone text="Other informations we should know" fontSize="14px" value={otherInfo} setter={setOtherInfo} />
                                    <RSubmitButton p="8" fontSize="22px" href="/firm">
                                        Become an Affiliate
                                    </RSubmitButton>
                                </VStack>
                            </DashBoardCard>
                        </Stack>
                    </VStack>
                    <BigTitle>What Else?</BigTitle>
                    <VStack alignItems="flex-start">
                        <SimpleText>- When a new borrower uses the dedicated Affiliate URL, the borrower signs a message confirming the referral from an Affiliate's address and borrows DOLA on FiRM.</SimpleText>
                        <SimpleText>- Payments are sent to the Affiliate wallet address monthly. Affiliates are eligible for reward payments for each borrower they bring to FiRM for up to 12 consecutive months. For the sake of clarity, the DAO will pay an Affiliate reward for a 12 month DOLA loan from a single borrower, but for a 13 month DOLA loan, the Affiliate payments for that borrower would end after the 12th month. The maximum monthly payout to any single Affiliate during the beta test period is 200,000 DBR.</SimpleText>
                        <SimpleText>- Affiliates reward activity is viewable via an Affiliate dashboard and a dedicated Discord channel is available to Affiliates for support.</SimpleText>
                        <SimpleText>- 90-day beta test runs from August 15 thru November 15th. Program may be extended by governance.</SimpleText>
                        <SimpleText>- Referrals made via sybil attacks or other prohibited means may be denied payment</SimpleText>
                    </VStack>
                    <SimpleText>
                        Don't miss out on this opportunity to be one of our first FiRM Affiliates and begin earning today! Apply now and start making a difference in the world of finance!
                    </SimpleText>
                    {/* <VStack alignItems="center" w='full'>
                        <RSubmitButton p="8" fontSize="22px" href="/firm">
                            Become an Affiliate
                        </RSubmitButton>
                    </VStack> */}
                    <SimpleText color="mainTextColorLight">
                        Note: Governance reserves the right to make changes to the program at any time.
                    </SimpleText>
                </VStack>
            </ErrorBoundary>
        </Layout>
    )
}

export default FirmAffiliateRegisterPage
