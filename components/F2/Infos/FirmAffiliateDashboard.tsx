import { Divider, Flex, HStack, SimpleGrid, Stack, Text, useDisclosure, VStack } from "@chakra-ui/react"
import { shortenNumber, smartShortNumber } from "@app/util/markets";
import Container from "@app/components/common/Container";
import { useFirmAffiliate, useFirmUsers } from "@app/hooks/useFirm";
import Link from "@app/components/common/Link";
import { ViewIcon } from "@chakra-ui/icons";
import ScannerLink from "@app/components/common/ScannerLink";
import moment from 'moment'
import { useState } from "react";
import Table from "@app/components/common/Table";
import { SkeletonBlob } from "@app/components/common/Skeleton";
import { SmallTextLoader } from "@app/components/common/Loaders/SmallTextLoader";
import { MarketImage } from "@app/components/common/Assets/MarketImage";
import { FirmUserModal } from "./FirmUserModal";
import { useDBRPrice } from "@app/hooks/useDBR";
import { useAccount } from "@app/hooks/misc";
import { Timestamp } from "@app/components/common/BlockTimestamp/Timestamp";
import { commify } from "@ethersproject/units";

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
        field: 'user',
        label: 'Referred User',
        header: ({ ...props }) => <ColHeader justify="flex-start" {...props} minWidth="130px" />,
        value: ({ user }) => {
            return <Cell w="130px" justify="flex-start" position="relative" onClick={(e) => e.stopPropagation()}>
                <Link isExternal href={`/firm?viewAddress=${user}`}>
                    <ViewIcon color="blue.600" boxSize={3} />
                </Link>
                <ScannerLink value={user} />
            </Cell>
        },
        showFilter: true,
        filterWidth: '100px',
    },
    {
        field: 'refTimestamp',
        label: 'Referral Date',
        header: ({ ...props }) => <ColHeader justify="flex-start" minWidth={'100px'} {...props} />,
        value: ({ refTimestamp }) => <Cell justify="flex-start" minWidth="100px">
            <Timestamp timestamp={refTimestamp} text1Props={{ fontSize: '12px' }} text2Props={{ fontSize: '12px' }} />
        </Cell>,
    },
    {
        field: 'stakedInvUsd',
        label: 'INV staked',
        header: ({ ...props }) => <ColHeader minWidth="100px" justify="center"  {...props} />,
        value: ({ stakedInvUsd }) => {
            return <Cell minWidth="100px" justify="center" alignItems="center" direction="column" spacing="0">
                <CellText>{stakedInvUsd > 0 ? shortenNumber(stakedInvUsd, 2, true) : '-'}</CellText>
            </Cell>
        },
    },
    {
        field: 'dbrSignedBalance',
        label: 'DBR balance',
        header: ({ ...props }) => <ColHeader minWidth="100px" justify="center"  {...props} />,
        value: ({ dbrSignedBalance }) => {
            return <Cell minWidth="100px" justify="center" alignItems="center" direction="column" spacing="0">
                <CellText color={dbrSignedBalance < 0 ? 'error' : undefined}>{dbrSignedBalance !== 0 ? shortenNumber(dbrSignedBalance, 2) : '-'}</CellText>
            </Cell>
        },
    },
    {
        field: 'depositsUsd',
        label: 'Deposits',
        header: ({ ...props }) => <ColHeader minWidth="100px" justify="center"  {...props} />,
        value: ({ depositsUsd }) => {
            return <Cell minWidth="100px" justify="center" alignItems="center" direction="column" spacing="0">
                <CellText>{shortenNumber(depositsUsd, 2, true)}</CellText>
            </Cell>
        },
    },
    {
        field: 'debt',
        label: 'Current Debt',
        header: ({ ...props }) => <ColHeader minWidth="100px" justify="center"  {...props} />,
        value: ({ debt }) => {
            return <Cell minWidth="100px" justify="center" >
                <CellText>{debt > 0 ? shortenNumber(debt, 2) : '-'}</CellText>
            </Cell>
        },
    },
    {
        field: 'accSinceRef',
        label: 'Acc. DBR spent',
        header: ({ ...props }) => <ColHeader minWidth="100px" justify="center"  {...props} />,
        value: ({ accSinceRef }) => {
            return <Cell minWidth="100px" justify="center">
                <CellText>{accSinceRef > 0 ? shortenNumber(accSinceRef, 2) : '-'}</CellText>
            </Cell>
        },
    },
    {
        field: 'affiliateReward',
        label: 'Acc. DBR reward',
        header: ({ ...props }) => <ColHeader minWidth="100px" justify="center"  {...props} />,
        value: ({ affiliateRewards }) => {
            return <Cell minWidth="100px" justify="center">
                <CellText>{affiliateRewards > 0 ? shortenNumber(affiliateRewards, 2) : '-'}</CellText>
            </Cell>
        },
    },
    {
        field: 'marketRelativeDebtSizes',
        label: 'Markets with debt',
        header: ({ ...props }) => <ColHeader minWidth="100px" justify="center"  {...props} />,
        value: ({ marketIcons, marketRelativeDebtSizes }) => {
            return <Cell minWidth="100px" justify="center">
                {marketRelativeDebtSizes.map((size, i) => size > 0 ? <MarketImage imgProps={{ title: `${shortenNumber(size * 100, 2)}%` }} key={marketIcons[i]} image={marketIcons[i]} size={(size * 10 + 10)} /> : null)}
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

export const ReferredUsersTable = ({
    referredPositions,
    openUserDetails,
}) => {
    return <Table
        keyName="user"
        noDataMessage="No confirmed referred users yet"
        columns={columns}
        items={referredPositions}
        onClick={(item) => openUserDetails(item)}
        defaultSort="affiliateRewards"
        defaultSortDir="desc"
    />
}

export const FirmAffiliateDashboard = ({

}: {

    }) => {
    const account = useAccount();
    const { priceUsd: dbrPriceUsd } = useDBRPrice();
    const { referrals, referralAddresses, affiliatePaymentEvents } = useFirmAffiliate(account);
    const { userPositions, timestamp, isLoading } = useFirmUsers();

    const referredPositions = userPositions
        .filter(up => referralAddresses.includes(up.user))
        .map(up => {
            const refData = referrals.find(rd => rd.referred === up.user);
            const accSinceRef = (up.dueTokensAccrued - refData.beforeReferralDueTokensAccrued);
            const affiliateRewards = accSinceRef * 0.1;
            const paidRewards = affiliatePaymentEvents.filter(pe => pe.affiliate === account).reduce((prev, curr) => prev + curr.amount, 0);
            return {
                ...up,
                affiliateRewards,
                paidRewards,
                pendingRewards: affiliateRewards - paidRewards,
                accSinceRef,
                refTimestamp: refData?.timestamp,
            }
        });

    const { onOpen, onClose, isOpen } = useDisclosure();
    const [position, setPosition] = useState(null);

    const openUserDetails = async (data) => {
        setPosition(data);
        onOpen();
    }

    const nbUsers = referredPositions.length;
    const nbBorrowers = referredPositions.filter(p => p.debt > 0).length;
    const nbStakers = referredPositions.filter(p => p.stakedInv > 0).length;
    const totalTvl = referredPositions.reduce((prev, curr) => prev + (curr.depositsUsd), 0);
    const totalDebt = referredPositions.reduce((prev, curr) => prev + curr.debt, 0);
    const totalAffiliateRewards = Math.max(referredPositions.reduce((prev, curr) => prev + curr.affiliateRewards, 0), 0);
    const totalDbrAccrued = referredPositions.reduce((prev, curr) => prev + curr.accSinceRef, 0);
    const totalDbrPaid = affiliatePaymentEvents
        .filter(e => e.affiliate === account)
        .reduce((prev, curr) => prev + curr.amount, 0);

    const totalPaidRewards = referredPositions.reduce((prev, curr) => prev + curr.paidRewards, 0);
    const totalPendingRewards = referredPositions.reduce((prev, curr) => prev + curr.pendingRewards, 0);

    const monthlySpending = totalDebt / 12;
    const monthlyReward = monthlySpending * 0.1;

    return <VStack alignItems="flex-start" w='full' spacing={{ base: '4', sm: '8' }}>
        {
            !!position && <FirmUserModal useSimple={true} userData={position} isOpen={isOpen} onClose={onClose} />
        }
        <VStack w='full' pl="6" alignItems="flex-start">
            <Text fontWeight="bold" fontSize="30px">
                Your FiRM Affiliate Program Dashboard
            </Text>
            <Text color="mainTextColorLight" fontWeight="bold" fontSize="20px">
                Track the loan activity of your referred users as well as your accumulated rewards!
            </Text>
        </VStack>
        <SimpleGrid justify="space-between" w='full' columns={{ base: 2, sm: 4 }} spacing={{ base: '4', sm: '6' }}>
            {/* <StatBasic isLoading={isLoading} name="DBR price" value={`${smartShortNumber(dbrPriceUsd, 4, true)}`} /> */}
            {/* <StatBasic isLoading={isLoading} name="Affiliate Reward" value={`10%`} /> */}
            <StatBasic isLoading={isLoading} name="DBR Monthly Reward" value={!monthlyReward ? '-' : `${smartShortNumber(monthlyReward, 2)} (${smartShortNumber(monthlyReward * dbrPriceUsd, 2, true)})`} />
            <StatBasic isLoading={isLoading} name="Acc. DBR rewards" value={!totalAffiliateRewards ? '-' : `${smartShortNumber(totalAffiliateRewards, 2)} (${smartShortNumber(totalAffiliateRewards * dbrPriceUsd, 2, true)})`} />
            <StatBasic isLoading={isLoading} name="Paid rewards" value={!totalPaidRewards ? '-' : `${smartShortNumber(totalPaidRewards, 2)} (${smartShortNumber(totalPaidRewards * dbrPriceUsd, 2, true)})`} />
            <StatBasic isLoading={isLoading} name="Pending rewards" value={!totalPendingRewards ? '-' : `${smartShortNumber(totalPendingRewards, 2)} (${smartShortNumber(totalPendingRewards * dbrPriceUsd, 2, true)})`} />
        </SimpleGrid>
        {/* <SimpleGrid justify="space-between" w='full' columns={{ base: 2, sm: 4 }} spacing={{ base: '4', sm: '6' }}>
            <StatBasic isLoading={isLoading} name="DBR Monthly Spending" value={`${smartShortNumber(monthlySpending, 2)} (${smartShortNumber(monthlySpending * dbrPriceUsd, 2, true)})`} />
            
            <StatBasic isLoading={isLoading} name="Acc. DBR spending" value={`${smartShortNumber(totalDbrAccrued, 2)} (${smartShortNumber(totalDbrAccrued * dbrPriceUsd, 2, true)})`} />
            
        </SimpleGrid> */}
        <Container
            py="0"
            label="Referred Users"
            description={timestamp ? `Last update ${moment(timestamp).fromNow()}` : `Loading...`}
            contentProps={{ maxW: { base: '90vw', sm: '100%' }, overflowX: 'auto' }}
            headerProps={{
                direction: { base: 'column', md: 'row' },
                align: { base: 'flex-start', md: 'flex-end' },
            }}
            right={
                <HStack justify="space-between" spacing="4">
                    <VStack alignItems="center">
                        <Text textAlign="center" fontWeight="bold">Deposits</Text>
                        {
                            isLoading ? <SmallTextLoader width={'50px'} />
                                : <Text textAlign="center" color="secondaryTextColor">{!totalTvl ? '-' : shortenNumber(totalTvl, 2, true)}</Text>
                        }
                    </VStack>
                    <VStack alignItems="flex-end">
                        <Text textAlign="right" fontWeight="bold">Debt</Text>
                        {
                            isLoading ? <SmallTextLoader width={'50px'} />
                                : <Text textAlign="right" color="secondaryTextColor">{!totalDebt ? '-' : shortenNumber(totalDebt, 2, 0)}</Text>
                        }
                    </VStack>
                </HStack>
            }
        >
            {
                isLoading ?
                    <SkeletonBlob />
                    :
                    <ReferredUsersTable referredPositions={referredPositions} openUserDetails={openUserDetails} />
            }
        </Container>
        <Container
            py="0"
            label="Reward Payments"
            description={timestamp ? `Last update ${moment(timestamp).fromNow()}` : `Loading...`}
            contentProps={{ maxW: { base: '90vw', sm: '100%' }, overflowX: 'auto' }}
            headerProps={{
                direction: { base: 'column', md: 'row' },
                align: { base: 'flex-start', md: 'flex-end' },
            }}
            right={
                <HStack justify="space-between" spacing="4">
                    <VStack alignItems="flex-end">
                        <Text textAlign="right" fontWeight="bold">Total Rewards Paid</Text>
                        {
                            isLoading ? <SmallTextLoader width={'50px'} />
                                : <Text textAlign="right" color="secondaryTextColor">
                                    {shortenNumber(totalDbrPaid, 2)} DBR
                                </Text>
                        }
                    </VStack>
                </HStack>
            }
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