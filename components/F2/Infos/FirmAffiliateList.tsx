import { Flex, HStack, SimpleGrid, Stack, Text, useDisclosure, VStack } from "@chakra-ui/react"
import { shortenNumber, smartShortNumber } from "@app/util/markets";
import Container from "@app/components/common/Container";
import { useFirmAffiliate, useFirmUsers } from "@app/hooks/useFirm";
import Link from "@app/components/common/Link";
import { ViewIcon } from "@chakra-ui/icons";
import ScannerLink from "@app/components/common/ScannerLink";
import moment from 'moment'
import Table from "@app/components/common/Table";
import { SkeletonBlob } from "@app/components/common/Skeleton";
import { SmallTextLoader } from "@app/components/common/Loaders/SmallTextLoader";
import { useDBRPrice } from "@app/hooks/useDBR";
import { Timestamp } from "@app/components/common/BlockTimestamp/Timestamp";
import { commify } from "@ethersproject/units";
import InfoModal from "@app/components/common/Modal/InfoModal";
import { useState } from "react";
import { ReferredUsersTable } from "./FirmAffiliateDashboard";
import { RSubmitButton } from "@app/components/common/Button/RSubmitButton";
import { useWeb3React } from "@web3-react/core";

const StatBasic = ({ value, name, onClick = undefined, isLoading = false }: { value: string, onClick?: () => void, name: string, isLoading?: boolean }) => {
    return <VStack>
        {
            !isLoading ? <Text color={'secondary'} fontSize={{ base: '20px', sm: '26px' }} fontWeight="extrabold">{value}</Text>
                : <SmallTextLoader width={'100px'} />
        }
        <Text cursor={!!onClick ? 'pointer' : undefined} textDecoration={!!onClick ? 'underline' : undefined} onClick={onClick} color={'mainTextColor'} fontSize={{ base: '16px', sm: '20px' }} fontWeight="bold">{name}</Text>
    </VStack>
}

const ColHeader = ({ ...props }) => {
    return <Flex justify="flex-start" minWidth={'100px'} fontSize="14px" fontWeight="extrabold" {...props} />
}

const Cell = ({ ...props }) => {
    return <Stack direction="row" fontSize="14px" fontWeight="normal" justify="flex-start" minWidth="100px" {...props} />
}

const CellText = ({ ...props }) => {
    return <Text fontSize="16px" {...props} />
}

export const getAffiliateStatusMsg = (referrer: string, newStatus: string) => {
    return `Affiliate Program Status Change signature\n\nAffiliate account:\n${referrer}\n\nNew status:\n${newStatus}`;
}

const columns = [
    {
        field: 'affiliate',
        label: 'Affiliate',
        header: ({ ...props }) => <ColHeader justify="flex-start" {...props} minWidth="130px" />,
        value: ({ affiliate }) => {
            return <Cell w="130px" justify="flex-start" position="relative" onClick={(e) => e.stopPropagation()}>
                <Link isExternal href={`/affiliate?viewAddress=${affiliate}`}>
                    <ViewIcon color="blue.600" boxSize={3} />
                </Link>
                <ScannerLink value={affiliate} />
            </Cell>
        },
        showFilter: true,
        filterWidth: '100px',
    },
    {
        field: 'status',
        label: 'Status',
        header: ({ ...props }) => <ColHeader minWidth="100px" justify="center"  {...props} />,
        value: ({ status }) => {
            return <Cell minWidth="100px" justify="center">
                <CellText color={ status === 'approved' ? 'success' : status === 'rejected' ? 'warning' : undefined }>{status}</CellText>
            </Cell>
        },
        showFilter: true,
        filterWidth: '100px',
    },
    {
        field: 'affiliateType',
        label: 'Type',
        header: ({ ...props }) => <ColHeader minWidth="100px" justify="center"  {...props} />,
        value: ({ affiliateType }) => {
            return <Cell minWidth="100px" justify="center">
                <CellText>{affiliateType}</CellText>
            </Cell>
        },
        showFilter: true,
        filterWidth: '100px',
    },
    {
        field: 'timestamp',
        label: 'Application Date',
        header: ({ ...props }) => <ColHeader justify="flex-start" minWidth={'100px'} {...props} />,
        value: ({ timestamp }) => <Cell justify="flex-start" minWidth="100px">
            <Timestamp timestamp={timestamp} text1Props={{ fontSize: '12px' }} text2Props={{ fontSize: '12px' }} />
        </Cell>,
    },    
    {
        field: 'nbReferred',
        label: 'Referred Users',
        header: ({ ...props }) => <ColHeader minWidth="100px" justify="center"  {...props} />,
        value: ({ nbReferred }) => {
            return <Cell minWidth="100px" justify="center">
                <CellText>{nbReferred > 0 ? nbReferred : '-'}</CellText>
            </Cell>
        },
    },
    {
        field: 'affiliateRewards',
        label: 'Acc. DBR reward',
        header: ({ ...props }) => <ColHeader minWidth="100px" justify="center"  {...props} />,
        value: ({ affiliateRewards }) => {
            return <Cell minWidth="100px" justify="center">
                <CellText>{affiliateRewards > 0 ? shortenNumber(affiliateRewards, 2) : '-'}</CellText>
            </Cell>
        },
    },
    {
        field: 'paidRewards',
        label: 'Paid DBR rewards',
        header: ({ ...props }) => <ColHeader minWidth="100px" justify="center"  {...props} />,
        value: ({ paidRewards }) => {
            return <Cell minWidth="100px" justify="center">
                <CellText>{paidRewards > 0 ? shortenNumber(paidRewards, 2) : '-'}</CellText>
            </Cell>
        },
    },
    {
        field: 'pendingRewards',
        label: 'Pending DBR rewards',
        header: ({ ...props }) => <ColHeader minWidth="100px" justify="center"  {...props} />,
        value: ({ pendingRewards }) => {
            return <Cell minWidth="100px" justify="center">
                <CellText>{pendingRewards > 0 ? shortenNumber(pendingRewards, 2) : '-'}</CellText>
            </Cell>
        },
    },
]

const columnsPayments = [
    {
        field: 'txHash',
        label: 'Transaction',
        header: ({ ...props }) => <ColHeader justify="flex-start" {...props} minWidth="130px" />,
        value: ({ txHash }) => {
            return <Cell w="130px" justify="flex-start" position="relative" onClick={(e) => e.stopPropagation()}>
                <ScannerLink value={txHash} type="tx" />
            </Cell>
        },
        showFilter: true,
        filterWidth: '100px',
    },
    {
        field: 'timestamp',
        label: 'Date',
        header: ({ ...props }) => <ColHeader justify="flex-start" minWidth={'100px'} {...props} />,
        value: ({ timestamp }) => <Cell justify="flex-start" minWidth="100px">
            <Timestamp timestamp={timestamp} text1Props={{ fontSize: '12px' }} text2Props={{ fontSize: '12px' }} />
        </Cell>,
    },
    {
        field: 'affiliate',
        label: 'Affiliate',
        header: ({ ...props }) => <ColHeader justify="flex-start" {...props} minWidth="130px" />,
        value: ({ affiliate }) => {
            return <Cell w="130px" justify="flex-start" position="relative" onClick={(e) => e.stopPropagation()}>
                <Link isExternal href={`/firm?viewAddress=${affiliate}`}>
                    <ViewIcon color="blue.600" boxSize={3} />
                </Link>
                <ScannerLink value={affiliate} />
            </Cell>
        },
        showFilter: true,
        filterWidth: '100px',
    },
    {
        field: 'amount',
        label: 'Amount',
        header: ({ ...props }) => <ColHeader minWidth="100px" justify="center"  {...props} />,
        value: ({ amount }) => {
            return <Cell minWidth="100px" justify="center" alignItems="center" direction="column" spacing="0">
                <CellText>{amount > 0 ? commify(amount, 2, true) : '-'}</CellText>
            </Cell>
        },
    },
]

export const changeAffiliateStatus = async (affiliate: string, signer: string, newStatus: string, sig: string) => {
    const res = await fetch(`/api/referral?statuate=true&r=${affiliate}`, {
        method: 'POST',
        body: JSON.stringify({ sig, newStatus, signer }),
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
    });
    try {
        return await res.json();
    } catch (e) {
        return res;
    }
}

export const FirmAffiliateList = ({

}: {

    }) => {
    const { account, provider } = useWeb3React()
    const { priceUsd: dbrPriceUsd } = useDBRPrice();
    const [updateIndex, setUpdateIndex] = useState(0);
    const { referrals, referralAddresses, affiliatePaymentEvents, affiliatesPublicData, timestamp } = useFirmAffiliate('all', updateIndex);
    const { userPositions, isLoading } = useFirmUsers();
    const [selectedAffiliate, setSelectedAffiliate] = useState('');
    const [selectedAffiliateItem, setSelectedAffiliateItem] = useState({});
    const { isOpen, onOpen, onClose } = useDisclosure();

    const referredPositions = userPositions
        .filter(up => referralAddresses.includes(up.user))
        .map(up => {
            const refData = referrals.find(rd => rd.referred === up.user);
            const accSinceRef = (up.dueTokensAccrued - refData.beforeReferralDueTokensAccrued);
            const affiliateRewards = accSinceRef * 0.1;
            return {
                ...up,
                affiliateRewards,
                accSinceRef,
                refTimestamp: refData.timestamp,
                affiliate: refData.affiliate,
            }
        });

    const affiliateList = affiliatesPublicData.map(affiliateData => {
        const affiliate = affiliateData.affiliate;
        const referredList = referredPositions.filter(rp => rp.affiliate === affiliate);
        const affiliateRewards = referredList.reduce((prev, curr) => prev + curr.affiliateRewards, 0);
        const paidRewards = affiliatePaymentEvents.filter(pe => pe.affiliate === affiliate).reduce((prev, curr) => prev + curr.amount, 0);
        return {
            ...affiliateData,
            nbReferred: referredList.length,
            accSinceRef: referredList.reduce((prev, curr) => prev + curr.accSinceRef, 0),
            affiliateRewards,
            paidRewards,
            pendingRewards: affiliateRewards - paidRewards,
        }
    })

    const totalTvl = referredPositions.reduce((prev, curr) => prev + (curr.depositsUsd), 0);
    const totalDebt = referredPositions.reduce((prev, curr) => prev + curr.debt, 0);
    const totalAffiliateRewards = Math.max(affiliateList.reduce((prev, curr) => prev + curr.affiliateRewards, 0), 0);
    const totalPaidRewards = affiliateList.reduce((prev, curr) => prev + curr.paidRewards, 0);
    const totalPendingRewards = affiliateList.reduce((prev, curr) => prev + curr.pendingRewards, 0);

    const selectedAffiliateReferrals = referredPositions.filter(rp => rp.affiliate === selectedAffiliate);

    const changeStatus = async (newStatus: string) => {
        if (provider && !!account) {
            const signer = provider?.getSigner();
            const sig = await signer.signMessage(getAffiliateStatusMsg(selectedAffiliate, newStatus)).catch(() => '');
            if (!!sig) {
                return changeAffiliateStatus(selectedAffiliate, account, newStatus, sig);
            }
        } else {
            window.alert('Wallet not connected')
        }
    }

    const handleStatusUpdate = () => {
        onClose();
        setUpdateIndex(updateIndex+1);
    }

    return <VStack w='full' spacing={{ base: '4', sm: '8' }}>
        <SimpleGrid justify="space-between" w='full' columns={{ base: 2, sm: 4 }} spacing={{ base: '4', sm: '6' }}>
            <StatBasic isLoading={isLoading} name="DBR price" value={`${smartShortNumber(dbrPriceUsd, 4, true)}`} />
            <StatBasic isLoading={isLoading} name="Acc. rewards" value={!totalAffiliateRewards ? '-' : `${smartShortNumber(totalAffiliateRewards, 2)} (${smartShortNumber(totalAffiliateRewards * dbrPriceUsd, 2, true)})`} />
            <StatBasic isLoading={isLoading} name="Paid rewards" value={!totalPaidRewards ? '-' : `${smartShortNumber(totalPaidRewards, 2)} (${smartShortNumber(totalPaidRewards * dbrPriceUsd, 2, true)})`} />
            <StatBasic isLoading={isLoading} name="Pending rewards" value={!totalPendingRewards ? '-' : `${smartShortNumber(totalPendingRewards, 2)} (${smartShortNumber(totalPendingRewards * dbrPriceUsd, 2, true)})`} />
        </SimpleGrid>
        <InfoModal okLabel="Close" modalProps={{ minW: { base: '98vw', xl: selectedAffiliateItem?.status === 'pending' ? '500px' : '1200px' } }} title={selectedAffiliateItem?.status === 'pending' ? 'Affiliate Status' : 'Affiliate Referrals'} isOpen={isOpen} onClose={onClose} onOk={onClose}>
            <VStack alignItems="flex-start" p="4" spacing="4">
                {
                    selectedAffiliateItem?.status !== 'approved' ? <VStack spacing="4" p="4" alignItems="center" w='full'>
                        <Text fontSize="22px">Current status: <b>{selectedAffiliateItem?.status}</b></Text>
                        {
                            selectedAffiliateItem?.status === 'pending' && <HStack spacing="4">
                                <RSubmitButton w='150px' onSuccess={() => handleStatusUpdate()} onClick={() => changeStatus('approved')}>
                                    Approve
                                </RSubmitButton>
                                <RSubmitButton bgColor="warning" w='150px' onSuccess={() => handleStatusUpdate()} onClick={() => changeStatus('rejected')}>
                                    Reject
                                </RSubmitButton>
                            </HStack>
                        }
                    </VStack> :
                        <ReferredUsersTable referredPositions={selectedAffiliateReferrals} />
                }
            </VStack>
        </InfoModal>
        <Container
            py="0"
            label="Affiliates"
            description={timestamp ? `Last update ${moment(timestamp).fromNow()}` : `Loading...`}
            contentProps={{ maxW: { base: '90vw', sm: '100%' }, overflowX: 'auto' }}
            headerProps={{
                direction: { base: 'column', md: 'row' },
                align: { base: 'flex-start', md: 'flex-end' },
            }}
        >
            {
                isLoading ?
                    <SkeletonBlob />
                    :
                    <Table
                        keyName="affiliate"
                        noDataMessage="No affiliates yet"
                        columns={columns}
                        items={affiliateList}
                        onClick={(item) => {
                            setSelectedAffiliate(item.affiliate);
                            setSelectedAffiliateItem(item);
                            onOpen();
                        }}
                        defaultSort="affiliateRewards"
                        defaultSortDir="desc"
                    />
            }
        </Container>
        <Container
            py="0"
            label="Reward Payments by GWG"
            description={timestamp ? `Last update ${moment(timestamp).fromNow()}` : `Loading...`}
            contentProps={{ maxW: { base: '90vw', sm: '100%' }, overflowX: 'auto' }}
            headerProps={{
                direction: { base: 'column', md: 'row' },
                align: { base: 'flex-start', md: 'flex-end' },
            }}
        >
            {
                isLoading ?
                    <SkeletonBlob />
                    :
                    <Table
                        keyName="transactionHash"
                        noDataMessage="No payments made yet"
                        columns={columnsPayments}
                        items={affiliatePaymentEvents}
                        defaultSort="blockNumber"
                        defaultSortDir="desc"
                    />
            }
        </Container>
    </VStack>
}