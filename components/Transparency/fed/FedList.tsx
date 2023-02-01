import { BigImageButton } from '@app/components/common/Button/BigImageButton'
import Container from '@app/components/common/Container'
import Link from '@app/components/common/Link'
import InfoModal from '@app/components/common/Modal/InfoModal'
import ScannerLink from '@app/components/common/ScannerLink'
import { SkeletonBlob } from '@app/components/common/Skeleton'
import Table from '@app/components/common/Table'
import { FedEvent } from '@app/types'
import { shortenNumber } from '@app/util/markets'
import { ExternalLinkIcon } from '@chakra-ui/icons'
import { Text, Flex, VStack, HStack, Stack, Badge, useDisclosure, Image } from '@chakra-ui/react'
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
        header: ({ ...props }) => <ColHeader minWidth="105px" justify="flex-start"  {...props} />,
        tooltip: 'Fed name, can also indicate the protocol used',
        value: ({ name, projectImage, badgeInfo, badgeProps }) => {
            return <Cell minWidth="105px">
                <Cell minWidth='105px' spacing="1" justify="center" alignItems={{ base: 'center', md: 'flex-start' }} direction={{ base: 'row', md: 'column' }}>
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
        header: ({ ...props }) => <ColHeader minWidth="160px" justify="center"  {...props} />,
        value: ({ address }) => {
            return <Cell alignItems="center" minWidth="160px" justify="center" fontSize="15px">
                <ScannerLink value={address} useName={false} />
            </Cell>
        },
    },
    {
        field: 'type',
        label: 'Backing Type',
        tooltip: <VStack alignItems="flex-start" justify="flex-start">
            <Text textAlign="left">- <b>Cross</b>: lending protocol where a DOLA loan can be backed by several collaterals at the same time and those collaterals can also back other loans than DOLA loans.</Text>
            <Text textAlign="left">- <b>Isolated</b>: lending protocol where DOLA loans are independently backed by single collaterals</Text>
            <Text textAlign="left">- <b>LP</b>: DOLA is backed by the other assets in the liquidity pool</Text>
        </VStack>,
        header: ({ ...props }) => <ColHeader minWidth="160px" justify="center"  {...props} />,
        value: ({ type }) => {
            return <Cell alignItems="center" minWidth="160px" justify="center" fontSize="15px">
                <CellText>{type}</CellText>
            </Cell>
        },
    },
    {
        field: 'supply',
        label: 'Fed Supply',
        header: ({ ...props }) => <ColHeader minWidth="120px" justify="center"  {...props} />,
        tooltip: 'Amount of DOLA made available for borrowing / usage by the Fed (total DOLA supply can be higher as DOLA can also be supplied by other sources)',
        value: ({ supply }) => {
            return <Cell minWidth="120px" justify="center">
                <CellText>{supply > 0 ? shortenNumber(supply, 2) : '-'}</CellText>
            </Cell>
        },
    },
    {
        field: 'borrows',
        label: 'DOLA Borrowed',
        header: ({ ...props }) => <ColHeader minWidth="120px" justify="center"  {...props} />,
        tooltip: 'Amount of DOLA you borrowed from the Market',
        value: ({ borrows }) => {
            return <Cell minWidth="120px" justify="center">
                <CellText>{borrows > 0 ? shortenNumber(borrows, 2) : '-'}</CellText>
            </Cell>
        },
    }, {
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
]

export const FedList = ({ feds, isLoading }: { feds: FedEvent[], isLoading?: boolean }) => {
    const { isOpen, onOpen, onClose } = useDisclosure();
    const [selectedFed, setSelectedFed] = useState(null);

    const handleClick = (item) => {
        setSelectedFed(item);
        onOpen();
    }

    return (
        <Container
            noPadding
            label="Live DOLA Feds Overview"
            description="Fed contracts handle the DOLA supply in a lending protocol or liquidity pool via expansions and contractions"
        >
            <InfoModal title={`${selectedFed?.name}`} isOpen={isOpen} onClose={onClose}>
                <VStack p="4" w='full' alignItems="flex-start">
                    <Text fontWeight="bold" fontSize="18px">Strategy:</Text>
                    <Text>
                        {
                            selectedFed?.strategy?.description || 'Get borrowing interests on the DOLA borrowed in a Compound-style cross-lending protocol.'
                        }
                    </Text>
                    {
                        !!selectedFed?.strategy?.pools && <>
                            <Text fontWeight="bold" fontSize="18px">Pools:</Text>
                            {selectedFed?.strategy?.pools.map(p => {
                                return <HStack w='full' justify="space-between">
                                    <Link display="inline-flex" textDecoration="underline" color="mainTextColor" href={p.link} isExternal target="_blank">
                                        <Image src={p.image || selectedFed.projectImage} h="20px" w="20px" mr="1" /> {p.name}
                                    </Link>
                                    <ScannerLink chainId={p.incomeChainId || p.chainId} value={p.address} />
                                </HStack>
                            })}
                        </>
                    }
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
                        No Contraction or Expansion has been executed yet
                    </Text>
            }
        </Container>
    )
}