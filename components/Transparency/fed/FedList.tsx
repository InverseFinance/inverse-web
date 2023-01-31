import { BigImageButton } from '@app/components/common/Button/BigImageButton'
import Container from '@app/components/common/Container'
import ScannerLink from '@app/components/common/ScannerLink'
import { SkeletonBlob } from '@app/components/common/Skeleton'
import Table from '@app/components/common/Table'
import { FedEvent } from '@app/types'
import { shortenNumber } from '@app/util/markets'
import { Text, Flex, VStack, HStack, Stack, Badge } from '@chakra-ui/react'

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
        tooltip: 'Market type, each market have an underlying token and strategy',
        value: ({ name, projectImage, badgeInfo, badgeProps }) => {
            return <Cell minWidth="105px">
                <Cell minWidth='105px' spacing="1" justify="center" alignItems={{ base: 'center', md: 'flex-start' }} direction={{ base: 'row', md: 'column' }}>
                    <HStack justify="flex-start" alignItems="center" spacing="1" w='full'>
                        <BigImageButton bg={`url('${projectImage}')`} h="25px" w="25px" backgroundSize='contain' backgroundRepeat="no-repeat" />
                        <CellText fontWeight="bold">{name.replace(/ fed/i, '')}</CellText>
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
        tooltip: 'Fed contracts handle the DOLA supply in a lending protocol or liquidity pool via expansions and contractions',
        header: ({ ...props }) => <ColHeader minWidth="160px" justify="center"  {...props} />,
        value: ({ address }) => {
            return <Cell alignItems="center" minWidth="160px" justify="center" fontSize="15px">
                <ScannerLink value={address} useName={false} />
            </Cell>
        },
    },
    {
        field: 'type',
        label: 'Type',
        tooltip: <VStack alignItems="flex-start" justify="flex-start">
            <Text textAlign="left">- <b>Cross</b>: lending protocol where a DOLA loan can be backed by several collaterals at the same time</Text>
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
        label: 'DOLA Supply',
        header: ({ ...props }) => <ColHeader minWidth="120px" justify="center"  {...props} />,
        tooltip: 'Amount of DOLA made available for borrowing / usage',
        value: ({ supply }) => {
            return <Cell minWidth="120px" justify="center">
                <CellText>{supply > 0 ? shortenNumber(supply, 2) : '-'}</CellText>
            </Cell>
        },
    },
]

export const FedList = ({ feds, isLoading }: { feds: FedEvent[], isLoading?: boolean }) => {
    return (
        <Container label="Fed types & details">
            {
                feds?.length > 0 ?
                    <Table
                        keyName="address"
                        defaultSort="supply"
                        defaultSortDir="desc"
                        alternateBg={false}
                        columns={columns}
                        items={feds}
                    />
                    : isLoading ? <SkeletonBlob /> : <Text>
                        No Contraction or Expansion has been executed yet
                    </Text>
            }
        </Container>
    )
}