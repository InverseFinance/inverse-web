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
import { JuniorMessage } from '@app/components/JuniorTranches/JuniorMessage'
import { MonolithInvUSDMessage } from '@app/components/Monolith/MonolithInvUSDMessage'
import { JsonLd } from '@app/components/common/JsonLd'

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
            <JsonLd data={{
                "@context": "https://schema.org",
                "@type": "FinancialProduct",
                "name": "FiRM - Fixed Rate Market",
                "description": "FiRM is Inverse Finance's fixed-rate borrowing protocol where users deposit collateral and borrow DOLA stablecoins. Interest rates are fixed via DOLA Borrowing Rights (DBR) tokens — 1 DBR equals the right to borrow 1 DOLA for 1 year. Collateral is held in isolated Personal Collateral Escrows and is never loaned out.",
                "provider": {
                    "@type": "Organization",
                    "name": "Inverse Finance",
                    "url": "https://www.inverse.finance"
                },
                "category": "DeFi Fixed-Rate Lending",
                "url": "https://www.inverse.finance/firm",
                "feesAndCommissionsSpecification": "Borrowing cost is determined by the DBR token price. 1 DBR = right to borrow 1 DOLA for 1 year."
            }} />
            <JsonLd data={{
                "@context": "https://schema.org",
                "@type": "FAQPage",
                "mainEntity": [
                    {
                        "@type": "Question",
                        "name": "What is FiRM?",
                        "acceptedAnswer": {
                            "@type": "Answer",
                            "text": "FiRM is a Fixed-Rate Market for borrowing DOLA using DBR tokens, focused on simplicity and safety. All markets are isolated and collaterals cannot be borrowed by others."
                        }
                    },
                    {
                        "@type": "Question",
                        "name": "How safe is FiRM and is it audited?",
                        "acceptedAnswer": {
                            "@type": "Answer",
                            "text": "FiRM has a high score of 87% on DeFi Safety and has several unique safety features. Personal Collateral Escrows ensure that deposits are isolated per collateral and per user. Other safety features include flash loan protection, daily borrowing limits, and Pessimistic Price Oracles. Audited by Code4rena and Nomoi."
                        }
                    },
                    {
                        "@type": "Question",
                        "name": "What is DBR?",
                        "acceptedAnswer": {
                            "@type": "Answer",
                            "text": "DBR stands for DOLA Borrowing Rights. It is an ERC20 token used as tokenized interest. One DBR gives the right to borrow one DOLA for one year (or 2 DOLA for 6 months, etc). DBR tokens are consumed at a constant rate according to your loan size. This system provides fixed-rate borrowing."
                        }
                    },
                    {
                        "@type": "Question",
                        "name": "What is DOLA?",
                        "acceptedAnswer": {
                            "@type": "Answer",
                            "text": "DOLA is a debt-backed stablecoin soft-pegged to the US Dollar. Unlike algorithmic stablecoins, DOLA's value is backed by retractable debt, ensuring minimal volatility and a value close to $1."
                        }
                    },
                    {
                        "@type": "Question",
                        "name": "Is DBR an ERC20 token?",
                        "acceptedAnswer": {
                            "@type": "Answer",
                            "text": "Yes but not a standard one: your DBR wallet balance will decrease over time when you have an open loan position."
                        }
                    },
                    {
                        "@type": "Question",
                        "name": "How can I get DBR tokens?",
                        "acceptedAnswer": {
                            "@type": "Answer",
                            "text": "There are multiple ways to get DBR: by buying it on DEXes, by staking INV and getting DBR rewards, by buying it from DBR auctions, or via the auto-buy DBR feature when borrowing."
                        }
                    },
                    {
                        "@type": "Question",
                        "name": "Do I need to stake DBR?",
                        "acceptedAnswer": {
                            "@type": "Answer",
                            "text": "No, DBRs should stay in your wallet to pay the fee when you have a loan. Your DBR wallet balance will decrease only if you have a DOLA loan in FiRM."
                        }
                    },
                    {
                        "@type": "Question",
                        "name": "Why does my DBR balance decrease?",
                        "acceptedAnswer": {
                            "@type": "Answer",
                            "text": "DBRs are spent over time when you have a loan. The rate depends on your amount of debt. If you don't have a loan the balance does not decrease."
                        }
                    },
                    {
                        "@type": "Question",
                        "name": "What happens if I run out of DBRs?",
                        "acceptedAnswer": {
                            "@type": "Answer",
                            "text": "In case of a DBR deficit and an active loan, your DBR balance can be force recharged by someone through a costly process called replenishment, which uses a premium price for DBR. This cost is added to your debt, which can result in liquidations if not taken care of."
                        }
                    },
                    {
                        "@type": "Question",
                        "name": "Can I borrow DOLA with my INV tokens?",
                        "acceptedAnswer": {
                            "@type": "Answer",
                            "text": "Yes, borrowing DOLA with INV is possible when there's liquidity in the INV market."
                        }
                    },
                    {
                        "@type": "Question",
                        "name": "How do INV stakers benefit from FiRM?",
                        "acceptedAnswer": {
                            "@type": "Answer",
                            "text": "When staking INV on FiRM you are protected against dilution and you earn real yield via DBR streaming. The real yield you get is directly linked to FiRM's success as the yearly rewards increase when borrowing demand increases."
                        }
                    },
                    {
                        "@type": "Question",
                        "name": "Can I borrow for free?",
                        "acceptedAnswer": {
                            "@type": "Answer",
                            "text": "It's possible to borrow for free in DBR terms when you have enough INV staked, as the DBR rewards will be higher than the DBR burned for borrowing."
                        }
                    }
                ]
            }} />
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
                    <ErrorBoundary>
                        <MonolithInvUSDMessage cf={(marketsData?.markets?.find(m => m.isInv)?.collateralFactor||10)*100} />
                    </ErrorBoundary>
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
                            <FirmBar dbrPriceUsd={dbrPriceUsd} dolaPriceUsd={dolaPriceUsd} currentCirculatingSupply={currentCirculatingSupply} firmTotalTvl={isLoadingTvl ? firmTvlData?.firmTotalTvl || null : firmTotalTvl} markets={marketsData.markets} />
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
                        <F2Markets marketsData={marketsData} firmTvls={isLoadingTvl ? firmTvlData?.firmTvls || [] : firmTvls} />
                    </ErrorBoundary>
                    {
                        !!account && debt > 0 && <ErrorBoundary description=" ">
                            <DbrFloatingTrigger />
                        </ErrorBoundary>
                    }
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
    context.res.setHeader('Cache-Control', 'public, s-maxage=90, stale-while-revalidate=120');
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
