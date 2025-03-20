import { Flex, Stack, Image, VStack, Text, TextProps, HStack } from '@chakra-ui/react'
import Layout from '@app/components/common/Layout'
import { AppNav } from '@app/components/common/Navbar'
import Head from 'next/head';
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
import { getNetworkConfigConstants } from '@app/util/networks';
import { FirmFAQ } from '@app/components/F2/Infos/FirmFAQ';
import ScannerLink from '@app/components/common/ScannerLink';
import { BUY_LINKS } from '@app/config/constants';

const { DBR } = getNetworkConfigConstants();

const AirdropText = (props: TextProps) => <Text fontSize={{ base: '16px', sm: '18px' }} {...props} />

const EligibleComp = ({
    amount,
    amountString,
    account,
    hasClaimed,
    airdropData,
}: {
    amount: number,
    amountString: string,
    account: string,
    hasClaimed: boolean,
    airdropData: { [key: string]: string },
}) => {
    const { provider } = useWeb3React()
    const [isSuccess, setIsSuccess] = useState(hasClaimed);

    const claim = async () => {
        const proofs = getAccountProofs(account, airdropData, amountString);
        return claimAirdrop(account, '0', airdropData[account], proofs, provider?.getSigner());
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
        <Link textDecoration="underline" href="https://docs.inverse.finance/inverse-finance/dbr-dola-borrowing-rights" isExternal target="_blank">
            Read DBR docs
        </Link>
        {
            isSuccess || hasClaimed ?
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
        <Link textDecoration="underline" href={BUY_LINKS.DBR} isExternal target="_blank">
            Open Balancer to buy DBR
        </Link>
        <ScannerLink color="secondaryTextColor" value={DBR} label="Open DBR in Etherscan" />
    </>
}

export const ClaimDbr = () => {
    const account = useAccount();
    const { isEligible, amount, hasClaimed, airdropData, claimer, amountString } = useCheckDBRAirdrop(account);

    const importDBR = async () => {
        const tokenAddress = DBR;
        const tokenSymbol = 'DBR';
        const tokenDecimals = 18;
        const tokenImage = 'https://inverse.finance/assets/v2/dbr.webp';

        try {
            if (!ethereum) { return }
            // wasAdded is a boolean. Like any RPC method, an error may be thrown.
            await ethereum.request({
                method: 'wallet_watchAsset',
                params: {
                    type: 'ERC20',
                    options: {
                        address: tokenAddress,
                        symbol: tokenSymbol,
                        decimals: tokenDecimals,
                        image: tokenImage,
                    },
                },
            });
        } catch (error) {
            console.log(error);
        }
    }

    return (
        <Layout>
            <Head>
                <title>Inverse Finance - DBR token</title>
                <meta name="og:title" content="Inverse Finance - DBR Airdrop" />
                <meta name="og:description" content="Check if you're available for the DBR airdrop and claim it!" />
                <meta name="og:image" content="https://inverse.finance/assets/v2/dbr-airdrop.jpg" />
            </Head>
            <AppNav active="Claim" isClaimPage={true} />
            <Flex direction="column" w={{ base: 'full' }} p={{ base: '4' }} maxWidth="1140px">
                <Stack alignItems="center" justify="center" mt="8" w='full' direction={{ base: 'column', lg: 'row' }} spacing="10">
                    <VStack alignItems="center" justify="center" w={{ base: 'full', sm: '45%' }} h={{ base: '200px', sm: '500px' }}>
                        <Image borderRadius="999px" src="/assets/v2/dbr-airdrop.jpg" w="full" maxW={{ base: '200px', sm: '500px' }} maxW={{ base: '200px', sm: '500px' }} />
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
                            !!account && isEligible && <EligibleComp airdropData={airdropData} hasClaimed={hasClaimed} amount={amount} account={claimer} amountString={amountString} />
                        }
                        {
                            !!account && !isEligible && <NotEligibleComp account={account} />
                        }
                        {
                            !!account && <HStack cursor="pointer" onClick={importDBR}>
                                <Image borderRadius="50px" src="/assets/v2/dbr.webp" w="20px" />
                                <Text>
                                    Import DBR token in my wallet
                                </Text>
                            </HStack>
                        }
                    </VStack>
                </Stack>
                <VStack pt="10">
                    <FirmFAQ />
                </VStack>
            </Flex>
        </Layout>
    )
}

export default ClaimDbr