import ScannerLink from '@app/components/common/ScannerLink'
import { SkeletonBlob } from '@app/components/common/Skeleton'
import Table from '@app/components/common/Table'
import { FedEvent } from '@app/types'
import { shortenNumber } from '@app/util/markets'
import { formatDate, timeSince } from '@app/util/time'
import { ArrowForwardIcon, ArrowDownIcon, ArrowUpIcon } from '@chakra-ui/icons'
import { Text, Flex, Image, VStack } from '@chakra-ui/react'
 

const SupplyChange = ({ newSupply, changeAmount, isContraction }: { newSupply: number, changeAmount: number, isContraction: boolean }) => {
    return (
        <Flex alignItems="center" justify="space-between" color={isContraction ? 'info' : 'secondary'} pl="2" minW="140px">
            <Text fontSize="13px" textAlign="left" w="60px">{shortenNumber(newSupply - changeAmount, 2)}</Text>
            <ArrowForwardIcon />
            <Text fontSize="13px" textAlign="right" w="60px">{shortenNumber(newSupply, 2)}</Text>
        </Flex>
    )
}

const columns = [
    {
        field: 'shortname',
        label: 'Fed',
        header: ({ ...props }) => <Flex minW="120px" {...props} />,
        value: ({ shortname, isContraction, projectImage }) =>
            <Flex alignItems="center" color={isContraction ? 'info' : 'secondary'} minW="120px">
                <Image ignoreFallback={true} src={`${projectImage}`} w={'15px'} h={'15px'} mr="2" />
                {shortname}
            </Flex>,
    },
    {
        field: '_key',
        label: 'Time',
        header: ({ ...props }) => <Flex minW="100px" {...props} />,
        value: ({ timestamp, isContraction }) => {
            const textColor = isContraction ? 'info' : 'secondary'
            return (
                <Flex minW="100px">
                    <VStack spacing="0">
                        <Text color={textColor} fontSize="12px">{timeSince(timestamp)}</Text>
                        <Text color={textColor} fontSize="10px">{formatDate(timestamp)}</Text>
                    </VStack>
                </Flex>
            )
        },
    },
    {
        field: 'transactionHash',
        label: 'Transaction',
        header: ({ ...props }) => <Flex minW="120px" {...props} />,
        value: ({ transactionHash, chainId, isContraction }) => <Flex minW="120px">
            <ScannerLink color={isContraction ? 'info' : 'secondary'} value={transactionHash} type="tx" chainId={chainId} />
        </Flex>,
    },
    {
        field: 'event',
        label: 'Event Type',
        header: ({ ...props }) => <Flex justify="center" minW="95px" {...props} />,
        value: ({ event, isContraction }) => <Flex minW="95px" justify="center" alignItems="center" color={isContraction ? 'info' : 'secondary'}>
            {event}{isContraction ? <ArrowDownIcon /> : <ArrowUpIcon />}
        </Flex>,
    },
    {
        field: 'value',
        label: 'Amount',
        header: ({ ...props }) => <Flex justify="flex-end" minW="60px" {...props} />,
        value: ({ value, isContraction }) => <Flex justify="flex-end" minW="60px" color={isContraction ? 'info' : 'secondary'}>
            {shortenNumber(value, 1)}
        </Flex>,
    },
    {
        field: 'newSupply',
        label: 'New Fed Supply',
        header: ({ ...props }) => <Flex justify="center" minW="140px" {...props} />,
        value: ({ newSupply, value, isContraction }) =>
            <SupplyChange newSupply={newSupply} changeAmount={value} isContraction={isContraction} />
    },
]

const columnsWithTotal = columns.concat([
    {
        field: 'newTotalSupply',
        label: 'New TOTAL Supply',
        header: ({ ...props }) => <Flex justify="flex-end" minW="140px" {...props} />,
        value: ({ newTotalSupply, value, isContraction }) =>
            <SupplyChange newSupply={newTotalSupply} changeAmount={value} isContraction={isContraction} />
    },
])

export const FedPolicyTable = ({ fedHistoricalEvents, isLoading, showTotalCol = true }: { fedHistoricalEvents: FedEvent[], isLoading?: boolean, showTotalCol?: boolean }) => {
    return (
        fedHistoricalEvents?.length > 0 ?
            <Table
                keyName="_key"
                defaultSort="_key"
                defaultSortDir="desc"
                alternateBg={false}
                columns={showTotalCol ? columnsWithTotal : columns}
                items={fedHistoricalEvents}
            />
            : isLoading ? <SkeletonBlob /> : <Text>
                No Contraction or Expansion has been executed yet
            </Text>

    )
}