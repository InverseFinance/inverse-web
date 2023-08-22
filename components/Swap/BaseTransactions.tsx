import { useEffect, useState } from "react";
import {  getBaseAddressInfo, getEhereumBaseRelatedTransactions } from "@app/util/base";
import { useWeb3React } from "@web3-react/core";
import { VStack, Text, Flex, Stack } from "@chakra-ui/react";
import { InfoMessage } from "../common/Messages";
import Container from "../common/Container";
import { NetworkIds } from "@app/types";
import { useAppTheme } from "@app/hooks/useAppTheme";
import { shortenNumber } from "@app/util/markets";
import Table from "../common/Table";
import ScannerLink from "../common/ScannerLink";
import moment from "moment";

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
        field: 'amount',
        label: 'Amount',
        header: ({ ...props }) => <ColHeader minWidth="100px" justify="center"  {...props} />,
        value: ({ amount }) => {
            return <Cell minWidth="100px" justify="center" alignItems="center" direction="column" spacing="0">
                <CellText>{shortenNumber(amount, 2)}</CellText>
            </Cell>
        },
    },
    {
        field: 'step1',
        label: 'Step 1',
        header: ({ ...props }) => <ColHeader minWidth="100px" justify="center"  {...props} />,
        value: ({ canBeVerified }) => {
            return <Cell minWidth="100px" justify="center" alignItems="center" direction="column" spacing="0">
                <CellText>{ canBeVerified ? 'Verify' : 'Wait' }</CellText>
            </Cell>
        },
    },    
]

export const BaseTransactions = () => {
    const { provider, account, chainId } = useWeb3React();
    const { themeStyles } = useAppTheme();
    const [items, setItems] = useState([]);
    const [hasError, setHasError] = useState(false);

    useEffect(() => {
        if(!account) {
            setItems([]);
            return;
        }
        const init = async () => {
            const { hasError, results } = await getBaseAddressInfo(account);
            const { hasError: ethErr, results: ethResults } = await getEhereumBaseRelatedTransactions(account);
            console.log('---');
            console.log(results);
            console.log(ethResults);
            setHasError(hasError);
            setItems(results);
        }
        init();
    }, [account])
    
    return <Container
        label="Transactions"
        noPadding
        p="0"
        // contentProps={{ direction: 'column', minH: '400px' }}
    >
        {
            !account ? <InfoMessage alertProps={{ w: 'full' }} description="Please connect your wallet" />
                : <VStack spacing="4">
                    <Table
                        keyName="hash"
                        columns={columns}
                        items={items}
                    />
                </VStack>
        }
    </Container>
}