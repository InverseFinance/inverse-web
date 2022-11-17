import { Flex, Stack, Image, VStack, Text, TextProps } from '@chakra-ui/react'
import Layout from '@app/components/common/Layout'
import { AppNav } from '@app/components/common/Navbar'
import Head from 'next/head';
import { DBRInfos } from '@app/components/F2/Infos/DBRInfos';
import { useCheckDBRAirdrop } from '@app/hooks/useDBR';
import { useAccount } from '@app/hooks/misc';
import { shortenAddress } from '@app/util';
import { RSubmitButton } from '@app/components/common/Button/RSubmitButton';
import { preciseCommify } from '@app/util/misc';

const AirdropText = (props: TextProps) => <Text fontSize={{ base: '16px', sm: '18px' }} {...props} />

const EligibleComp = ({ 
    amount,
    account,
}: {
    amount: number,
    account: string,
}) => {
    return <>
        <Text fontWeight="extrabold" fontSize={{ base: '18px', sm: '22px', md: '24px', lg: '28px' }}>
            Congratulations!
        </Text>
        <AirdropText >
            Your <b>{shortenAddress(account)}</b> account is elgible to claim the DBR airdrop!
        </AirdropText>
        <AirdropText >
            <b>By claiming DBR</b> you will be able to <b>borrow DOLA for free</b> and try out our new innovative lending product <b>FiRM</b>!
        </AirdropText>
        <AirdropText >
            You don't need to borrow right now?
            <br/>
            Keep your DBRs for as long as you want and borrow later!
        </AirdropText>
        <AirdropText >
            The DBR airdrop is a unique way to borrow at 0% interest
        </AirdropText>
        <VStack w='full' alignItems="center" pt='8'>
            <RSubmitButton w='auto' px="10" py="8" fontSize={{ base: '16px', sm: '20px', md: '22px' }}>
                Claim {preciseCommify(amount, 0)} DBR
            </RSubmitButton>
        </VStack>
    </>
}

const NotEligibleComp = ({ 
    account,
}: {
    amount: number,
    account: string,
}) => {
    return <>
        <Text fontWeight="extrabold" fontSize={{ base: '18px', sm: '22px', md: '24px', lg: '28px' }}>
            Sorry, you're not eligible!
        </Text>
        <AirdropText>
            Your <b>{shortenAddress(account)}</b> account is not elgible to claim the DBR airdrop!
        </AirdropText>
        <AirdropText>
            DBR can be bought on open markets like |link|
        </AirdropText>
    </>
}

export const ClaimDbr = () => {
    const account = useAccount();
    const { eligible, amount } = useCheckDBRAirdrop(account);
    return (
        <Layout>
            <Head>
                <title>{process.env.NEXT_PUBLIC_TITLE} - DBR token</title>
                <meta name="og:title" content="Inverse Finance - DBR token" />                
            </Head>
            <AppNav active="Tokens" activeSubmenu="Overview" />
            <Flex direction="column" w={{ base: 'full' }} p={{ base: '4' }} maxWidth="1140px">
                <Stack mt="8" w='full' direction={{ base: 'column', lg: 'row' }} spacing="10">                    
                    <VStack alignItems="center" justify="center" w={{ base: 'full', sm: '45%' }}>
                        <Image src="/assets/v2/dbr-airdrop.png" w="full" maxW='500px' />
                    </VStack>
                    <VStack spacing="4" alignItems="flex-start" w={{ base: 'full', sm: '55%' }}>
                        {
                            !!account && eligible && <EligibleComp amount={amount} account={account} />
                        }
                        {
                            !!account && !eligible && <NotEligibleComp amount={amount} account={account} />
                        }
                    </VStack>
                </Stack>
                <VStack pt="10">
                    <DBRInfos />
                </VStack>
            </Flex>
        </Layout>
    )
}

export default ClaimDbr