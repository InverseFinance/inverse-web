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
const MainTitle = (props) => <Text fontWeight="extrabold" fontSize="9vw" color={mainColor} {...props} />
const BigTitle = (props) => <Text fontWeight="bold" fontSize="28px" color={mainColor} {...props} />
const Title = (props) => <Text fontWeight="bold" fontSize="20px" color={mainColor} {...props} />
const SimpleText = (props) => <Text color={mainColor} {...props} />

const OrangeBubble = (props) => <VStack transform="rotate(-5deg)" borderRadius="120px" lineHeight="normal" p="8" fontSize={{ base: "18px", lg: "34px" }} border="8px solid white" bgColor="secAccentTextColor" {...props} />

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
                <VStack spacing="20" w='full' maxW="1307px" mt="8">
                    <VStack alignItems="flex-start" position="relative" p={{ base: 8, lg: 20 }} borderRadius="50px" bgImage="/assets/affiliate/bg1.png">
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
                                        <Text>Earn 10% Commissions</Text>
                                        <Text>By Promoting <b>FiRM</b></Text>
                                    </VStack>
                                </OrangeBubble>
                                <Image zIndex="1" src="/assets/affiliate/megaphone.png" minW='150px' w="20vw" />
                            </VStack>
                        </Stack>
                    </VStack>
                </VStack>
            </ErrorBoundary>
        </Layout>
    )
}

export default FirmAffiliateRegisterPage
