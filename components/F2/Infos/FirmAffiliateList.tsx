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

const columns = [
    {
        field: 'affiliate',
        label: 'Affiliate',
        header: ({ ...props }) => <ColHeader justify="flex-start" {...props} minWidth="130px" />,
        value: ({ affiliate }) => {
            return <Cell w="130px" justify="flex-start" position="relative" onClick={(e) => e.stopPropagation()}>
                <Link isExternal href={`/partners/affiliate?viewAddress=${affiliate}`}>
                    <ViewIcon color="blue.600" boxSize={3} />
                </Link>
                <ScannerLink value={affiliate} />
            </Cell>
        },
        showFilter: true,
        filterWidth: '100px',
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

export const FirmAffiliateList = ({

}: {

    }) => {
    const { priceUsd: dbrPriceUsd } = useDBRPrice();
    const { referrals, referralAddresses, affiliatePaymentEvents, affiliateAddresses } = useFirmAffiliate('all');
    const { userPositions, timestamp, isLoading } = useFirmUsers();
    const [selectedAffiliate, setSelectedAffiliate] = useState('');
    const { isOpen, onOpen, onClose } = useDisclosure();

    const referredPositions = userPositions
        .filter(up => referralAddresses.includes(up.user))
        .map(up => {
            const refData = referrals.find(rd => rd.referred === up.user);
            const accSinceRef = (up.dueTokensAccrued - refData.beforeReferralDueTokensAccrued);
            const affiliateReward = accSinceRef * 0.1;
            return {
                ...up,
                affiliateReward,
                accSinceRef,
                refTimestamp: refData.timestamp,
                affiliate: refData.affiliate,
            }
        });

    const affiliateList = affiliateAddresses.map(affiliate => {
        const referredList = referredPositions.filter(rp => rp.affiliate === affiliate);
        const affiliateRewards = referredList.reduce((prev, curr) => prev + curr.affiliateReward, 0);
        const paidRewards = affiliatePaymentEvents.filter(pe => pe.affiliate === affiliate).reduce((prev, curr) => prev + curr.amount, 0);
        return {
            affiliate,
            nbReferred: referredList.length,
            accSinceRef: referredList.reduce((prev, curr) => prev + curr.accSinceRef, 0),
            affiliateRewards,
            paidRewards,
            pendingRewards: affiliateRewards - paidRewards,
        }
    })

    const totalTvl = referredPositions.reduce((prev, curr) => prev + (curr.depositsUsd), 0);
    const totalDebt = referredPositions.reduce((prev, curr) => prev + curr.debt, 0);
    const totalAffiliateRewards = referredPositions.reduce((prev, curr) => prev + curr.affiliateReward, 0);    
    const totalPaidRewards = referredPositions.reduce((prev, curr) => prev + curr.paidRewards, 0);    
    const totalPendingRewards = referredPositions.reduce((prev, curr) => prev + curr.pendingRewards, 0);
    
    const selectedAffiliateReferrals = referredPositions.filter(rp => rp.affiliate === selectedAffiliate);

    return <VStack w='full' spacing={{ base: '4', sm: '8' }}>
        <SimpleGrid justify="space-between" w='full' columns={{ base: 2, sm: 4 }}  spacing={{ base: '4', sm: '6' }}>
            <StatBasic isLoading={isLoading} name="DBR price" value={`${smartShortNumber(dbrPriceUsd, 4, true)}`} />            
            <StatBasic isLoading={isLoading} name="Acc. rewards" value={!totalAffiliateRewards ? '-' : `${smartShortNumber(totalAffiliateRewards, 2)} (${smartShortNumber(totalAffiliateRewards * dbrPriceUsd, 2, true)})`} />
            <StatBasic isLoading={isLoading} name="Paid rewards" value={!totalPaidRewards ? '-' : `${smartShortNumber(totalPaidRewards, 2)} (${smartShortNumber(totalPaidRewards * dbrPriceUsd, 2, true)})`} />
            <StatBasic isLoading={isLoading} name="Pending rewards" value={!totalPendingRewards ? '-' : `${smartShortNumber(totalPendingRewards, 2)} (${smartShortNumber(totalPendingRewards * dbrPriceUsd, 2, true)})`} />
        </SimpleGrid>
        <InfoModal modalProps={{ minW: { base: '98vw', xl: '1200px' } }} title="Affiliate Referrals" isOpen={isOpen} onClose={onClose} onOk={onClose}>
            <ReferredUsersTable referredPositions={selectedAffiliateReferrals} />
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