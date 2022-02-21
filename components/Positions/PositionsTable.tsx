import { Flex, Stack, Text, Image, HStack, useDisclosure, Slide, Box } from '@chakra-ui/react'

import Table from '@app/components/common/Table'
import ScannerLink from '@app/components/common/ScannerLink'
import { shortenNumber } from '@app/util/markets'
import { AccountPosition, AccountPositionDetailed, AccountPositionsDetailed, Token } from '@app/types'
import { CloseIcon, ViewIcon } from '@chakra-ui/icons'
import Link from '@app/components/common/Link'
import { PositionDetails } from './PositionDetails'
import { useState } from 'react'
import { UNDERLYING } from '@app/variables/tokens'
import Container from '../common/Container'

const AssetIcons = ({ list }: { list: { market: string, underlying: Token }[] }) => {
    return <HStack minW="100px" position="relative">
        {
            list?.map((s, i) => <Image key={s.market} width={'15px'} src={s?.underlying.image} ignoreFallback={true} />)
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
            field: 'supplied',
            label: 'Collaterals',
            header: ({ ...props }) => <Flex justify="flex-start" {...props} w="100px" />,
            value: ({ supplied }: AccountPositionDetailed) => {
                return <AssetIcons list={supplied} />
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
            field: 'usdSupplied',
            label: 'Supplied Worth',
            header: ({ ...props }) => <Flex justify="start" {...props} w="100px" />,
            value: ({ usdSupplied }: AccountPositionDetailed) => {
                return <Text w="100px">{shortenNumber(usdSupplied, 2, true)}</Text>
            },
        },
        {
            field: 'usdBorrowable',
            label: 'Borrow Capacity',
            header: ({ ...props }) => <Flex justify="start" {...props} w="100px" />,
            value: ({ usdBorrowable }: AccountPositionDetailed) => {
                return <Text w="100px">{shortenNumber(usdBorrowable, 2, true)}</Text>
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
                const color = usdShortfall > 0 ? 'error' : 'white'
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
}: {
    markets: string[],
    prices: number[],
    positions: AccountPosition[],
    collateralFactors: number[],
}) => {
    const { isOpen, onOpen, onClose } = useDisclosure();
    const [selectedPosition, setSelectedPosition] = useState<AccountPositionDetailed | null>(null);
    const columns = getColumns();

    const handleDetails = (item: AccountPositionDetailed) => {
        setSelectedPosition(item);
        onOpen();
    }

    const detailedPositions: AccountPositionsDetailed["positions"] = positions.map(p => {
        return {
            ...p,
            usdBorrowable: p.usdBorrowed - p.usdShortfall,
            supplied: p.supplied.map(s => {
                const market = markets[s.marketIndex];
                return {
                    ...s,
                    market,
                    underlying: UNDERLYING[market],
                    usdPrice: prices[s.marketIndex],
                }
            }),
            borrowingPower: p.supplied.map(s => {
                const market = markets[s.marketIndex];
                return {
                    ...s,
                    market,
                    underlying: UNDERLYING[market],
                    usdPrice: prices[s.marketIndex] * collateralFactors[s.marketIndex],
                }
            }),
            borrowed: p.borrowed.map(s => {
                const market = markets[s.marketIndex];
                return {
                    ...s,
                    market,
                    underlying: UNDERLYING[market],
                    usdPrice: prices[s.marketIndex],
                }
            })
        }
    })

    return <>
        <Slide direction='bottom' in={isOpen} style={{ zIndex: 9999 }}>
            <Container
                noPadding
                contentProps={{
                    boxShadow: "0px 0px 1px 1px #ccc",
                    borderBottomLeftRadius: 0,
                    borderBottomRightRadius: 0,
                    className: "blurred-container info-bg",
                }}
            >
                <Box w="20px" h="20px" cursor="pointer" onClick={onClose} position="absolute" top="10px" left="10px">
                    <CloseIcon fontSize="14px" cursor="pointer" />
                </Box>
                {!!selectedPosition && <PositionDetails position={selectedPosition} />}
            </Container>
        </Slide>
        <Table
            keyName="account"
            defaultSort="usdShortfall"
            defaultSortDir="desc"
            columns={columns}
            items={detailedPositions}
            onClick={handleDetails}
        />
    </>
}