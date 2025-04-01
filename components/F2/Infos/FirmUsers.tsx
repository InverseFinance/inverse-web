import { Divider, Flex, FormControl, HStack, SimpleGrid, Stack, Switch, Text, useDisclosure, VStack } from "@chakra-ui/react"
import { shortenNumber, smartShortNumber } from "@app/util/markets";
import Container from "@app/components/common/Container";
import { getRiskColor } from "@app/util/f2";
import { useFirmUsers } from "@app/hooks/useFirm";
import Link from "@app/components/common/Link";
import { ViewIcon } from "@chakra-ui/icons";
import ScannerLink from "@app/components/common/ScannerLink";
 
import { useState } from "react";
import Table from "@app/components/common/Table";
import { SkeletonBlob } from "@app/components/common/Skeleton";
import { SmallTextLoader } from "@app/components/common/Loaders/SmallTextLoader";
import { MarketImage } from "@app/components/common/Assets/MarketImage";
import { preciseCommify } from "@app/util/misc";
import { FirmUserModal } from "./FirmUserModal";
import { useDBRPrice } from "@app/hooks/useDBR";
import InfoModal from "@app/components/common/Modal/InfoModal";
import { MarketNameAndIcon } from "../F2Markets";
import { formatDate, timeSince } from "@app/util/time";

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
        label: 'User',
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
                <CellText color={dbrSignedBalance < 0 ? 'error' : undefined}>{dbrSignedBalance !== 0 ? shortenNumber(dbrSignedBalance, 2, false, true) : '-'}</CellText>
            </Cell>
        },
    },
    {
        field: 'dbrExpiryDate',
        label: 'DBR Depletion',
        header: ({ ...props }) => <ColHeader minWidth="120px" justify="center"  {...props} />,
        value: ({ dbrExpiryDate, debt, dbrRiskColor }) => {
            return <Cell spacing="0" alignItems="center" direction="column" minWidth="120px" justify="center">
                <CellText color={dbrRiskColor}>{debt > 0 ? formatDate(dbrExpiryDate).replace('Invalid Date', 'Distant Future') : '-'}</CellText>
                {/* <CellText color="secondaryTextColor">{timeSince(dbrExpiryDate)}</CellText> */}
            </Cell>
        },
    },
    {
        field: 'depositsUsd',
        label: 'Deposits',
        header: ({ ...props }) => <ColHeader minWidth="100px" justify="center"  {...props} />,
        value: ({ depositsUsd }) => {
            return <Cell minWidth="100px" justify="center" alignItems="center" direction="column" spacing="0">
                <CellText>{shortenNumber(depositsUsd, 2, true, true)}</CellText>
            </Cell>
        },
    },
    {
        field: 'creditLimit',
        label: 'Max Debt',
        header: ({ ...props }) => <ColHeader minWidth="100px" justify="center"  {...props} />,
        value: ({ creditLimit }) => {
            return <Cell minWidth="100px" justify="center" alignItems="center" direction="column" spacing="0">
                <CellText>{creditLimit > 0 ? shortenNumber(creditLimit, 2, false, true) : '-'}</CellText>
            </Cell>
        },
    },
    {
        field: 'debt',
        label: 'Debt',
        header: ({ ...props }) => <ColHeader minWidth="100px" justify="center"  {...props} />,
        value: ({ debt }) => {
            return <Cell minWidth="100px" justify="center" >
                <CellText>{debt > 0 ? shortenNumber(debt, 2, false, true) : '-'}</CellText>
            </Cell>
        },
    },
    {
        field: 'isLiquidatable',
        label: 'In shortfall?',
        header: ({ ...props }) => <ColHeader minWidth="100px" alignItems="center" justify="center"  {...props} />,
        value: ({ isLiquidatable }) => {
            return <Cell minWidth="100px" justify="center" direction="column" alignItems="center">
                <CellText color={isLiquidatable ? 'error' : 'mainTextColor'}>{isLiquidatable ? 'Yes' : 'No'}</CellText>
            </Cell>
        },
        showFilter: true,
        filterWidth: '90px',
    },
    // {
    //     field: 'liquidatableDebt',
    //     label: 'Seizable',
    //     header: ({ ...props }) => <ColHeader minWidth="150px" alignItems="center" justify="center"  {...props} />,
    //     value: ({ seizableWorth, liquidatableDebt }) => {
    //         return <Cell minWidth="150px" justify="center" direction="column" alignItems="center">
    //             {
    //                 liquidatableDebt > 0 ? <>                        
    //                     <CellText>~{shortenNumber(liquidatableDebt, 2)} DOLA</CellText>
    //                 </> : <CellText>-</CellText>
    //             }
    //         </Cell>
    //     },
    // },
    {
        field: 'marketRelativeDebtSizes',
        label: 'Top 3 Debts',
        header: ({ ...props }) => <ColHeader minWidth="100px" justify="center"  {...props} />,
        value: ({ marketIcons, marketRelativeDebtSizes, marketUnderlyings }) => {
            return <Cell minWidth="100px" justify="center">
                {marketRelativeDebtSizes.slice(0, 3).map((size, i) => size > 0 ?
                    <MarketNameAndIcon icon={marketIcons[i]} underlying={marketUnderlyings[i]} />
                    : null)}
            </Cell>
        },
    },
    // {
    //     field: 'marketRelativeCollateralSizes',
    //     label: 'Collateral sizes',
    //     header: ({ ...props }) => <ColHeader minWidth="100px" justify="center"  {...props} />,
    //     value: ({ marketIcons, marketRelativeCollateralSizes }) => {
    //         return <Cell minWidth="100px" justify="center">
    //             {marketRelativeCollateralSizes.map((size, i) => <MarketImage imgProps={{ title: `${size*100}%`, display: size > 0 ? 'inline-block' : 'none' }} key={marketIcons[i]} image={marketIcons[i]} size={(size*10+10)} />)}
    //         </Cell>
    //     },
    // },
    {
        field: 'avgBorrowLimit',
        label: 'Avg Borrow Limit',
        header: ({ ...props }) => <ColHeader minWidth="110px" justify="flex-end"  {...props} />,
        value: ({ debt, avgBorrowLimit }) => {
            const color = getRiskColor(100 - avgBorrowLimit);
            return <Cell minWidth="110px" justify="flex-end" >
                <CellText color={debt > 0 ? color : undefined}>{debt > 0 ? `${shortenNumber(avgBorrowLimit, 2)}%` : '-'}</CellText>
            </Cell>
        },
    },
]

const CHART_URLS: { [key: string]: string } = {
    'nbUsers': 'https://app.inverse.watch/embed/query/473/visualization/593?api_key=V5YPx0uk9MQ46ksOW1Uu49u7LL6GPLQXimfv177H&',
}

export const FirmUsers = ({

}: {

    }) => {
    const { priceUsd: dbrPriceUsd } = useDBRPrice();
    const { userPositions, positions, timestamp, isLoading } = useFirmUsers();
    const { isOpen: isChartOpen, onOpen: onChartOpen, onClose: onChartClose } = useDisclosure();

    const { onOpen, onClose, isOpen } = useDisclosure();
    const [position, setPosition] = useState(null);
    const [chartUrl, setChartUrl] = useState(null);
    const [isHideSmallSpenders, setIsHideSmallSpenders] = useState(false);

    const openUserDetails = async (data) => {
        setPosition(data);
        onOpen();
    }

    const nbUsers = userPositions.length;
    const nbBorrowers = userPositions.filter(p => p.debt > 0).length;
    const nbStakers = userPositions.filter(p => p.stakedInv > 0).length;
    const totalTvl = positions.reduce((prev, curr) => prev + (curr.depositsUsd), 0);
    const totalDebt = positions.reduce((prev, curr) => prev + curr.debt, 0);
    const avgHealth = positions?.length > 0 && totalDebt > 0 ? positions.reduce((prev, curr) => prev + curr.debtRiskWeight, 0) / totalDebt : 100;
    const avgRiskColor = getRiskColor(avgHealth);

    const openChart = (type = 'nbUsers') => {
        setChartUrl(CHART_URLS[type]);
        onChartOpen();
    }

    return <VStack w='full' spacing={{ base: '4', sm: '8' }}>
        {
            !!position && <FirmUserModal userData={position} isOpen={isOpen} onClose={onClose} />
        }
        <SimpleGrid justify="space-between" w='full' columns={{ base: 2, sm: 4 }} spacing={{ base: '4', sm: '6' }}>
            <StatBasic onClick={() => openChart('nbUsers')} isLoading={isLoading} name="Users" value={`${preciseCommify(nbUsers, 0)}`} />
            <StatBasic isLoading={isLoading} name="Stakers" value={`${preciseCommify(nbStakers, 0)}`} />
            <StatBasic isLoading={isLoading} name="Borrowers" value={`${preciseCommify(nbBorrowers, 0)}`} />
            <StatBasic isLoading={isLoading} name="DBR Yearly Spend" value={`${smartShortNumber(totalDebt, 2)} (${smartShortNumber(totalDebt * dbrPriceUsd, 2, true)})`} />
        </SimpleGrid>
        {
            !!chartUrl && <InfoModal
                noFooter={true}
                title="Historical Data"
                isOpen={isChartOpen}
                onClose={onChartClose}
                minW={{ base: '98vw', lg: '800px', xl: '1000px' }}
            >
                <VStack h={{ base: '300px', lg: '550px' }}>
                    <iframe
                        src={chartUrl}
                        width="100%"
                        height="550px"
                        frameBorder="0"
                        allowFullScreen
                    />
                </VStack>
            </InfoModal>
        }
        <Divider />
        <Container
            py="0"
            label="FiRM Users"
            description={timestamp ? `Last update ${timeSince(timestamp)}` : `Loading...`}
            contentProps={{ maxW: { base: '90vw', sm: '100%' }, overflowX: 'auto' }}
            headerProps={{
                direction: { base: 'column', md: 'row' },
                align: { base: 'flex-start', md: 'flex-end' },
            }}
            right={
                <HStack justify="space-between" spacing="4">
                    <VStack alignItems={{ base: 'flex-start', sm: 'center' }}>
                        <FormControl w='fit-content' cursor="pointer" justifyContent="flex-start" display='inline-flex' alignItems='center'>
                            <Text fontWeight="bold" whitespace="no-wrap" w='fit-content' mr="1" onClick={() => setIsHideSmallSpenders(!isHideSmallSpenders)}>
                                Hide Small Spenders
                            </Text>
                            <Switch onChange={(e) => setIsHideSmallSpenders(!isHideSmallSpenders)} size="sm" colorScheme="purple" isChecked={isHideSmallSpenders} />
                        </FormControl>
                        <Text textAlign="left" color={'secondaryTextColor'}>(Debt under 1,000)</Text>
                    </VStack>
                    <VStack alignItems={{ base: 'flex-start', sm: 'center' }}>
                        <Text fontWeight="bold">Avg Borrow Limit</Text>
                        {
                            isLoading ? <SmallTextLoader width={'50px'} />
                                : <Text color={avgRiskColor}>{shortenNumber(100 - avgHealth, 2)}%</Text>
                        }
                    </VStack>
                    <VStack alignItems="center">
                        <Text textAlign="center" fontWeight="bold">Total Value Locked</Text>
                        {
                            isLoading ? <SmallTextLoader width={'50px'} />
                                : <Text textAlign="center" color="secondaryTextColor">{shortenNumber(totalTvl, 2, true)}</Text>
                        }
                    </VStack>
                    <VStack alignItems="flex-end">
                        <Text textAlign="right" fontWeight="bold">Total Debt</Text>
                        {
                            isLoading ? <SmallTextLoader width={'50px'} />
                                : <Text textAlign="right" color="secondaryTextColor">{shortenNumber(totalDebt, 2, 0)}</Text>
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
                        keyName="user"
                        noDataMessage="No active user in last update"
                        columns={columns}
                        items={userPositions.filter(p => !isHideSmallSpenders || p.debt >= 1000)}
                        onClick={openUserDetails}
                        defaultSort="debt"
                        defaultSortDir="desc"
                    />
            }
        </Container>
    </VStack>
}