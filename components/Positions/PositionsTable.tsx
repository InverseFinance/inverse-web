import { Flex, Stack, Text, Image, HStack, useDisclosure } from '@chakra-ui/react'

import { SubmitButton } from '@app/components/common/Button'
import Table from '@app/components/common/Table'
import ScannerLink from '@app/components/common/ScannerLink'
import { shortenNumber } from '@app/util/markets'
import { AccountPosition } from '@app/types'
import { useBorrowedAssets, useSuppliedCollaterals } from '@app/hooks/useBalances'
import { useAccountLiquidity } from '@app/hooks/useAccountLiquidity'
import { ViewIcon } from '@chakra-ui/icons'
import Link from '@app/components/common/Link'
import { PositionDetailsModal } from './PositionDetailsModal'
import { useState } from 'react'

const AccountLiq = ({ account, keyName }: { account: string, keyName: string }) => {
    const data = useAccountLiquidity(account)
    return <Stack minW="100px">
        <Text>{shortenNumber(data[keyName], 2, true)}</Text>
    </Stack>
}

const BorrowLimit = ({ account }: { account: string }) => {
    const { usdBorrow, usdBorrowable } = useAccountLiquidity(account)
    const borrowTotal = usdBorrowable + usdBorrow;

    const borrowLimitPercent = usdBorrow > 0.01 ? Math.floor((usdBorrow / (borrowTotal)) * 100) : 0
    return <Stack minW="100px">
        <Text>{borrowLimitPercent}%</Text>
    </Stack>
}

const BorrowedAssets = ({ account }: { account: string }) => {
    const markets = useBorrowedAssets(account);

    return <HStack minW="100px">
        {
            markets?.map(market => <Image key={market.token} width={'20px'} src={market?.underlying.image} ignoreFallback={true} />)
        }
    </HStack>
}

const SuppliedCollaterals = ({ account }: { account: string }) => {
    const collateralsWithBalance = useSuppliedCollaterals(account);

    return <HStack minW="100px">
        {
            collateralsWithBalance?.map(market => <Image key={market.token} width={'20px'} src={market?.underlying.image} ignoreFallback={true} />)
        }
    </HStack>
}

const getColumns = (markets: string[]) => {
    return [
        {
            field: 'account',
            label: 'Account',
            header: ({ ...props }) => <Flex justify="start" {...props} minW="100px" />,
            value: ({ account, usdShortfall }: AccountPosition) => {
                const color = usdShortfall > 0 ? 'error' : 'secondary'
                return <HStack minW="100px" position="relative" color={color}>
                    <ScannerLink value={account} />
                    <Link isExternal href={`/anchor?viewAddress=${account}`}>
                        <ViewIcon color="blue.600" boxSize={3} />
                    </Link>
                </HStack>
            },
        },
        {
            field: 'assetsIn',
            label: 'Collaterals',
            header: ({ ...props }) => <Flex justify="flex-start" {...props} minW="100px" />,
            value: ({ account }: AccountPosition) => {
                return <SuppliedCollaterals account={account} />
            },
        },
        {
            field: 'borrowed',
            label: 'Borrowed',
            header: ({ ...props }) => <Flex justify="flex-start" {...props} minW="100px" />,
            value: ({ account }: AccountPosition) => {
                return <BorrowedAssets account={account} />
            },
        },
        {
            field: 'usdBorrowed',
            label: 'Supplied Worth',
            header: ({ ...props }) => <Flex justify="start" {...props} minW="100px" />,
            value: ({ account }: AccountPosition) => {
                return <AccountLiq account={account} keyName="usdSupplyCoingecko" />
            },
        },
        {
            field: 'usdBorrawable',
            label: 'Borrow Capacity Left',
            header: ({ ...props }) => <Flex justify="start" {...props} minW="100px" />,
            value: ({ usdBorrowable }: AccountPosition) => {
                const color = usdBorrowable > 0 ? 'secondary' : 'white'
                return <Stack minW="100px" position="relative" color={color}>
                    <Text color={color}>{shortenNumber(usdBorrowable, 2, true)}</Text>
                </Stack>
            },
        },
        {
            field: 'usdBorrowed',
            label: 'Borrowed Worth',
            header: ({ ...props }) => <Flex justify="start" {...props} minW="100px" />,
            value: ({ account }: AccountPosition) => {
                return <AccountLiq account={account} keyName="usdBorrow" />
            },
        },
        {
            field: 'usdBorrowed',
            label: 'Borrow Limit',
            header: ({ ...props }) => <Flex justify="start" {...props} minW="100px" />,
            value: ({ account }: AccountPosition) => {
                return <BorrowLimit account={account} />
            },
        },
        {
            field: 'usdShortfall',
            label: 'Shortfall',
            header: ({ ...props }) => <Flex justify="start" {...props} minW="100px" />,
            value: ({ usdShortfall }: AccountPosition) => {
                const color = usdShortfall > 0 ? 'error' : 'white'
                return <Stack minW="100px" position="relative" color={color}>
                    <Text color={color}>{shortenNumber(usdShortfall, 2, true)}</Text>
                </Stack>
            },
        },
    ]
}

export const PositionsTable = ({ prices, markets, positions }: { markets: any, positions: any }) => {
    const { isOpen, onOpen, onClose } = useDisclosure();
    const [selectedAccount, setSelectedAccount] = useState('');
    const columns = getColumns(markets);

    const handleDetails = (item: AccountPosition) => {
        setSelectedAccount(item.account);
        onOpen();
    }

    return <>
        <Table
            keyName="account"
            defaultSort="usdShortfall"
            defaultSortDir="desc"
            columns={columns}
            items={positions.slice(0, 10)}
            onClick={handleDetails}
        />
        { !!selectedAccount && <PositionDetailsModal prices={prices} isOpen={isOpen} onClose={onClose} account={selectedAccount} /> }
    </>
}