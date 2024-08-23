import { VStack, Text, Stack, RadioGroup, Radio, SimpleGrid, Divider, Checkbox, Textarea } from '@chakra-ui/react'
import { ErrorBoundary } from '@app/components/common/ErrorBoundary'
import Layout from '@app/components/common/Layout'
import { AppNav } from '@app/components/common/Navbar'
import Head from 'next/head'
import { DashBoardCard } from '@app/components/F2/UserDashboard'
import { RSubmitButton } from '@app/components/common/Button/RSubmitButton'
import { SplashedText } from '@app/components/common/SplashedText'
import { Input } from '@app/components/common/Input'
import { useState } from 'react'
import { InfoMessage, SuccessMessage } from '@app/components/common/Messages'
import { isAddress } from 'ethers/lib/utils'
import { BURN_ADDRESS } from '@app/config/constants'

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
        <Input color="mainTextColor" w='full' placeholder={placeholder} value={value} onChange={e => setter(e.target.value)} {...props} />
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
    value: boolean,
    setter: () => void,
    placeholder?: string,
}) => {
    return <VStack w='full' spacing="0" alignItems="flex-start">
        <Checkbox color="mainTextColor" w='full' isChecked={value} onChange={e => {
            setter(!value)
        }} {...props}>
            {text}
        </Checkbox>
    </VStack>
}

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

export const FirmAffiliateRegisterPage = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [emailConfirm, setEmailConfirm] = useState('');
    const [affiliateType, setAffiliateType] = useState<'individual' | 'business'>('individual');
    const [infos, setInfos] = useState({});
    const [wallet, setWallet] = useState('');
    const [otherInfo, setOtherInfo] = useState('');
    const [isSuccess, setIsSuccess] = useState(false);

    const isInvalidWallet = !!wallet && (!isAddress(wallet) || wallet === BURN_ADDRESS);
    const isInvalidEmail = !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    const isInvalidIndividual = affiliateType === 'individual' && !Object.entries(infos).filter(([key, value]) => individualInputs.map(ii => ii.key).includes(key)).some(([key, value]) => !!value.trim());
    const isInvalidBusiness = affiliateType === 'business' && !Object.entries(infos).filter(([key, value]) => businessChecks.map(ii => ii.key).includes(key)).some(([key, value]) => !!value);
    const isFormValid = !!wallet && !isInvalidWallet && !!email && email === emailConfirm && !isInvalidEmail && !!name.trim() && !isInvalidIndividual && !isInvalidBusiness;

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
        <Layout>
            <Head>
                <title>Inverse Finance - Affiliate Program Registeration</title>
            </Head>
            <AppNav active="More" activeSubmenu="Affiliate Dashboard" hideAnnouncement={true} />
            <ErrorBoundary>
                <VStack spacing="10" w='full' maxW="1200px" mt="8">
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
                            w: '500px',
                            opacity: 0.3,
                        }}
                    >
                        Become a FiRM Affiliate
                    </SplashedText>

                    <VStack alignItems="">
                        <Stack justify="space-between" spacing="10" direction={{ base: 'column', xl: 'row' }}>
                            <DashBoardCard w={{ base: '95%', lg: '600px' }} spacing="2" alignItems="flex-start">
                                <VStack spacing="4" w='full'>
                                    <SimpleGrid w='full' columns={{ base: 1, lg: 1 }} gap="2">
                                        <InputZone text="Name / Alias *" placeholder={'Satoshi'} fontSize="14px" value={name} setter={setName} />
                                        <InputZone text="Email *" isInvalid={!!email && isInvalidEmail} placeholder={'satoshi@gmail.com'} fontSize="14px" value={email} setter={setEmail} />
                                        <InputZone text="Confirm Email *" placeholder={'satoshi@gmail.com'} fontSize="14px" value={emailConfirm} isInvalid={!!email && !!emailConfirm && email !== emailConfirm} setter={setEmailConfirm} />
                                    </SimpleGrid>
                                    <VStack w='full' spacing="0" alignItems="flex-start">
                                        <Text fontWeight="bold">
                                            Affiliate Type *
                                        </Text>
                                        <RadioGroup w='full' bgColor="mainBackground" p="2" onChange={setAffiliateType} value={affiliateType}>
                                            <Stack direction='row' w='full' justify="space-between">
                                                <Radio value='individual'>
                                                    <Text>Individual / Influencer</Text>
                                                </Radio>
                                                <Radio value="business">
                                                    <Text>Business / Organization</Text>
                                                </Radio>
                                            </Stack>
                                        </RadioGroup>
                                    </VStack>
                                    <Divider />
                                    <VStack w='full' spacing="0" alignItems="flex-start">
                                        {
                                            affiliateType === 'individual' ?
                                                <VStack w='full' alignItems="flex-start">
                                                    <InfoMessage alertProps={{ w: 'full' }} description="Social media influencers with 5,000+ followers or subscribers on one or more social media platforms.  Financial leaders or opinion leaders with a community of 500+ members on one or more community groups" />
                                                    <VStack w='full' alignItems="flex-start">
                                                        <Text fontStyle="italic">
                                                            please share relevant social media accounts here:
                                                        </Text>
                                                        <SimpleGrid columns={{ base: 2, lg: 3 }} gap="2">
                                                            {
                                                                individualInputs.map(({ key, text, placeholder }) => {
                                                                    return <InputZone fontSize="14px" key={key} text={text} placeholder={placeholder} value={infos[key]} setter={(v) => setInfos({ ...infos, [key]: v })} />
                                                                })
                                                            }
                                                        </SimpleGrid>
                                                    </VStack>
                                                </VStack>
                                                : <VStack w='full' alignItems="flex-start">
                                                    <InfoMessage alertProps={{ w: 'full' }} description="User base of 2,000+, Market Analysis platform with 5,000+ daily visits" />
                                                    <Text fontStyle="italic">
                                                        Please check all that apply:
                                                    </Text>
                                                    <SimpleGrid w='full' columns={{ base: 2, lg: 2 }} gap="2">
                                                        {
                                                            businessChecks.map(({ key, text }) => {
                                                                return <CheckboxZone key={key} text={text} value={infos[key]} setter={(v) => {
                                                                    setInfos({ ...infos, [key]: v })
                                                                }} />
                                                            })
                                                        }
                                                    </SimpleGrid>
                                                </VStack>
                                        }
                                    </VStack>
                                    <Divider />
                                    <InputZone text="Wallet Address (for payments)" placeholder={BURN_ADDRESS} fontSize="14px" value={wallet} setter={setWallet} isInvalid={isInvalidWallet} />
                                    <Text w='full' fontWeight="bold">
                                        Other informations we should know:
                                    </Text>
                                    <Textarea color="mainTextColor" placeholder="I'm also interested as a borrower / I have feedback about the product / Other" fontSize="14px" value={otherInfo} onChange={e => setOtherInfo(e.target.value)} />
                                    {
                                        isSuccess ? <SuccessMessage alertProps={{ w: 'full' }} iconProps={{ height: 40, width: 40 }} title="Affiliation request submitted!" description="We will get back to you shortly" />
                                            : <RSubmitButton onSuccess={() => handleSuccess()} disabled={!isFormValid} p="8" fontSize="22px" onClick={register}>
                                                Become an Affiliate
                                            </RSubmitButton>
                                    }
                                </VStack>
                            </DashBoardCard>
                        </Stack>
                    </VStack>
                </VStack>
            </ErrorBoundary>
        </Layout>
    )
}

export default FirmAffiliateRegisterPage
