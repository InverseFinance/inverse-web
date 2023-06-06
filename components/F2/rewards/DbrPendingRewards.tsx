import { Flex, HStack, Stack, Text, VStack } from "@chakra-ui/react"
import { shortenNumber } from "@app/util/markets";
import Container from "@app/components/common/Container";
import { useDBRPendingRewards } from "@app/hooks/useFirm";
import Link from "@app/components/common/Link";
import { ViewIcon } from "@chakra-ui/icons";
import ScannerLink from "@app/components/common/ScannerLink";
import moment from 'moment'

import Table from "@app/components/common/Table";
import { preciseCommify } from "@app/util/misc";
import { usePrices } from "@app/hooks/usePrices";
import { SkeletonBlob } from "@app/components/common/Skeleton";

const ColHeader = ({ ...props }) => {
    return <Flex justify="flex-start" minWidth={'100px'} fontSize="14px" fontWeight="extrabold" {...props} />
}

const Cell = ({ ...props }) => {
    return <Stack direction="row" fontSize="14px" fontWeight="normal" justify="flex-start" minWidth="100px" {...props} />
}

const CellText = ({ ...props }) => {
    return <Text textAlign="center" fontSize="16px" {...props} />
}

const columns = [
    {
        field: 'user',
        label: 'Staker',
        header: ({ ...props }) => <ColHeader justify="flex-start" {...props} minWidth="130px" />,
        value: ({ user }) => {
            return <Cell w="130px" justify="flex-start" position="relative" onClick={(e) => e.stopPropagation()}>
                <Link isExternal href={`/firm/INV?viewAddress=${user}`}>
                    <ViewIcon color="blue.600" boxSize={3} />
                </Link>
                <ScannerLink value={user} />
            </Cell>
        },
        showFilter: true,
        filterWidth: '100px',
    },
    // {
    //     field: 'signedBalance',
    //     label: 'DBR Signed Balance',
    //     header: ({ ...props }) => <ColHeader minWidth="150px" justify="center"  {...props} />,
    //     value: ({ signedBalance }) => {
    //         return <Cell minWidth="150px" justify="center" >
    //             <CellText color={signedBalance < 0 ? 'error' : 'mainTextColor'}>{shortenNumber(signedBalance, signedBalance < 0 ? 4 : 2, false, signedBalance > 0)}</CellText>
    //         </Cell>
    //     },
    // },
    {
        field: 'totalDebt',
        label: 'DOLA Debt',
        header: ({ ...props }) => <ColHeader minWidth="100px" justify="center"  {...props} />,
        value: ({ totalDebt, dolaPrice }) => {
            return <Cell minWidth="100px" justify="center" direction="column" alignItems="center">
                {
                    totalDebt ? <>
                        <CellText fontWeight="bold">{totalDebt ? shortenNumber(totalDebt * dolaPrice, 2, true) : '-'}</CellText>
                        <CellText>{totalDebt ? shortenNumber(totalDebt, 2) : '-'}</CellText>
                    </> : <CellText>-</CellText>
                }
            </Cell>
        },
    },
    {
        field: 'monthlyBurn',
        label: 'DBR Monthly Spend',
        header: ({ ...props }) => <ColHeader minWidth="125px" justify="center"  {...props} />,
        value: ({ monthlyBurn, dbrPrice }) => {
            return <Cell minWidth="125px" justify="center" direction="column" alignItems="center">
                {
                    monthlyBurn ? <>
                        <CellText fontWeight="bold" textAlign="center" color="warning">-{shortenNumber(monthlyBurn * dbrPrice, 2, true, true)}</CellText>
                        <CellText>-{monthlyBurn ? shortenNumber(monthlyBurn, 2) : ''}</CellText>
                    </> : <CellText>-</CellText>
                }
            </Cell>
        },
    },
    {
        field: 'dbrMonthlyRewards',
        label: 'DBR Monthly Rewards',
        header: ({ ...props }) => <ColHeader minWidth="125px" justify="center"  {...props} />,
        value: ({ dbrMonthlyRewards, dbrPrice }) => {
            return <Cell minWidth="125px" justify="center" direction="column" alignItems="center">
                {
                    dbrMonthlyRewards ? <>
                        <CellText fontWeight="bold" textAlign="center" color="success">{shortenNumber(dbrMonthlyRewards * dbrPrice, 2, true, true)}</CellText>
                        <CellText textAlign="center">{shortenNumber(dbrMonthlyRewards, 2, false, true)}</CellText>
                    </> : <CellText>-</CellText>
                }
            </Cell>
        },
    },
    {
        field: 'netDbr',
        label: 'DBR net Monthly',
        header: ({ ...props }) => <ColHeader minWidth="125px" justify="center"  {...props} />,
        value: ({ netDbr, dbrPrice }) => {
            return <Cell minWidth="125px" justify="center" direction="column" alignItems="center">
                {
                    netDbr ? <>
                        <CellText fontWeight="bold" textAlign="center" color={netDbr > 0 ? 'success' : 'warning'}>{shortenNumber(netDbr * dbrPrice, 2, true, false)}</CellText>
                        <CellText textAlign="center">{shortenNumber(netDbr, 2, false, false)}</CellText>
                    </> : <CellText>-</CellText>
                }
            </Cell>
        },
    },
    {
        field: 'invMonthlyRewards',
        label: 'INV Monthly Rewards',
        header: ({ ...props }) => <ColHeader minWidth="125px" justify="center"  {...props} />,
        value: ({ invMonthlyRewards, invPrice }) => {
            return <Cell minWidth="125px" justify="center" direction="column" alignItems="center">
                {
                    invMonthlyRewards ? <>
                        <CellText fontWeight="bold" textAlign="center" color="success">{shortenNumber(invMonthlyRewards * invPrice, 2, true, true)}</CellText>
                        <CellText textAlign="center">{shortenNumber(invMonthlyRewards, 2, false, true)}</CellText>
                    </> : <CellText>-</CellText>
                }
            </Cell>
        },
    },
    {
        field: 'deposits',
        label: 'INV staked',
        header: ({ ...props }) => <ColHeader minWidth="125px" justify="center"  {...props} />,
        value: ({ deposits, invPrice }) => {
            return <Cell minWidth="125px" justify="center" direction="column" alignItems="center">
                {
                    deposits ? <>
                        <CellText fontWeight="bold" textAlign="center">{shortenNumber(deposits * invPrice, 2, true, true)}</CellText>
                        <CellText textAlign="center">{shortenNumber(deposits, 2, false, true)}</CellText>
                    </> : <CellText>-</CellText>
                }
            </Cell>
        },
    },
    {
        field: 'claimable',
        label: 'Claimable DBR',
        header: ({ ...props }) => <ColHeader minWidth="150px" justify="center"  {...props} />,
        value: ({ claimable, dbrPrice }) => {
            return <Cell minWidth="150px" justify="center" direction="column" alignItems="center">
                <CellText textAlign="right" color="success" fontWeight="bold">{shortenNumber(claimable * dbrPrice, 2, true)}</CellText>
                <CellText textAlign="right">{shortenNumber(claimable, 2)}</CellText>
            </Cell>
        },
    },
]

export const DbrPendingRewards = ({

}: {

    }) => {
    const { prices } = usePrices();
    const dbrPrice = prices?.['dola-borrowing-right']?.usd || 0;
    const invPrice = prices?.['inverse-finance']?.usd || 0;
    const dolaPrice = prices?.['dola-usd']?.usd || 0;
    const { stakers, timestamp, invMarket, isLoading } = useDBRPendingRewards();

    const _stakers = stakers.map((staker) => {
        return {
            ...staker, dbrPrice, invPrice, dolaPrice, netDbr: staker.dbrMonthlyRewards - staker.monthlyBurn,
        }
    })

    const totalClaimable = _stakers.reduce((prev, curr) => prev + (curr.claimable || 0), 0);
    const totalClaimableAbove100 = _stakers.filter(s => (s.claimable || 0) * dbrPrice >= 100)
        .reduce((prev, curr) => prev + curr.claimable, 0);
    const totalStaked = _stakers.reduce((prev, curr) => prev + (curr.deposits || 0), 0);

    const fontSize = { base: '14px', sm: '16px' };

    if(isLoading) return <SkeletonBlob />

    return <Container
        label="FiRM INV Stakers & Rewards"
        noPadding
        py="4"
        description={timestamp ? `DBR reward index updated ${moment(timestamp).from()}` : `Loading...`}
        contentProps={{ maxW: { base: '90vw', sm: '100%' }, overflowX: 'auto' }}
        headerProps={{
            direction: { base: 'column', md: 'row' },
            align: { base: 'flex-start', md: 'flex-end' },
        }}
        right={
            <HStack pt="2" alignItems="flex-start" justify="space-between" spacing={{ base: '2', sm: '6' }}>
                <VStack spacing="0" alignItems="center">
                    <Text textAlign="right" fontSize={fontSize} fontWeight="bold">Stakers</Text>
                    <Text fontWeight="extrabold" textAlign="center" fontSize={fontSize} color="success">{preciseCommify(_stakers.filter(s => s.deposits > 0.01).length, 0)}</Text>
                </VStack>
                <VStack spacing="0" alignItems="center">
                    <Text textAlign="center" fontSize={fontSize} fontWeight="bold">Staked INV</Text>
                    <Text fontWeight="extrabold" textAlign="center" fontSize={fontSize} color="success">{preciseCommify(totalStaked, 0)} ({shortenNumber(totalStaked * invPrice, 2, true)})</Text>
                </VStack>
                <VStack spacing="0" alignItems="center">
                    <Text textAlign="center" fontSize={fontSize} fontWeight="bold">INV APR</Text>
                    <Text fontWeight="extrabold" textAlign="center" fontSize={fontSize} color="success">{shortenNumber(invMarket?.supplyApy, 2)}%</Text>
                </VStack>
                <VStack spacing="0" alignItems="center">
                    <Text textAlign="center" fontSize={fontSize} fontWeight="bold">DBR APR</Text>
                    <Text fontWeight="extrabold" textAlign="center" fontSize={fontSize} color="success">{shortenNumber(invMarket?.dbrApr, 2)}%</Text>
                </VStack>
                <VStack spacing="0" alignItems="center">
                    <Text textAlign="right" fontSize={fontSize} fontWeight="bold">DBR rewards above $100</Text>
                    <Text fontWeight="extrabold" textAlign="right" fontSize={fontSize} color="success">{preciseCommify(totalClaimableAbove100, 0)} ({preciseCommify(dbrPrice * totalClaimableAbove100, 0, true)})</Text>
                </VStack>
                <VStack spacing="0" alignItems="flex-end">
                    <Text textAlign="right" fontSize={fontSize} fontWeight="bold">Total DBR Claimable</Text>
                    <Text fontWeight="extrabold" textAlign="right" fontSize={fontSize} color="success">{preciseCommify(totalClaimable, 0)} ({preciseCommify(dbrPrice * totalClaimable, 0, true)})</Text>
                </VStack>
            </HStack>
        }
    >
        <Table
            keyName="user"
            noDataMessage={isLoading ? 'Loading' : "No stakers"}
            columns={columns}
            items={_stakers}
            defaultSort={'claimable'}
            defaultSortDir="desc"
        />
    </Container>
}