import { useWeb3React } from "@web3-react/core";
import { VStack, Text, Flex, Stack } from "@chakra-ui/react";
import { InfoMessage } from "../common/Messages";
import Container from "../common/Container";
import { NetworkIds } from "@app/types";
import { smartShortNumber } from "@app/util/markets";
import Table from "../common/Table";
import ScannerLink from "../common/ScannerLink";
import moment from "moment";
import { useBaseAddressWithdrawals } from "./useBaseAddressWithdrawals";
import { SkeletonBlob } from "../common/Skeleton";

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
                        <Text fontSize="12px">{moment(timestamp).fromNow()}</Text>
                        <Text fontSize="10px">{moment(timestamp).format('MMM Do YYYY')}</Text>
                    </VStack>
                </Flex>
            )
        },
    },
    {
        field: 'symbol',
        label: 'Infos',
        header: ({ ...props }) => <ColHeader minWidth="100px" justify="center"  {...props} />,
        value: ({ amount, symbol }) => {
            return <Cell minWidth="100px" justify="center" alignItems="center" direction="column" spacing="0">
                <CellText>{smartShortNumber(amount, 2)} {symbol}</CellText>
            </Cell>
        },
    },
    {
        field: 'shortDescription',
        label: 'Status',
        header: ({ ...props }) => <ColHeader minWidth="200px" justify="center"  {...props} />,
        value: ({ shortDescription }) => {
            return <Cell minWidth="200px" justify="center" alignItems="center" direction="column" spacing="0">
                <CellText>{shortDescription}</CellText>
            </Cell>
        },
    },
]

export const BaseTransactions = ({
    onClick
}) => {
    const { provider, account, chainId } = useWeb3React();
    const { transactions, hasError, isLoading } = useBaseAddressWithdrawals(account, chainId, provider);

    return <Container
        label="ERC20 withdrawals transactions"
        noPadding
        p="0"    
    >
        {
            !account ? <InfoMessage alertProps={{ w: 'full' }} description="Please connect your wallet" />
                : <VStack spacing="4" w='full'>
                    {
                        isLoading ? <SkeletonBlob skeletonHeight={6} noOfLines={5} /> :
                            <Table
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