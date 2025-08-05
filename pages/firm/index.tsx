import { Divider, VStack, Text, useDisclosure, RadioGroup, Radio, Box, Flex } from '@chakra-ui/react'
import { ErrorBoundary } from '@app/components/common/ErrorBoundary'
import Layout from '@app/components/common/Layout'
import { AppNav } from '@app/components/common/Navbar'
import Head from 'next/head'
import { F2Markets } from '@app/components/F2/F2Markets'
import { useAccount } from '@app/hooks/misc'
import { useAccountDBR } from '@app/hooks/useDBR'
import { DbrBar, FirmBar } from '@app/components/F2/Infos/InfoBar'
import { FirmFAQ } from '@app/components/F2/Infos/FirmFAQ'
import { SlideModal } from '@app/components/common/Modal/SlideModal'
import { useState } from 'react'
import useStorage from '@app/hooks/useStorage'
import { useDebouncedEffect } from '@app/hooks/useDebouncedEffect'
import { answerPoll } from '@app/util/analytics'
import { showToast } from '@app/util/notify'
import { POLLS, ACTIVE_POLL } from '@app/variables/poll-data'
import { FirmInsuranceCover } from '@app/components/common/InsuranceCover'
import { StatusMessage } from '@app/components/common/Messages'
import { SERVER_BASE_URL } from '@app/config/constants'
import { F2Market } from '@app/types'
import { useFirmTVL } from '@app/hooks/useTVL'
import { timeSince } from '@app/util/time'
import { DbrFloatingTrigger } from '@app/components/F2/DbrEasyBuyer.tsx/DbrEasyBuyer'

export const F2PAGE = ({
    isTwitterAlert = false,
    marketsData,
    firmTvlData,
    currentCirculatingSupply,
    dbrPriceUsd,
    dolaPriceUsd,
    globalMessage,
    globalMessageStatus,
    globalMessageTimestamp,
}: {
    isTwitterAlert: boolean,
    marketsData: { markets: F2Market[] },
    firmTvlData: any,
    currentCirculatingSupply: number,
    dbrPriceUsd: number,
    dolaPriceUsd: number,
    globalMessage: string,
    globalMessageStatus: string,
    globalMessageTimestamp: number,
}) => {
    const { firmTotalTvl, firmTvls, isLoading: isLoadingTvl } = useFirmTVL();
    const account = useAccount();
    const [radioValue, setRadioValue] = useState('');
    const { debt } = useAccountDBR(account);
    const { isOpen, onOpen, onClose } = useDisclosure();
    const { isOpen: crIsOpen, onOpen: crOnOpen, onClose: crOnClose } = useDisclosure();
    const { value: alreadyAnswered, setter } = useStorage(`poll-${ACTIVE_POLL}`);
    const { value: colReqShown, setter: setColReqShown } = useStorage(`collateral-req-popup`);

    useDebouncedEffect(() => {
        if (!alreadyAnswered && !!ACTIVE_POLL) {
            onOpen();
        }
    }, [alreadyAnswered, ACTIVE_POLL], 2000);

    useDebouncedEffect(() => {
        if (!colReqShown) {
            crOnOpen();
        }
    }, [colReqShown], 4000);

    const handleColReqClose = () => {
        setColReqShown(true);
        crOnClose();
    }

    const handleManualClose = () => {
        answerPoll(ACTIVE_POLL, 'abstain', () => {
            setter('abstain');
        });
        onClose();
    }

    const handleRadioChange = (value: string) => {
        setRadioValue(value);
        setTimeout(() => {
            answerPoll(ACTIVE_POLL, value, () => {
                setter(value);
                showToast({ status: 'success', title: 'Thank you for your answer!' });
            });
        }, 100);
        onClose();
    }

    return (
        <Layout>
            <Head>
                <title>Inverse Finance - FiRM</title>
                <meta name="og:description" content="FiRM is Inverse Finance's Fixed Rate Market, borrow DOLA with the DOLA Borrowing Right token DBR. Rethink the way you borrow!" />
                <meta name="description" content="FiRM is Inverse Finance's Fixed Rate Market, borrow DOLA with the DOLA Borrowing Right token DBR. Rethink the way you borrow!" />
                <meta name="og:image" content="https://inverse.finance/assets/social-previews/inverse-alert-v2.png" />
                {
                    isTwitterAlert &&
                    <>
                        <meta property="twitter:card" content="summary_large_image" />
                        <meta name="twitter:image" content="https://inverse.finance/assets/social-previews/inverse-alert-v2.png" />
                        <meta name="twitter:image:alt" content="FiRM" />
                    </>
                }
            </Head>
            <AppNav active="Markets" activeSubmenu="FiRM" />
            {/* {
                !colReqShown && <SlideModal closeOnOutsideClick={false} closeIconInside={true} isOpen={crIsOpen} onClose={handleColReqClose} contentProps={{ maxW: '500px', className: '', backgroundColor: 'navBarBackgroundColor' }}>
                    <VStack w='full' justify="flex-start" alignItems="flex-start">
                        <Text fontWeight="bold" fontSize='18px'>
                            Would you like to suggest a new Collateral on FiRM?
                        </Text>
                        <Link onClick={() => setColReqShown(true)} textDecoration="underline" href="/firm/request-collateral" isExternal target="_blank">
                            Yes, take me there!
                        </Link>
                    </VStack>
                </SlideModal>
            } */}
            {
                !!ACTIVE_POLL && POLLS[ACTIVE_POLL] && <SlideModal closeOnOutsideClick={false} closeIconInside={true} isOpen={isOpen} onClose={handleManualClose} contentProps={{ maxW: '500px', className: '', backgroundColor: 'navBarBackgroundColor' }}>
                    <VStack w='full' justify="flex-start" alignItems="flex-start">
                        <Text fontWeight="bold" fontSize='18px'>
                            {POLLS[ACTIVE_POLL].question}
                        </Text>
                        <RadioGroup onChange={handleRadioChange} value={radioValue} w='full'>
                            <VStack w='full' justify="flex-start" alignItems="flex-start">
                                {
                                    POLLS[ACTIVE_POLL].answers.map((answer) => {
                                        return <Box
                                            p='1'
                                            borderRadius='md'
                                            transition="background-color 200ms"
                                            key={answer.value}
                                            _hover={{ backgroundColor: 'navBarBorderColor' }}
                                            w='full'
                                        >
                                            <Radio cursor="pointer" value={answer.value}>
                                                <Text cursor="pointer">{answer.label}</Text>
                                            </Radio>
                                        </Box>
                                    })
                                }
                            </VStack>
                        </RadioGroup>
                    </VStack>
                </SlideModal>
            }
            <ErrorBoundary>
                <VStack pt={{ base: 4, md: 8 }} w='full' maxW={{ base: '84rem', '2xl': '90rem' }}>
                    {
                        !!globalMessage && (
                            <VStack w='full' px='6' pb='4'>
                                <StatusMessage
                                    alertProps={{
                                        w: 'full',
                                        whiteSpace: 'pre-wrap',
                                    }}
                                    status={globalMessageStatus || 'info'}
                                    description={
                                        <VStack w='full' spacing="0" alignItems="flex-start">
                                            <Text>{globalMessage}</Text>
                                            {/* <Text color="mainTextColorLight" fontSize="12px">{timeSince(globalMessageTimestamp)}</Text> */}
                                        </VStack>
                                    } />
                            </VStack>
                        )
                    }
                    <ErrorBoundary description="Failed to FiRM header">
                        <VStack px='6' w='full'>
                            <FirmBar dbrPriceUsd={dbrPriceUsd} dolaPriceUsd={dolaPriceUsd} currentCirculatingSupply={currentCirculatingSupply} firmTotalTvl={isLoadingTvl ? firmTvlData.firmTotalTvl : firmTotalTvl} markets={marketsData.markets} />
                        </VStack>
                    </ErrorBoundary>
                    <Divider display={{ base: 'inline-block', sm: 'none' }} />
                    {
                        !!account && debt > 0 && <ErrorBoundary description="Failed to load Dbr Health">
                            <VStack pt={{ md: '6' }} px='6' w='full'>
                                <DbrBar account={account} />
                            </VStack>
                        </ErrorBoundary>
                    }
                    <ErrorBoundary description="Failed to load Markets">
                        <F2Markets marketsData={marketsData} firmTvls={isLoadingTvl ? firmTvlData.firmTvls : firmTvls} />
                    </ErrorBoundary>
                    <ErrorBoundary description=" ">
                        <DbrFloatingTrigger />
                    </ErrorBoundary>
                    <VStack py="6" px='6' w='full' spacing="6">
                        <FirmInsuranceCover />
                        <FirmFAQ collapsable={true} defaultCollapse={false} />
                    </VStack>
                </VStack>
            </ErrorBoundary>
        </Layout>
    )
}

export async function getServerSideProps(context) {
    context.res.setHeader('Cache-Control', 'public, s-maxage=90, stale-while-revalidate=3600');
    const vnetPublicId = context.query?.vnetPublicId || '';

    const [
        marketsData,
        firmTvlData,
        currentCirculatingSupply,
        dbrData,
        dolaPriceData,
        marketsDisplaysData,
    ] = await Promise.all([
        fetch(`${SERVER_BASE_URL}/api/f2/fixed-markets?${vnetPublicId ? `vnetPublicId=${vnetPublicId}` : 'cacheFirst=true'}`).then(res => res.json()),
        fetch(`${SERVER_BASE_URL}/api/f2/tvl?cacheFirst=true`).then(res => res.json()),
        fetch(`${SERVER_BASE_URL}/api/dola/circulating-supply?cacheFirst=true`).then(res => res.text()),
        fetch(`${SERVER_BASE_URL}/api/dbr?cacheFirst=true`).then(res => res.json()),
        fetch(`${SERVER_BASE_URL}/api/dola-price?cacheFirst=true`).then(res => res.json()),
        fetch(`${SERVER_BASE_URL}/api/f2/markets-display`).then(res => res.json()),
    ]);
    const dbrPriceUsd = dbrData.priceUsd;
    const dolaPriceUsd = dolaPriceData['dola-usd'] || 1;
    return {
        props: {
            marketsData: marketsData,
            firmTvlData,
            currentCirculatingSupply: parseFloat(currentCirculatingSupply),
            dbrPriceUsd,
            dolaPriceUsd,
            globalMessage: marketsDisplaysData?.data?.globalMessage,
            globalMessageStatus: marketsDisplaysData?.data?.globalMessageStatus,
            globalMessageTimestamp: marketsDisplaysData?.data?.globalMessageTimestamp,
        },
    };
}

export default F2PAGE
