import { Flex, Stack, Text, Image, HStack, useDisclosure } from '@chakra-ui/react'

import Table from '@app/components/common/Table'
import ScannerLink from '@app/components/common/ScannerLink'
import { shortenNumber } from '@app/util/markets'
import { AccountPosition, AccountPositionDetailed, AccountPositionsDetailed, Token } from '@app/types'
import { ViewIcon } from '@chakra-ui/icons'
import Link from '@app/components/common/Link'
import { useState } from 'react'
import { UNDERLYING } from '@app/variables/tokens'
import { PositionSlide } from './PositionSlide'

const AssetIcons = ({ list }: { list: { market: string, underlying: Token }[] }) => {
    return <HStack minW="100px" position="relative">
        {
            list?.map((s, i) => <Image key={s.ctoken} width={'15px'} src={s?.underlying.image} ignoreFallback={true} />)
        }
    </HStack>
}

const getColumns = () => {
    return [
        {
            field: 'account',
            label: 'Account',
            header: ({ ...props }) => <Flex justify="start" {...props} w="100px" />,
            value: ({ account, usdShortfall }: AccountPositionDetailed) => {
                const color = usdShortfall > 0 ? 'error' : 'secondary'
                return <HStack w="100px" position="relative" color={color} onClick={(e) => e.stopPropagation()}>
                    <Link isExternal href={`/anchor?viewAddress=${account}`}>
                        <ViewIcon color="blue.600" boxSize={3} />
                    </Link>
                    <ScannerLink value={account} />
                </HStack>
            },
        },
        {
            field: 'borrowed',
            label: 'Borrowed',
            header: ({ ...props }) => <Flex justify="flex-start" {...props} w="100px" />,
            value: ({ borrowed }: AccountPositionDetailed) => {
                return <AssetIcons list={borrowed} />
            },
        },
        {
            field: 'supplied',
            label: 'Collaterals',
            header: ({ ...props }) => <Flex justify="flex-start" {...props} w="100px" />,
            value: ({ supplied }: AccountPositionDetailed) => {
                return <AssetIcons list={supplied} />
            },
        },
        {
            field: 'usdSupplied',
            label: 'Supplied Worth',
            header: ({ ...props }) => <Flex justify="start" {...props} w="100px" />,
            value: ({ usdSupplied }: AccountPositionDetailed) => {
                return <Text w="100px">{shortenNumber(usdSupplied, 2, true)}</Text>
            },
        },
        {
            field: 'usdBorrowingPower',
            label: 'Borrowing Power',
            header: ({ ...props }) => <Flex justify="start" {...props} w="100px" />,
            value: ({ usdBorrowingPower }: AccountPositionDetailed) => {
                return <Text w="100px">{shortenNumber(usdBorrowingPower, 2, true)}</Text>
            },
        },
        {
            field: 'usdBorrowed',
            label: 'Borrowed Worth',
            header: ({ ...props }) => <Flex justify="start" {...props} minW="100px" />,
            value: ({ usdBorrowed }: AccountPosition) => {
                return <Text w="100px">{shortenNumber(usdBorrowed, 2, true)}</Text>
            },
        },
        {
            field: 'usdShortfall',
            label: 'Shortfall',
            header: ({ ...props }) => <Flex justify="start" {...props} minW="100px" />,
            value: ({ usdShortfall }: AccountPositionDetailed) => {
                const color = usdShortfall > 0 ? 'error' : 'mainTextColor'
                return <Stack minW="100px" position="relative" color={color}>
                    <Text color={color}>{shortenNumber(usdShortfall, 2, true)}</Text>
                </Stack>
            },
        },
    ]
}

export const PositionsTable = ({
    markets,
    prices,
    positions,
    collateralFactors,
    defaultSort = "usdShortfall",
    defaultSortDir = "desc",
}: {
    markets: string[],
    prices: number[],
    positions: AccountPosition[],
    collateralFactors: number[],
    defaultSort?: string,
    defaultSortDir?: string,
}) => {
    const { isOpen, onOpen, onClose } = useDisclosure();
    const [selectedPosition, setSelectedPosition] = useState<AccountPositionDetailed | null>(null);
    const columns = getColumns();

    const handleDetails = (item: AccountPositionDetailed) => {
        setSelectedPosition(item);
        onOpen();
    }

    const detailedPositions: AccountPositionsDetailed["positions"] = positions.map(p => {
        const borrowTotal = p.usdBorrowable + p.usdBorrowed;
        const borrowLimitPercent = borrowTotal ? Math.floor((p.usdBorrowed / (borrowTotal)) * 100) : 0;

        return {
            ...p,
            usdBorrowingPower: p.supplied.reduce((prev, s) => prev + s.balance * prices[s.marketIndex] * collateralFactors[s.marketIndex], 0),
            supplied: p.supplied.map(s => {
                const ctoken = markets[s.marketIndex];
                return {
                    ...s,
                    ctoken,
                    underlying: UNDERLYING[ctoken],
                    usdPrice: prices[s.marketIndex],
                    collateralFactor: collateralFactors[s.marketIndex],
                }
            }),
            borrowLimitPercent: borrowLimitPercent,
            borrowingPower: p.supplied.map(s => {
                const ctoken = markets[s.marketIndex];
                return {
                    ...s,
                    ctoken,
                    underlying: UNDERLYING[ctoken],
                    usdPrice: prices[s.marketIndex] * collateralFactors[s.marketIndex],
                }
            }),
            borrowed: p.borrowed.map(s => {
                const ctoken = markets[s.marketIndex];
                return {
                    ...s,
                    ctoken,
                    underlying: UNDERLYING[ctoken],
                    usdPrice: prices[s.marketIndex],
                }
            })
        }
    })

    return <>
        <PositionSlide position={selectedPosition} isOpen={isOpen} onClose={onClose} />
        <Table
            keyName="account"
            defaultSort={defaultSort}
            defaultSortDir={defaultSortDir}
            columns={columns}
            items={detailedPositions}
            onClick={handleDetails}
        />
    </>
}