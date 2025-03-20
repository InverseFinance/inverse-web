import { useWeb3React } from "@web3-react/core";
import { VStack, Text, Flex, Stack } from "@chakra-ui/react";
import { InfoMessage, WarningMessage } from "../common/Messages";
import Container, { AppContainerProps } from "../common/Container";
import { NetworkIds } from "@app/types";
import { smartShortNumber } from "@app/util/markets";
import Table from "../common/Table";
import ScannerLink from "../common/ScannerLink";
 
import { useBaseAddressWithdrawals } from "./useBase";
import { SkeletonBlob } from "../common/Skeleton";
import { switchWalletNetwork } from "@app/util/web3";
import { useAccount } from "@app/hooks/misc";
import { formatDate, timeSince } from "@app/util/time";

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
        field: 'hash',
        label: 'Hash',
        header: ({ ...props }) => <ColHeader justify="flex-start" {...props} minWidth="120px" />,
        value: ({ hash }) => {
            return <Cell w="120px" justify="flex-start" position="relative" onClick={(e) => e.stopPropagation()}>
                <ScannerLink value={hash} type="tx" chainId={NetworkIds.base} />
            </Cell>
        },
    },
    {
        field: 'timestamp',
        label: 'Time',
        header: ({ ...props }) => <Flex minW="100px" {...props} />,
        value: ({ timestamp }) => {
            return (
                <Flex minW="100px">
                    <VStack spacing="0">
                        <Text fontSize="12px">{timeSince(timestamp)}</Text>
                        <Text fontSize="10px">{formatDate(timestamp)}</Text>
                    </VStack>
                </Flex>
            )
        },
    },
    {
        field: 'symbol',
        label: 'Transaction',
        header: ({ ...props }) => <ColHeader minWidth="100px" justify="center"  {...props} />,
        value: ({ amount, symbol }) => {
            return <Cell minWidth="100px" justify="center" alignItems="center" direction="column" spacing="0">
                <CellText>{smartShortNumber(amount, 2, false, true)} {symbol}</CellText>
            </Cell>
        },
    },
    {
        field: 'shortDescription',
        label: 'Status',
        header: ({ ...props }) => <ColHeader minWidth="200px" justify="center"  {...props} />,
        value: ({ shortDescription }) => {
            return <Cell minWidth="200px" justify="center" alignItems="center" direction="column" spacing="0">
                <CellText fontSize='14px'>{shortDescription}</CellText>
            </Cell>
        },
    },
]

export const BaseTransactions = ({
    onClick,
    refreshIndex = 0,
    ...props
}: {
    onClick: (item: any) => void;
    refreshIndex?: number;
} & Partial<AppContainerProps>) => {
    const { provider, chainId } = useWeb3React();
    const account = useAccount();
    const { transactions, isLoading, hasError } = useBaseAddressWithdrawals(account, chainId, provider, refreshIndex);

    return <Container
        label="Base withdrawals transactions"
        description="Note: if you don't find a transaction, copy-paste the base txHash in the form directly"
        noPadding
        p="0"
        {...props}
    >
        {
            !account ? <InfoMessage alertProps={{ w: 'full' }} description="Please connect your wallet" />
                : <VStack spacing="4" w='full'>
                    {
                        chainId !== 1 ?
                            <InfoMessage alertProps={{ w: 'full' }} title={`Prove & Claim withdrawals`} description={
                                <Text textDecoration="underline" cursor="pointer"
                                    onClick={() => switchWalletNetwork(NetworkIds.mainnet)}
                                >
                                    Switch to Ethereum to continue the withdrawal process
                                </Text>
                            } />
                            : isLoading ? <SkeletonBlob skeletonHeight={2} noOfLines={8} /> :
                                hasError ?
                                    <WarningMessage description="Could not load transactions" /> : <Table
                                        noDataMessage="No withdrawal transactions yet"
                                        keyName="hash"
                                        columns={columns}
                                        items={transactions}
                                        defaultSort="timestamp"
                                        defaultSortDir="desc"
                                        onClick={v => onClick(v)}
                                    />
                    }
                </VStack>
        }
    </Container>
}