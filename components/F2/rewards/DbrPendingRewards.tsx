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
        label: 'Staker',
        header: ({ ...props }) => <ColHeader justify="flex-start" {...props} minWidth="100px" />,
        value: ({ user }) => {
            return <Cell w="100px" justify="flex-start" position="relative" onClick={(e) => e.stopPropagation()}>
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
        field: 'signedBalance',
        label: 'DBR Signed Balance',
        header: ({ ...props }) => <ColHeader minWidth="150px" justify="center"  {...props} />,
        value: ({ signedBalance }) => {
            return <Cell minWidth="150px" justify="center" >
                <CellText color={signedBalance < 0 ? 'error' : 'mainTextColor'}>{shortenNumber(signedBalance, signedBalance < 0 ? 4 : 2, false, signedBalance > 0)}</CellText>
            </Cell>
        },
    },
    {
        field: 'totalDebt',
        label: 'DOLA Debt',
        header: ({ ...props }) => <ColHeader minWidth="100px" justify="center"  {...props} />,
        value: ({ totalDebt }) => {
            return <Cell minWidth="100px" justify="center" >
                <CellText>{totalDebt ? shortenNumber(totalDebt, 2) : '-'}</CellText>
            </Cell>
        },
    },
    {
        field: 'dailyBurn',
        label: 'DBR Daily Spend',
        header: ({ ...props }) => <ColHeader minWidth="100px" justify="center"  {...props} />,
        value: ({ dailyBurn }) => {
            return <Cell minWidth="100px" justify="center" >
                <CellText>-{dailyBurn ? shortenNumber(dailyBurn, 2) : ''}</CellText>
            </Cell>
        },
    },
    {
        field: 'dbrExpiryDate',
        label: 'DBR Depletion',
        header: ({ ...props }) => <ColHeader minWidth="120px" justify="center"  {...props} />,
        value: ({ debt, dbrExpiryDate }) => {
            return <Cell spacing="0" alignItems="center" direction="column" minWidth="120px" justify="center">
                {
                    debt > 0 && !!dbrExpiryDate ? <>
                        <CellText>{moment(dbrExpiryDate).format('MMM Do YYYY')}</CellText>
                        <CellText color="secondaryTextColor">{moment(dbrExpiryDate).fromNow()}</CellText>
                    </>
                        : <CellText>-</CellText>
                }
            </Cell>
        },
    },
    {
        field: 'deposits',
        label: 'INV staked',
        header: ({ ...props }) => <ColHeader minWidth="150px" justify="center"  {...props} />,
        value: ({ deposits, invPrice }) => {
            return <Cell minWidth="150px" justify="center" direction="column">
                <CellText fontWeight="bold" textAlign="center">{shortenNumber(deposits * invPrice, 2, true, true)}</CellText>
                <CellText textAlign="center">{shortenNumber(deposits, 2, false, true)}</CellText>               
            </Cell>
        },
    },
    {
        field: 'claimable',
        label: 'Claimable DBR',
        header: ({ ...props }) => <ColHeader minWidth="100px" justify="flex-end"  {...props} />,
        value: ({ claimable, dbrPrice }) => {
            return <Cell minWidth="100px" justify="flex-end" direction="column">
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
    const { stakers, timestamp, isLoading } = useDBRPendingRewards();
    const _stakers = stakers.map((staker) => {
        return { ...staker, dbrPrice, invPrice }
    })

    const totalClaimable = stakers.reduce((prev, curr) => prev + curr.claimable, 0);

    const fontSize = { base: '14px', sm: '18px' };

    return <Container
        label="INV stakers & claimable DBR rewards"
        noPadding
        py="4"
        description={timestamp ? `Last index update ${moment(timestamp).from()}` : `Loading...`}
        contentProps={{ maxW: { base: '90vw', sm: '100%' }, overflowX: 'auto' }}
        headerProps={{
            direction: { base: 'column', md: 'row' },
            align: { base: 'flex-start', md: 'flex-end' },
        }}
        right={
            <HStack pt="2" alignItems="flex-start" justify="space-between" spacing={{ base: '2', sm: '4' }}>
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