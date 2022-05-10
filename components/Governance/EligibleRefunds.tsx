import { useEligibleRefunds } from '@app/hooks/useDAO';
import { RefundableTransaction } from '@app/types';
import { submitRefunds } from '@app/util/governance';
import { Checkbox, Flex, Text } from '@chakra-ui/react';
import { Web3Provider } from '@ethersproject/providers';
import { useWeb3React } from '@web3-react/core';
import { useEffect, useState } from 'react';
import { Timestamp } from '../common/BlockTimestamp/Timestamp';
import { SubmitButton } from '../common/Button';
import Container from '../common/Container';
import ScannerLink from '../common/ScannerLink';
import { SkeletonBlob } from '../common/Skeleton';
import Table from '../common/Table';

export const EligibleRefunds = () => {
    const { library } = useWeb3React<Web3Provider>();
    const { transactions: items, isLoading } = useEligibleRefunds();
    const [eligibleTxs, setEligibleTxs] = useState<RefundableTransaction[]>([]);
    const [checkedTxs, setCheckedTxs] = useState<{ [key:string]: boolean }>({});

    useEffect(() => {
        setEligibleTxs(items.slice(0, 10))
    }, [items])

    const handleCheckTx = (txHash: string) => {
        setCheckedTxs({ ...checkedTxs, [txHash]: !checkedTxs[txHash] });
    }
    
    const columns = [
        {
            field: 'txHash',
            label: 'TX',
            header: ({ ...props }) => <Flex justify="flex-start" minWidth={'110px'} {...props} />,
            value: ({ txHash }) => <Flex justify="flex-start" minWidth={'110px'}>
                <ScannerLink type="tx" value={txHash} />
            </Flex>,
        },
        {
            field: 'timestamp',
            label: 'Date',
            header: ({ ...props }) => <Flex justify="center" minW={'120px'} {...props} />,
            value: ({ timestamp }) => <Flex justify="center" minW={'120px'}>
                <Timestamp timestamp={timestamp} />
            </Flex>,
        },
        {
            field: 'fees',
            label: 'Paid Fees',
            header: ({ ...props }) => <Flex justify="flex-end" minWidth={'200px'} {...props} />,
            value: ({ fees }) => <Flex justify="flex-end" minWidth={'200px'} alignItems="center">
                <Text mr="1">{fees}</Text>
                {/* <AnimatedInfoTooltip message={fees} /> */}
            </Flex>,
        },
        {
            field: 'name',
            label: 'Action',
            header: ({ ...props }) => <Flex justify="flex-end" minWidth={'180px'} {...props} />,
            value: ({ name, call }) => <Flex justify="flex-end" minWidth={'180px'} alignItems="center">
                {name}
            </Flex>,
        },
        {
            field: 'from',
            label: 'From',
            header: ({ ...props }) => <Flex justify="center" minWidth={'120px'} {...props} />,
            value: ({ from, chainId }) => <Flex justify="center" minWidth={'120px'}>
                <ScannerLink value={from} chainId={chainId} />
            </Flex>,
        },
        {
            field: 'to',
            label: 'Contract',
            header: ({ ...props }) => <Flex justify="center" minWidth={'200px'} {...props} />,
            value: ({ to, chainId }) => <Flex justify="center" minWidth={'200px'}>
                <ScannerLink value={to} chainId={chainId} />
            </Flex>,
        },
        {
            field: 'successful',
            label: 'Tx Success?',
            header: ({ ...props }) => <Flex justify="center" minWidth={'80px'} {...props} />,
            value: ({ successful }) => <Flex justify="center" minWidth={'80px'}>
                {successful ? 'yes' : 'no' }
            </Flex>,
        },
        {
            field: 'refunded',
            label: 'Refunded?',
            header: ({ ...props }) => <Flex justify="center" minWidth={'80px'} {...props} />,
            value: ({ refunded }) => <Flex justify="center" minWidth={'80px'}>
                {refunded ? 'yes' : 'no' }
            </Flex>,
        },
        {
            field: 'checked',
            label: '#',
            header: ({ ...props }) => <Flex justify="center" minWidth={'80px'} {...props} />,
            value: ({ txHash }) => <Flex justify="center" minWidth={'80px'}>
                <Checkbox value="true" onChange={() => handleCheckTx(txHash)} />
            </Flex>,
        },
    ];

    const handleRefund = (eligibleTxs, checkedTxs) => {
        if(!library?.getSigner()) { return }
        const checkedTxHashes = Object.entries(checkedTxs).filter(([key, val]) => val).map(([key]) => key);
        const items = eligibleTxs.filter(t => checkedTxHashes.includes(t.txHash));
        submitRefunds(items, library?.getSigner(), ({ refunds, signedBy, signedAt }) => {
            const refundsTxHashes = refunds.map(r => r.txHash);
            const updatedItems = [...eligibleTxs];
            eligibleTxs.forEach((et, i) => {
                if(refundsTxHashes.includes(et.txHash)){
                    const isRefunded = !et.refunded;
                    updatedItems[i] = { ...et, refunded: isRefunded, signedBy, signedAt }
                }
            })
            setEligibleTxs(updatedItems)
        })
    }

    return (
        <Container
            label="Potentially Eligible Transactions for Gas Refunds"
            description="Taken into consideration: GovMills txs (VoteCasting: only for delegates) and Multisig txs"
            noPadding
            contentProps={{ maxW: { base: '90vw', sm: '100%' }, overflowX: 'auto' }}
            collapsable={true}
            right={<SubmitButton w="100px" onClick={() => handleRefund(eligibleTxs, checkedTxs)}>
                Submit
            </SubmitButton>}
        >
            {
                isLoading ?
                    <SkeletonBlob />
                    :
                    eligibleTxs.length > 0 ?
                        <Table
                            columns={columns}
                            items={eligibleTxs}
                            keyName={'txHash'}
                            defaultSort="timestamp"
                            defaultSortDir="desc"
                            // onClick={handleRefund}
                            maxH="calc(100vh - 300px)"
                        />
                        :
                        <Text>No Delegation Events yet</Text>
            }
        </Container>
    )
}