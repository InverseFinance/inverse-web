import { Divider, VStack, Text, useDisclosure, RadioGroup, Radio, Box } from '@chakra-ui/react'
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

export const F2PAGE = ({
    isTwitterAlert = false
}) => {
    const account = useAccount();
    const [radioValue, setRadioValue] = useState('');
    const { debt } = useAccountDBR(account);
    const { isOpen, onOpen, onClose } = useDisclosure();
    const { value: alreadyAnswered, setter } = useStorage(`poll-${ACTIVE_POLL}`);

    useDebouncedEffect(() => {
        if (!alreadyAnswered && !!ACTIVE_POLL) {
            onOpen();
        }
    }, [alreadyAnswered, ACTIVE_POLL], 2000);

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
                <meta name="og:image" content="https://inverse.finance/assets/social-previews/firm-page.png" />
                {
                    isTwitterAlert &&
                        <>
                            <meta property="twitter:card" content="summary_large_image" />
                            <meta name="twitter:image" content="https://inverse.finance/assets/social-previews/inverse-alert.jpg" />
                            <meta name="twitter:image:alt" content="FiRM" />
                        </>                        
                }      
            </Head>
            <AppNav active="Markets" activeSubmenu="FiRM" />
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
                <VStack pt={{ base: 4, md: 8, '2xl': 20 }} w='full' maxW={{ base: '84rem', '2xl': '90rem' }}>
                    <ErrorBoundary description="Failed to FiRM header">
                        <VStack px='6' w='full'>
                            <FirmBar />
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
                    <ErrorBoundary description="Failed to Markets">
                        <F2Markets />
                    </ErrorBoundary>
                    <VStack py="6" px='6' w='full'>
                        <FirmFAQ collapsable={true} defaultCollapse={false} />
                    </VStack>
                </VStack>
            </ErrorBoundary>
        </Layout>
    )
}

export default F2PAGE
