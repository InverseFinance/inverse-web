import ScannerLink from '@app/components/common/ScannerLink'
import { SkeletonBlob } from '@app/components/common/Skeleton'
import Table from '@app/components/common/Table'
import { FedEvent } from '@app/types'
import { shortenNumber } from '@app/util/markets'
import { ArrowForwardIcon } from '@chakra-ui/icons'
import { Text, Flex, Image, VStack } from '@chakra-ui/react'
 

const SupplyChange = ({ newSupply, changeAmount }: { newSupply: number, changeAmount: number }) => {
    return (
        <Flex alignItems="center" justify="space-between" pl="2" minW="140px">
            <Text textAlign="left" w="60px">{shortenNumber(newSupply - changeAmount, 2)}</Text>
            <ArrowForwardIcon />
            <Text textAlign="right" w="60px">{shortenNumber(newSupply, 2)}</Text>
        </Flex>
    )
}

const columns = [
    {
        field: 'fedName',
        label: 'Fed',
        header: ({ ...props }) => <Flex minW="120px" {...props} />,
        value: ({ fedName, projectImage }) =>
            <Flex alignItems="center" minW="120px">
                <Image ignoreFallback={true} src={`${projectImage}`} w={'15px'} h={'15px'} mr="2" />
                {fedName}
            </Flex>,
    },
    {
        field: '_key',
        label: 'Time',
        header: ({ ...props }) => <Flex minW="100px" {...props} />,
        value: ({ timestamp }) => {
            const textColor = 'info'
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
        value: ({ transactionHash, chainId, incomeChainId, isMainnetTxForXchainFed }) => <Flex minW="120px">
            <ScannerLink value={transactionHash} type="tx" chainId={isMainnetTxForXchainFed ? chainId : incomeChainId||chainId} />
        </Flex>,
    },
    {
        field: 'profit',
        label: 'Profit',
        tooltip: 'After the bridging fee',
        header: ({ ...props }) => <Flex justify="flex-end" minW="60px" {...props} />,
        value: ({ profit }) => <Flex justify="flex-end" minW="60px" >
            {shortenNumber(profit, 2)}
        </Flex>,
    },
    {
        field: 'accProfit',
        label: 'New Fed Income',
        header: ({ ...props }) => <Flex justify="center" minW="140px" {...props} />,
        value: ({ accProfit, profit }) =>
            <SupplyChange newSupply={accProfit} changeAmount={profit} />
    },
]

const columnsWithTotal = columns.concat([
    {
        field: 'totalAccProfit',
        label: 'New TOTAL Income',
        header: ({ ...props }) => <Flex justify="flex-end" minW="140px" {...props} />,
        value: ({ totalAccProfit, profit }) =>
            <SupplyChange newSupply={totalAccProfit} changeAmount={profit} />
    },
])

export const FedIncomeTable = ({ fedHistoricalEvents, isLoading, showTotalCol = true }: { fedHistoricalEvents: FedEvent[], isLoading?: boolean, showTotalCol?: boolean }) => {    
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
            : isLoading ? <SkeletonBlob /> : <Text>No Take Profit action has been executed yet</Text>

    )
}