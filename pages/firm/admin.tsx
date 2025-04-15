import { VStack, Text, Flex, Stack, HStack, RadioGroup, Radio } from '@chakra-ui/react'
import { ErrorBoundary } from '@app/components/common/ErrorBoundary'
import Layout from '@app/components/common/Layout'
import { AppNav } from '@app/components/common/Navbar'
import Head from 'next/head'
import { FirmMarketsAndPositionsRenderer } from '@app/components/F2/FirmMarketsAndPositions'
import { useDBRMarkets } from '@app/hooks/useDBR'
import { InfoMessage, StatusMessage, WarningMessage } from '@app/components/common/Messages'
import { NavButtons, SubmitButton } from '@app/components/common/Button'
import { useEffect, useMemo, useState } from 'react'
import { fetcher } from '@app/util/web3'
import useSWR from 'swr'
import Table from '@app/components/common/Table'
import ScannerLink from '@app/components/common/ScannerLink'
import { Timestamp } from '@app/components/common/BlockTimestamp/Timestamp'
import Container from '@app/components/common/Container'
import { Textarea } from '@app/components/common/Input'
import { useWeb3React } from '@web3-react/core'
import { getSignMessageWithUtcDate } from '@app/util/misc'
import { ADMIN_ADS } from '@app/variables/names'
import { namedAddress } from '@app/util'

const ColHeader = ({ ...props }) => {
    return <Flex justify="flex-start" minWidth={'130px'} fontSize="14px" fontWeight="extrabold" {...props} />
}

const Cell = ({ ...props }) => {
    return <Stack direction="row" fontSize="14px" fontWeight="normal" justify="flex-start" minWidth="130px" {...props} />
}

const CellText = ({ ...props }) => {
    return <Text fontSize="14px" {...props} />
}

const updatesColumns = [
    {
        field: 'timestamp',
        label: 'Time',
        header: ({ ...props }) => <ColHeader minWidth="100px" justify="flex-start"  {...props} />,
        value: ({ timestamp }) => {
            return <Cell minWidth="100px" justify="flex-start" >
                <CellText><Timestamp showAbsoluteTime={false} text1Props={{ fontSize: '12px' }} text2Props={{ fontSize: '12px', color: 'mainTextColorLight' }} timestamp={timestamp} /></CellText>
            </Cell>
        },
    },
    {
        field: 'signer',
        label: 'Signer',
        header: ({ ...props }) => <ColHeader minWidth="90px" justify="flex-start"  {...props} />,
        value: ({ signer }) => {
            return <Cell minWidth="90px" justify="flex-start" >
                <ScannerLink value={signer} />
            </Cell>
        },
    },
    {
        field: 'type',
        label: 'Type',
        header: ({ ...props }) => <ColHeader minWidth="90px" justify="flex-start"  {...props} />,
        value: ({ type }) => {
            return <Cell minWidth="90px" justify="flex-start" >
                <CellText>{type}</CellText>
            </Cell>
        },
    },
    {
        field: 'marketAddress',
        label: 'Market',
        header: ({ ...props }) => <ColHeader minWidth="100px" justify="flex-start"  {...props} />,
        value: ({ marketAddress }) => {
            return <Cell minWidth="100px" maxW="100px" justify="flex-start" >
                {marketAddress ? <ScannerLink textAlign="left" fontSize="12px" value={marketAddress} label={namedAddress(marketAddress, 1).replace(/(FiRM|Market)/ig, '')} /> : <CellText>-</CellText>}
            </Cell>
        },
    },
    {
        field: 'isPhasingOut',
        label: 'Hidden',
        header: ({ ...props }) => <ColHeader minWidth="70px" justify="flex-start"  {...props} />,
        value: ({ marketAddress, isPhasingOut }) => {
            return <Cell minWidth="70px" justify="flex-start" >
                <CellText color={isPhasingOut ? 'warning' : undefined}>{marketAddress ? (isPhasingOut ? 'Hidden' : 'Default') : '-'}</CellText>
            </Cell>
        },
    },
    {
        field: 'noDeposit',
        label: 'Deposits',
        header: ({ ...props }) => <ColHeader minWidth="90px" justify="flex-start"  {...props} />,
        value: ({ marketAddress, noDeposit, type }) => {
            return <Cell minWidth="90px" justify="flex-start" >
                <CellText color={noDeposit ? 'warning' : undefined}>{type !== 'message' ? (noDeposit ? 'Suspended' : 'Default') : '-'}</CellText>
            </Cell>
        },
    },
    {
        field: 'isLeverageSuspended',
        label: 'ALE',
        header: ({ ...props }) => <ColHeader minWidth="90px" justify="flex-start"  {...props} />,
        value: ({ marketAddress, isLeverageSuspended, type }) => {
            return <Cell minWidth="90px" justify="flex-start" >
                <CellText color={isLeverageSuspended ? 'warning' : undefined}>{type !== 'message' ? (isLeverageSuspended ? 'Suspended' : 'Default') : '-'}</CellText>
            </Cell>
        },
    },
    {
        field: 'isBorrowingSuspended',
        label: 'Borrowing',
        header: ({ ...props }) => <ColHeader minWidth="90px" justify="flex-start"  {...props} />,
        value: ({ marketAddress, isBorrowingSuspended, type }) => {
            return <Cell minWidth="90px" justify="flex-start" >
                <CellText color={isBorrowingSuspended ? 'warning' : undefined}>{type !== 'message' ? (isBorrowingSuspended ? 'Suspended' : 'Default') : '-'}</CellText>
            </Cell>
        },
    },
    {
        field: 'message',
        label: 'Message',
        header: ({ ...props }) => <ColHeader minWidth="300px" justify="flex-start"  {...props} />,
        value: ({ message }) => {
            return <Cell minWidth="300px" justify="flex-start" >
                <CellText maxW="300px" whiteSpace="pre-wrap">{message || '-'}</CellText>
            </Cell>
        },
    },
];

const isWhitelisted = (account: string) => {
    return ADMIN_ADS.map(a => a.toLowerCase()).includes(account.toLowerCase());
}

const IntroMessage = () => <InfoMessage
    title="FiRM UI Temporary Measures Admin"
    alertProps={{
        w: 'full',
    }}
    description={
        <VStack spacing="0" w='full' alignItems='flex-start'>
            <Text>- Connect with a whitelisted PWG, RWG, GWG or TWG address</Text>
            <Text>- Sign to confirm</Text>
            <Text>- Updates can take 1-2 minutes to fully reflect</Text>
        </VStack>
    }
/>

const FirmAdminSection = () => {
    const { provider } = useWeb3React();
    const [nonce, setNonce] = useState(0);
    const { markets, isLoading, timestamp } = useDBRMarkets();
    const { data: marketsDisplaysData } = useSWR(`/api/f2/markets-display?n=${nonce}`, fetcher);
    const [activeTab, setActiveTab] = useState<'Markets' | 'Updates' | 'Global Message' | 'Global Settings'>('Markets');
    const [globalMessage, setGlobalMessage] = useState('');
    const [suspendAllBorrows, setSuspendAllBorrows] = useState('no');
    const [suspendAllDeposits, setSuspendAllDeposits] = useState('no');
    const [suspendAllLeverage, setSuspendAllLeverage] = useState('no');
    const [globalMessageStatus, setGlobalMessageStatus] = useState<'warning' | 'error' | 'info' | 'success'>('info');
    const [inited, setInited] = useState(false);

    const updates = useMemo(() => {
        return marketsDisplaysData?.data?.updates || [];
    }, [marketsDisplaysData]);

    useEffect(() => {
        if (!inited && !!marketsDisplaysData) {
            setGlobalMessage(marketsDisplaysData?.data?.globalMessage || '');
            setGlobalMessageStatus(marketsDisplaysData?.data?.globalMessageStatus || 'info');
            setSuspendAllBorrows(marketsDisplaysData?.data?.suspendAllBorrows ? 'yes' : 'no');
            setSuspendAllDeposits(marketsDisplaysData?.data?.suspendAllDeposits ? 'yes' : 'no');
            setSuspendAllLeverage(marketsDisplaysData?.data?.suspendAllLeverage ? 'yes' : 'no');
            setInited(true);
        }
    }, [inited, marketsDisplaysData]);

    const saveGlobalMessage = async () => {
        const sig = await provider?.getSigner()?.signMessage(getSignMessageWithUtcDate());
        if (!sig) {
            return;
        }
        const res = await fetch('/api/f2/markets-display', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify({
                type: 'message',
                sig,
                globalMessage,
                globalMessageStatus,
            }),
        });
        setNonce(nonce + 1);
        return await res.json();
    }

    const saveGlobalSettings = async () => {
        const sig = await provider?.getSigner()?.signMessage(getSignMessageWithUtcDate());
        if (!sig) {
            return;
        }
        const res = await fetch('/api/f2/markets-display', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify({
                type: 'all-markets',
                sig,
                suspendAllBorrows,
                suspendAllDeposits,
                suspendAllLeverage,
            }),
        });
        setNonce(nonce + 1);
        return await res.json();
    }

    return <>
        <VStack maxW="600px" w="full" justify="space-between" alignItems="flex-end">
            <NavButtons
                options={['Markets', 'Global Message', 'Global Settings', 'Updates']}
                active={activeTab}
                onClick={(s) => {
                    setNonce(nonce + 1);
                    setActiveTab(s);
                }}
            />
        </VStack>
        {
            activeTab === 'Markets' && (
                <FirmMarketsAndPositionsRenderer
                    defaultTab={'Markets'}
                    markets={markets}
                    positions={[]}
                    isLoading={isLoading}
                    timestamp={timestamp}
                    onlyShowDefaultTab={true}
                    useAdminMarketsColumns={true}
                    marketsDisplaysData={marketsDisplaysData?.data}
                />
            )
        }
        {
            activeTab === 'Updates' && (
                <Container w="full" p="0" noPadding>
                    <Table
                        noDataMessage="No overrides found"
                        columns={updatesColumns}
                        items={updates}
                        defaultSort="timestamp"
                        defaultSortDir="desc"
                        showRowBorder={true}
                        spacing="0"
                    />
                </Container>
            )
        }
        {
            activeTab === 'Global Message' && (
                <Container w="full" p="0" noPadding>
                    <VStack w="full" spacing="4" alignItems="flex-start">
                        <HStack spacing="4" justify="space-between">
                            <Text color="mainTextColorLight">Message type:</Text>
                            <RadioGroup value={globalMessageStatus} onChange={(e) => setGlobalMessageStatus(e)}>
                                <HStack spacing="4">
                                    <Radio value="info">Info</Radio>
                                    <Radio value="warning">Warning</Radio>
                                    <Radio value="error">Error</Radio>
                                    <Radio value="success">Success</Radio>
                                </HStack>
                            </RadioGroup>
                        </HStack>
                        <Textarea fontSize="14px" placeholder="Important message to show on the main FiRM page" maxLength={500} value={globalMessage} onChange={(e) => setGlobalMessage(e.target.value)} />
                        <Text fontSize="12px" color="mainTextColorLight">{globalMessage.length} / 500</Text>
                        {
                            !!globalMessage && <>
                                <Text>Preview:</Text>
                                <StatusMessage
                                    alertProps={{
                                        w: 'full',
                                        whiteSpace: 'pre',
                                    }}
                                    status={globalMessageStatus}
                                    description={globalMessage}
                                />
                            </>
                        }
                        <SubmitButton
                            w="fit-content"
                            disabled={marketsDisplaysData?.data?.globalMessage === globalMessage}
                            onClick={saveGlobalMessage}
                        >
                            {globalMessage ? marketsDisplaysData?.data?.globalMessage ? 'Update Message' : 'Add Message' : 'Delete Message'}
                        </SubmitButton>
                    </VStack>
                </Container>
            )
        }
        {
            activeTab === 'Global Settings' && (
                <Container w="full" p="0" noPadding>
                    <VStack w="full" spacing="4" alignItems="flex-start">
                        <WarningMessage
                            alertProps={{
                                w: 'full',
                            }}
                            description="Note: This is an emergency measure to act all on all markets"
                        />
                        <VStack alignItems="flex-start" w='full' spacing="2">
                            <Text fontWeight="bold">Suspend all Borrows?</Text>
                            <RadioGroup w='full' bgColor="mainBackground" p="2" onChange={setSuspendAllBorrows} value={suspendAllBorrows}>
                                <Stack direction='row' w='full' spacing="4">
                                    <Radio value='yes'>Yes</Radio>
                                    <Radio value='no'>No</Radio>
                                </Stack>
                            </RadioGroup>
                        </VStack>
                        <VStack alignItems="flex-start" w='full' spacing="2">
                            <Text fontWeight="bold">Suspend all ALE?</Text>
                            <RadioGroup w='full' bgColor="mainBackground" p="2" onChange={setSuspendAllLeverage} value={suspendAllLeverage}>
                                <Stack direction='row' w='full' spacing="4">
                                    <Radio value='yes'>Yes</Radio>
                                    <Radio value='no'>No</Radio>
                                </Stack>
                            </RadioGroup>
                        </VStack>
                        <VStack alignItems="flex-start" w='full' spacing="2">
                            <Text fontWeight="bold">Suspend all Deposits?</Text>
                            <RadioGroup w='full' bgColor="mainBackground" p="2" onChange={setSuspendAllDeposits} value={suspendAllDeposits}>
                                <Stack direction='row' w='full' spacing="4">
                                    <Radio value='yes'>Yes</Radio>
                                    <Radio value='no'>No</Radio>
                                </Stack>
                            </RadioGroup>
                        </VStack>
                        <SubmitButton
                            w="fit-content"
                            onClick={saveGlobalSettings}
                        >
                            Save Global Settings
                        </SubmitButton>
                    </VStack>
                </Container>
            )
        }
    </>
}

export const FirmAdminPage = () => {
    const { account } = useWeb3React();
    const isWhitelistedAddress = useMemo(() => account ? isWhitelisted(account) : false, [account]);

    return (
        <Layout>
            <Head>
                <title>Inverse Finance - Firm Admin</title>
            </Head>
            <AppNav hideAnnouncement={true} active="Markets" activeSubmenu="Liquidate Loans" />
            <ErrorBoundary>
                <VStack spacing="8" w='full' maxW="1200px" mt="4" alignItems='center'>
                    <VStack maxW="600px" w="full" justify="space-between" alignItems="flex-end">
                        <IntroMessage />
                        {
                            !!account && !isWhitelistedAddress && <WarningMessage
                                alertProps={{ w: 'full' }}
                                title="Unauthorized Account"
                                description="Make sure to connect with your known PWG, RWG or TWG account"
                            />
                        }
                    </VStack>
                    {isWhitelistedAddress && <FirmAdminSection />}
                </VStack>
            </ErrorBoundary>
        </Layout>
    )
}

export default FirmAdminPage
