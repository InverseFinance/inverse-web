import { UnderlyingItem } from '@app/components/common/Assets/UnderlyingItem'
import { BigImageButton } from '@app/components/common/Button/BigImageButton'
import Container from '@app/components/common/Container'
import { AccordionItemTemplate } from '@app/components/common/FAQ'
import Link from '@app/components/common/Link'
import InfoModal from '@app/components/common/Modal/InfoModal'
import ScannerLink from '@app/components/common/ScannerLink'
import { SkeletonBlob } from '@app/components/common/Skeleton'
import Table from '@app/components/common/Table'
import { FedEvent, FedTypes, Prices } from '@app/types'
import { shortenNumber } from '@app/util/markets'
import { preciseCommify } from '@app/util/misc'
import { ExternalLinkIcon } from '@chakra-ui/icons'
import { Text, Flex, VStack, HStack, Stack, Badge, useDisclosure, Image, Accordion } from '@chakra-ui/react'
import { useState } from 'react'

const ColHeader = ({ ...props }) => {
    return <Flex justify="flex-start" minWidth={'150px'} fontSize="14px" fontWeight="extrabold" {...props} />
}

const Cell = ({ ...props }) => {
    return <Stack direction="row" fontSize="14px" fontWeight="normal" justify="flex-start" minWidth="150px" {...props} />
}

const CellText = ({ ...props }) => {
    return <Text fontSize="15px" textTransform="capitalize" {...props} />
}

const columns = [
    {
        field: 'name',
        label: 'Fed',
        header: ({ ...props }) => <ColHeader minWidth="110px" justify="flex-start"  {...props} />,
        tooltip: 'Fed name, can also indicate the protocol used',
        value: ({ name, projectImage, badgeInfo, badgeProps }) => {
            return <Cell minWidth="110px">
                <Cell minWidth='110px' spacing="1" justify="center" alignItems={{ base: 'center', md: 'flex-start' }} direction={{ base: 'row', md: 'column' }}>
                    <HStack justify="flex-start" alignItems="center" spacing="1" w='full'>
                        <BigImageButton bg={`url('${projectImage}')`} h="25px" w="25px" backgroundSize='contain' backgroundRepeat="no-repeat" />
                        <CellText fontWeight="bold">{name?.replace(/ fed/i, '')}</CellText>
                    </HStack>
                    {
                        !!badgeInfo && <CellText fontWeight="bold">
                            <Badge fontWeight="normal"
                                textTransform="capitalize"
                                borderRadius="50px"
                                px="8px"
                                {...badgeProps}>
                                {badgeInfo}
                            </Badge>
                        </CellText>
                    }
                </Cell>
            </Cell>
        },
    },
    {
        field: 'address',
        label: 'Contract',
        tooltip: 'Link to the contract where the details and strategy are verifiable',
        header: ({ ...props }) => <ColHeader minWidth="140px" justify="center"  {...props} />,
        value: ({ address }) => {
            return <Cell alignItems="center" minWidth="140px" justify="center" fontSize="15px" onClick={(e) => e.stopPropagation()}>
                <ScannerLink value={address} useName={false} />
            </Cell>
        },
    },
    {
        field: 'type',
        label: 'Fed Type',
        tooltip: <VStack alignItems="flex-start" justify="flex-start">
            <Text textAlign="left">- <b>{FedTypes.CROSS}</b>: lending protocol where a DOLA loan can be backed by several collaterals at the same time and those collaterals can also back other loans than DOLA loans.</Text>
            <Text textAlign="left">- <b>{FedTypes.ISOLATED}</b>: lending protocol where DOLA loans are independently backed by single collaterals</Text>
            <Text textAlign="left">- <b>{FedTypes.LP}</b>: DOLA is backed by the other assets in the liquidity pool</Text>
        </VStack>,
        header: ({ ...props }) => <ColHeader minWidth="140px" justify="center"  {...props} />,
        value: ({ type }) => {
            return <Cell alignItems="center" minWidth="140px" justify="center" fontSize="15px">
                <CellText>{type}</CellText>
            </Cell>
        },
    },
    {
        field: 'supply',
        label: 'Supplied by Fed',
        header: ({ ...props }) => <ColHeader minWidth="140px" justify="center"  {...props} />,
        tooltip: 'Amount of DOLA made available for borrowing / usage by the Fed (total DOLA supply can be higher as DOLA can also be supplied by other sources)',
        value: ({ supply }) => {
            return <Cell minWidth="140px" justify="center">
                <CellText>{supply > 0 ? shortenNumber(supply, 2) : '-'}</CellText>
            </Cell>
        },
    },
    {
        field: 'borrows',
        label: 'Borrowed',
        header: ({ ...props }) => <ColHeader minWidth="120px" justify="center"  {...props} />,
        tooltip: 'Amount of DOLA you borrowed from the Market',
        value: ({ borrows }) => {
            return <Cell minWidth="120px" justify="center">
                <CellText>{borrows > 0 ? shortenNumber(borrows, 2) : '-'}</CellText>
            </Cell>
        },
    },
    // {
    //     field: 'dolaBalance',
    //     label: 'PoL Balance',
    //     header: ({ ...props }) => <ColHeader minWidth="120px" justify="center"  {...props} />,
    //     tooltip: 'DOLA balance owned by the Fed in the liquidity pool',
    //     value: ({ dolaBalance }) => {
    //         return <Cell minWidth="120px" justify="center">
    //             <CellText>{dolaBalance > 0 ? shortenNumber(dolaBalance, 2) : '-'}</CellText>
    //         </Cell>
    //     },
    // }, 
    {
        field: 'polUsd',
        label: 'PoL $',
        header: ({ ...props }) => <ColHeader minWidth="120px" justify="center"  {...props} />,
        tooltip: 'Protocol-Owned-Liquidity worth in USD',
        value: ({ polUsd }) => {
            return <Cell minWidth="120px" justify="center">
                <CellText>{polUsd > 0 ? shortenNumber(polUsd, 2, true) : '-'}</CellText>
            </Cell>
        },
    }, 
    {
        field: 'detailsLinkName',
        label: 'More Data',
        header: ({ ...props }) => <ColHeader minWidth="120px" justify="flex-end"  {...props} />,
        tooltip: 'Internal or External link to show more data on the Fed',
        value: ({ detailsLink, detailsLinkName }) => {
            return <Cell minWidth="120px" justify="flex-end" onClick={(e) => e.stopPropagation()}>
                {
                    detailsLink ? <Link textDecoration="underline" href={detailsLink} isExternal target="_blank">
                        {detailsLinkName || 'See'}<ExternalLinkIcon ml="1" />
                    </Link>
                        : <CellText>-</CellText>
                }
            </Cell>
        },
    },
];

const ABOUTS = {
    [FedTypes.CROSS]: 'The Fed supplies DOLA in the DOLA market of a compound-style cross-lending protocol, the borrowing capacity of a user can depend on several different collaterals and this capacity can be used to borrow different assets including DOLA but not only. The utilization rate of DOLA is directly related to supply and demand which determines the borrowing APR, by adjusting the supply the Fed can effectively impact the borrowing APR, which helps to control DOLA peg by encouraging borrowers to repay their debt when APR is high or incite them to borrow when APR is low.',
    [FedTypes.ISOLATED]: 'The Fed supplies DOLA in the fixed-rate isolated-lending protocol FiRM, only DOLA can be borrowed, and the borrowing capacity is isolated by collateral. The borrowing APR is directly determined by the price of the DOLA Borrowing Right token (DBR).',
    [FedTypes.LP]: "AMM feds are operated to mint/burn DOLA's based on demand in a liquidity pool, when demand for DOLA is up in the pool which is represented by the increase in DOLA price, the Fed Chair will mint more DOLAs and deposit to the LP, bringing the balance back to where it was. It works similarly the other way. AMM Feds are powerful peg control tools for DOLA.",
}

export const FedList = ({ feds, isLoading, prices }: { feds: FedEvent[], isLoading?: boolean, prices: Prices["prices"] }) => {
    const { isOpen, onOpen, onClose } = useDisclosure();
    const [selectedFed, setSelectedFed] = useState(null);

    const handleClick = (item) => {
        setSelectedFed(item);
        onOpen();
    }

    return (
        <Container
            noPadding
            label="Active DOLA Feds Overview"
            description="Fed contracts handle the DOLA supply in a lending protocol or liquidity pool via expansions and contractions"
        >
            <InfoModal minW={{ base: 'auto', xl: '600px' }} title={`${selectedFed?.name}`} isOpen={isOpen} onClose={onClose} onOk={onClose}>
                <VStack spacing="4" py="4" w='full' alignItems="flex-start">
                    <Accordion w='full' allowToggle={true} defaultIndex={[0]}>
                        <AccordionItemTemplate
                            title={<Text fontWeight="extrabold" fontSize="16px">Strategy:</Text>}
                            body={
                                <Text>
                                    {
                                        selectedFed?.strategy?.description || 'Get borrowing interests on the DOLA borrowed in a Compound-style cross-lending protocol.'
                                    }
                                </Text>
                            }
                        />
                        <AccordionItemTemplate
                            title={<Text fontWeight="extrabold" fontSize="16px">About "{selectedFed?.type}" Feds:</Text>}
                            body={
                                <Text>
                                    {ABOUTS[selectedFed?.type]}
                                </Text>
                            }
                        />
                        {
                            !!selectedFed?.strategy?.pools && <AccordionItemTemplate
                                title={
                                    <HStack w='full' justify="space-between" fontSize="16px">
                                        <Text fontWeight="extrabold">Farming Pools:</Text>
                                        <HStack>
                                            {selectedFed.strategy.pools.map(pool => {
                                                return <Image h="20px" w="20px" key={pool.address} src={pool.image || selectedFed.projectImage} />
                                            })}
                                        </HStack>
                                    </HStack>
                                }
                                body={<VStack w='full' alignItems="flex-start">
                                    {selectedFed?.strategy?.pools.map(p => {
                                        return <HStack w='full' key={p.address} w='full' justify="space-between">
                                            <Link display="inline-flex" textDecoration="underline" color="mainTextColor" href={p.link} isExternal target="_blank">
                                                <Image src={p.image || selectedFed.projectImage} h="20px" w="20px" mr="4" /> {p.name}
                                            </Link>
                                            <ScannerLink chainId={selectedFed.incomeChainId || selectedFed.chainId} value={p.address} />
                                        </HStack>
                                    })}
                                </VStack>}
                            />
                        }
                        {
                            selectedFed?.subBalances?.length > 0 && <AccordionItemTemplate
                                title={
                                    <HStack w='full' justify="space-between" fontSize="16px">
                                        <Text fontWeight="extrabold">Total LP Size:</Text>
                                        <Text fontWeight="bold">{preciseCommify(selectedFed.lpTotalSupply, selectedFed.lpTotalSupply < 10 ? 2 : 0)} ({shortenNumber(selectedFed.lpTotalSupply * selectedFed.lpPrice, 2, true)})</Text>
                                    </HStack>
                                }
                                body={<VStack w='full' alignItems="flex-start">
                                    {
                                        selectedFed?.subBalances.map(tokenInLp => {
                                            return <HStack key={tokenInLp.address}>
                                                <HStack w='150px' alignItems="center">
                                                    <UnderlyingItem {...tokenInLp} label={tokenInLp.symbol} />
                                                </HStack>
                                                <Text>
                                                    {preciseCommify(tokenInLp.balance, 0)} ({shortenNumber(tokenInLp.perc, 2)}%)
                                                </Text>
                                            </HStack>;
                                        })
                                    }
                                </VStack>}
                            />
                        }
                        {
                            selectedFed?.subBalances?.length > 0 && <AccordionItemTemplate
                                title={
                                    <HStack w='full' justify="space-between" fontSize="16px">
                                        <Text fontWeight="extrabold">Protocol-Owned Liquidity:</Text>
                                        <Text fontWeight="bold">{shortenNumber(selectedFed.lpPol * 100, 2)}% - {preciseCommify(selectedFed.lpBalance, selectedFed.lpBalance < 10 ? 2 : 0)} ({shortenNumber(selectedFed.lpBalance * selectedFed.lpPrice, 2, true)})</Text>
                                    </HStack>
                                }
                                body={<VStack w='full' alignItems="flex-start">
                                    {
                                        selectedFed?.subBalances.map(tokenInLp => {
                                            return <HStack key={tokenInLp.address}>
                                                <HStack w='150px' alignItems="center">
                                                    <UnderlyingItem {...tokenInLp} label={tokenInLp.symbol} />
                                                </HStack>
                                                <Text>
                                                    {preciseCommify(tokenInLp.balance * selectedFed.lpPol, 0)} ({shortenNumber(tokenInLp.perc * selectedFed.lpPol, 2)}%)
                                                </Text>
                                            </HStack>;
                                        })
                                    }
                                </VStack>}
                            />
                        }
                        {
                            selectedFed?.rewards?.length > 0 && <AccordionItemTemplate
                                title={
                                    <HStack w='full' justify="space-between" fontSize="16px">
                                        <Text fontWeight="extrabold">Claimable Rewards:</Text>
                                        <Text fontWeight="bold">{
                                            shortenNumber(
                                                selectedFed?.rewards.reduce(
                                                    (prev, curr) => prev + curr.reward * prices[curr.rewardToken.coingeckoId]?.usd || 0,
                                                    0
                                                ),
                                                2,
                                                true,
                                            )}</Text>
                                    </HStack>
                                }
                                body={<VStack w='full' alignItems="flex-start">
                                    {
                                        selectedFed?.rewards.map(r => {
                                            return <HStack key={r.address}>
                                                <HStack w='100px' alignItems="center">
                                                    <UnderlyingItem {...r.rewardToken} label={r.rewardToken.symbol} />
                                                </HStack>
                                                <Text>
                                                    {preciseCommify(r.reward, 0)} ({shortenNumber(r.reward * prices[r.rewardToken.coingeckoId]?.usd || 0, 2, true)})
                                                </Text>
                                            </HStack>;
                                        })
                                    }
                                </VStack>}
                            />
                        }
                        {
                            selectedFed?.relatedFunds?.length > 0 && <AccordionItemTemplate
                                title={
                                    <HStack w='full' justify="space-between" fontSize="16px">
                                        <Text fontWeight="extrabold">Funds related to this Fed in TWG:</Text>
                                        <Text fontWeight="bold">{
                                            shortenNumber(
                                                selectedFed?.relatedFunds.reduce(
                                                    (prev, curr) => prev + curr.balance * prices[curr.token.coingeckoId]?.usd || 0,
                                                    0
                                                ),
                                                2,
                                                true,
                                            )}</Text>
                                    </HStack>
                                }
                                body={<VStack w='full' alignItems="flex-start">
                                    {
                                        selectedFed?.relatedFunds.map(r => {
                                            return <HStack key={r.token.address}>
                                                <HStack w='100px' alignItems="center">
                                                    <UnderlyingItem {...r.token} label={r.token.symbol} />
                                                </HStack>
                                                <Text>
                                                    {preciseCommify(r.balance, r.balance < 100 ? 2 : 0)} ({shortenNumber(r.balance * prices[r.token.coingeckoId]?.usd || 0, 2, true)})
                                                </Text>
                                            </HStack>;
                                        })
                                    }
                                </VStack>}
                            />
                        }
                    </Accordion>
                </VStack>
            </InfoModal>
            {
                feds?.length > 0 ?
                    <Table
                        keyName="address"
                        defaultSort="supply"
                        defaultSortDir="desc"
                        alternateBg={false}
                        columns={columns}
                        items={feds}
                        onClick={(item) => handleClick(item)}
                    />
                    : isLoading ? <SkeletonBlob /> : <Text>
                        No active feds
                    </Text>
            }
        </Container>
    )
}