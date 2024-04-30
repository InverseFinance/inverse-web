import { Flex, Stack, Text, HStack, useDisclosure, useMediaQuery } from '@chakra-ui/react'

import Table from '@app/components/common/Table'
import ScannerLink from '@app/components/common/ScannerLink'
import { getToken, shortenNumber } from '@app/util/markets'
import { AccountPosition, AccountPositionDetailed, AccountPositionsDetailed, Token } from '@app/types'
import { ViewIcon } from '@chakra-ui/icons'
import Link from '@app/components/common/Link'
import { useState } from 'react'
import { UNDERLYING } from '@app/variables/tokens'
import { PositionSlide } from './PositionSlide'
import { MarketImage } from '../common/Assets/MarketImage'
import { getNetworkConfigConstants } from '@app/util/networks'

const { TOKENS } = getNetworkConfigConstants();

const getAssetSize = (usdWorth: number) => {
    if (usdWorth >= 1e6) {
        return 26;
    } else if (usdWorth < 1e6 && usdWorth >= 0.5e6) {
        return 24
    } else if (usdWorth < 0.5e6 && usdWorth >= 0.25e6) {
        return 22
    } else if (usdWorth < 0.25e6 && usdWorth >= 0.1e6) {
        return 20
    } else if (usdWorth < 0.1e6 && usdWorth >= 0.05e6) {
        return 18
    } else if (usdWorth < 0.05e6 && usdWorth >= 0.01e6) {
        return 17
    } else if (usdWorth < 0.005e6 && usdWorth >= 0.001e6) {
        return 15
    } else if (usdWorth < 0.001e6 && usdWorth >= 0.0005e6) {
        return 13
    }
    return 11;
}

const AssetIcons = ({ list, minW = '100px' }: {
    list: {
        marketIndex: number,
        underlying: Token,
        usdWorth: number,
    }[]
}) => {
    return <HStack minW={minW} position="relative" maxW="150px" overflow="hidden">
        {
            list?.map((item, i) => {
                // floki exception, was removed in config
                const underlyingToken = item?.ctoken === "0x0BC08f2433965eA88D977d7bFdED0917f3a0F60B" ? getToken(TOKENS, 'FLOKI') : item?.underlying;
                const { image, protocolImage, isInPausedSection, symbol } = underlyingToken || {};
                if(!image) {
                    return <></>
                }
                return <MarketImage
                    key={item.marketIndex}
                    size={getAssetSize(item.usdWorth)}
                    image={image}
                    protocolImage={protocolImage}
                    isInPausedSection={isInPausedSection || /(-v1|-old)/i.test(symbol)}
                />
            })
        }
    </HStack>
}

const getColumns = (isSmall = false) => {
    const cols =  [
        {
            field: 'account',
            label: 'Account',
            header: ({ ...props }) => <Flex justify="start" {...props} w="120px" />,
            value: ({ account, usdShortfall }: AccountPositionDetailed) => {
                const color = usdShortfall > 0 ? 'error' : 'secondary'
                return <HStack w="120px" position="relative" color={color} onClick={(e) => e.stopPropagation()}>
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
            header: ({ ...props }) => <Flex justify="flex-start" {...props} w="130px" />,
            value: ({ borrowed }: AccountPositionDetailed) => {
                return <AssetIcons list={borrowed} minW="130px" />
            },
        },
        {
            field: 'supplied',
            label: 'Collaterals',
            header: ({ ...props }) => <Flex justify="flex-start" {...props} w="150px" />,
            value: ({ supplied }: AccountPositionDetailed) => {
                return <AssetIcons list={supplied} minW="150px" />
            },
        },
        {
            field: 'usdSupplied',
            label: 'Supplied',
            header: ({ ...props }) => <Flex justify="start" {...props} w="80px" />,
            value: ({ usdSupplied }: AccountPositionDetailed) => {
                return <Text w="80px">{shortenNumber(usdSupplied, 2, true)}</Text>
            },
        },
        {
            field: 'usdLiquidBacking',
            label: 'Supplied (Liquid)',
            header: ({ ...props }) => <Flex justify="start" {...props} w="100px" />,
            value: ({ usdLiquidBacking }: AccountPositionDetailed) => {
                return <Text w="100px">{shortenNumber(usdLiquidBacking, 2, true)}</Text>
            },
        },
        {
            field: 'usdLiquidBackingPower',
            label: 'B. Power (liquid)',
            header: ({ ...props }) => <Flex justify="start" {...props} w="140px" />,
            value: ({ usdLiquidBackingPower }: AccountPositionDetailed) => {
                return <Text w="140px">{shortenNumber(usdLiquidBackingPower, 2, true)}</Text>
            },
        },
        {
            field: 'usdBorrowed',
            label: 'Borrowed $',
            header: ({ ...props }) => <Flex justify="start" {...props} minW="90px" />,
            value: ({ usdBorrowed }: AccountPosition) => {
                return <Text w="90px">{shortenNumber(usdBorrowed, 2, true)}</Text>
            },
        },
        {
            field: 'dolaBorrowed',
            label: 'DOLA borrowed',
            header: ({ ...props }) => <Flex justify="start" {...props} minW="100px" />,
            value: ({ dolaBorrowed }: AccountPosition) => {
                return <Text w="100px">{shortenNumber(dolaBorrowed, 2, true)}</Text>
            },
        },
        {
            field: 'dolaBadDebt',
            label: 'DOLA bad debt',
            header: ({ ...props }) => <Flex justify="start" {...props} minW="100px" />,
            value: ({ dolaBadDebt }: AccountPosition) => {
                const color = dolaBadDebt > 0 ? 'error' : 'mainTextColor'
                return <Text  color={color} w="100px">{shortenNumber(dolaBadDebt, 2, true)}</Text>
            },
        },
        {
            field: 'usdShortfall',
            label: 'Shortfall (contract)',
            header: ({ ...props }) => <Flex justify="start" {...props} minW="120px" />,
            value: ({ usdShortfall }: AccountPositionDetailed) => {
                const color = usdShortfall > 0 ? 'error' : 'mainTextColor'
                return <Stack minW="120px" position="relative" color={color}>
                    <Text color={color}>{shortenNumber(usdShortfall, 2, true)}</Text>
                </Stack>
            },
        },
        {
            field: 'liquidShortfall',
            label: 'Shortfall',
            header: ({ ...props }) => <Flex justify="start" {...props} minW="100px" />,
            value: ({ liquidShortfall }: AccountPositionDetailed) => {
                const color = liquidShortfall > 0 ? 'error' : 'mainTextColor'
                return <Stack minW="100px" position="relative" color={color}>
                    <Text color={color}>{shortenNumber(liquidShortfall, 2, true)}</Text>
                </Stack>
            },
        },
    ]
    if(isSmall) {
        cols.splice(1, 2);
    }
    return cols;
}

const toDetailedPositions = (positions, prices, markets, collateralFactors) => {
    return positions.map(p => {
        const borrowTotal = p.usdBorrowable + p.usdBorrowed;
        const borrowLimitPercent = borrowTotal ? Math.floor((p.usdBorrowed / (borrowTotal)) * 100) : 0;

        p.supplied.sort((a, b) => b.usdWorth - a.usdWorth);
        p.borrowed.sort((a, b) => b.usdWorth - a.usdWorth);

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

    const detailedPositions: AccountPositionsDetailed["positions"] = toDetailedPositions(positions, prices, markets, collateralFactors)

    return <>
        <PositionSlide position={selectedPosition} isOpen={isOpen} onClose={onClose} needFresh={true} />
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

export const PositionsTableV2 = ({
    markets,
    prices,
    positions,
    collateralFactors,
    defaultSort = "liquidShortfall",
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
    const columnsLarge = getColumns();
    const columnsSmall = getColumns(true);
    const [isSmallerThan] = useMediaQuery('(max-width: 1300px)')
    const columns = isSmallerThan ? columnsSmall : columnsLarge;

    const handleDetails = (item: AccountPositionDetailed) => {
        setSelectedPosition(item);
        onOpen();
    }

    const detailedPositions: AccountPositionsDetailed["positions"] = toDetailedPositions(positions, prices, markets, collateralFactors)

    return <>
        <PositionSlide position={selectedPosition} isOpen={isOpen} onClose={onClose} needFresh={true} />
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