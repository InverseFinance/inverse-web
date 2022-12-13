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
import { InfoMessage, SuccessMessage } from '@app/components/common/Messages';
import { useState } from 'react';
import { claimAirdrop, getAccountProofs } from '@app/util/merkle';
import Link from '@app/components/common/Link';
import { useWeb3React } from '@web3-react/core';

const AirdropText = (props: TextProps) => <Text fontSize={{ base: '16px', sm: '18px' }} {...props} />

const EligibleComp = ({
    amount,
    account,
    hasClaimed,
    airdropData,
}: {
    amount: number,
    account: string,
    hasClaimed: boolean,
    airdropData: { [key: string]: string },
}) => {
    const { library } = useWeb3React()
    const [isSuccess, setIsSuccess] = useState(hasClaimed);

    const claim = async () => {
        const proofs = getAccountProofs(account, airdropData);
        return claimAirdrop(account, '0', airdropData[account], proofs, library?.getSigner());
    }

    return <>
        <Text fontWeight="extrabold" fontSize={{ base: '18px', sm: '22px', md: '24px', lg: '28px' }}>
            Congratulations!
        </Text>
        <AirdropText >
            Your <b>{shortenAddress(account)}</b> account is eligible to claim the DBR airdrop!
        </AirdropText>
        <AirdropText >
            <b>By claiming DBR</b> you will be able to <b>borrow DOLA for free</b> and try out our new innovative lending product <b>FiRM</b>!
        </AirdropText>
        <AirdropText >
            You don't need to borrow right now?
            <br />
            Keep your DBRs for as long as you want and borrow later!
        </AirdropText>
        <AirdropText >
            The DBR airdrop is a unique occasion to borrow at 0% interest
        </AirdropText>
        {
            isSuccess ?
                <SuccessMessage
                    alertProps={{ w: 'full', fontSize: '18px', fontWeight: 'bold' }}
                    iconProps={{ height: 50, width: 50 }}
                    title="DBR claimed!"
                    description={
                        <Link pt="2" textDecoration="underline" href="/firm/WETH">
                            Borrow DOLA
                        </Link>
                    }
                />
                :
                <VStack w='full' alignItems="center" pt='8'>
                    <RSubmitButton onSuccess={() => setIsSuccess(true)} onClick={() => claim()} w='auto' px="10" py="8" fontSize={{ base: '16px', sm: '20px', md: '22px' }}>
                        Claim {preciseCommify(amount, 0)} DBR
                    </RSubmitButton>
                </VStack>
        }
    </>
}

const NotEligibleComp = ({
    account,
}: {    
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
    const { isEligible, amount, hasClaimed, airdropData } = useCheckDBRAirdrop(account);
    return (
        <Layout>
            <Head>
                <title>{process.env.NEXT_PUBLIC_TITLE} - DBR token</title>
                <meta name="og:title" content="Inverse Finance - DBR token" />
            </Head>
            <AppNav active="Tokens" activeSubmenu="Overview" isClaimPage={true} />
            <Flex direction="column" w={{ base: 'full' }} p={{ base: '4' }} maxWidth="1140px">
                <Stack alignItems="center" justify="center" mt="8" w='full' direction={{ base: 'column', lg: 'row' }} spacing="10">
                    <VStack alignItems="center" justify="center" w={{ base: 'full', sm: '45%' }} h={{ base: '200px', sm: '500px' }}>
                        <Image src="/assets/v2/dbr-airdrop.jpg" w="full" maxW='500px' maxH="500px" />
                    </VStack>
                    <VStack justify="center" spacing="4" alignItems="flex-start" w={{ base: 'full', sm: '55%' }}>
                        {
                            !account && <InfoMessage
                                alertProps={{ fontSize: { base: '16px', sm: '18px' } }}
                                title="DBR Airdrop Check"
                                description="Please connect your wallet to check if you're eligible for the DBR airdrop"
                            />
                        }
                        {
                            !!account && isEligible && <EligibleComp airdropData={airdropData} hasClaimed={hasClaimed} amount={amount} account={account} />
                        }
                        {
                            !!account && !isEligible && <NotEligibleComp account={account} />
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