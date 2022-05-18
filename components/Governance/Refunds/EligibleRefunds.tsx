import { Input } from '@app/components/common/Input';
import { useEligibleRefunds } from '@app/hooks/useDAO';
import { RefundableTransaction } from '@app/types';
import { shortenNumber } from '@app/util/markets';
import { CheckIcon, MinusIcon, RepeatClockIcon } from '@chakra-ui/icons';
import { Box, Checkbox, Divider, Flex, HStack, Stack, Switch, Text, useDisclosure, VStack, InputLeftElement, InputGroup } from '@chakra-ui/react';
import { Web3Provider } from '@ethersproject/providers';
import { useWeb3React } from '@web3-react/core';
import { useEffect, useState } from 'react';
import { Timestamp } from '../../common/BlockTimestamp/Timestamp';
import { SubmitButton } from '../../common/Button';
import Container from '../../common/Container';
import { InfoMessage } from '../../common/Messages';
import ScannerLink from '../../common/ScannerLink';
import { SkeletonBlob } from '../../common/Skeleton';
import Table from '../../common/Table';
import { RefundsModal } from './RefundModal';

const TxCheckbox = ({ txHash, checked, refunded, handleCheckTx }) => {
    return <Flex justify="center" minWidth={'80px'} position="relative" onClick={() => handleCheckTx(txHash)}>
        <Box position="absolute" top="0" bottom="0" left="0" right="0" maring="auto" zIndex="1"></Box>
        {
            !refunded && <Checkbox value="true" isChecked={checked} />
        }
    </Flex>
}

export const EligibleRefunds = () => {
    const { account, library } = useWeb3React<Web3Provider>();
    const [eligibleTxs, setEligibleTxs] = useState<RefundableTransaction[]>([]);
    const [filteredTxs, setFilteredTxs] = useState<RefundableTransaction[]>([]);
    const [txsToRefund, setTxsToRefund] = useState<RefundableTransaction[]>([]);
    const [checkedTxs, setCheckedTxs] = useState<string[]>([]);
    const [hideAlreadyRefunded, setHideAlreadyRefunded] = useState(true);
    const { isOpen, onClose, onOpen } = useDisclosure();

    const now = new Date();
    const [startDate, setStartDate] = useState('2022-05-10');
    const [endDate, setEndDate] = useState(`${now.getUTCFullYear()}-${(now.getUTCMonth() + 1).toString().padStart(2, '0')}-${(now.getUTCDate()).toString().padStart(2, '0')}`);
    const [chosenStartDate, setChosenStartDate] = useState(startDate);
    const [chosenEndDate, setChosenEndDate] = useState(endDate);

    const { transactions: items, isLoading } = useEligibleRefunds(chosenStartDate, chosenEndDate);

    useEffect(() => {
        setFilteredTxs(hideAlreadyRefunded ? eligibleTxs.filter(t => !t.refunded) : eligibleTxs);
    }, [hideAlreadyRefunded, eligibleTxs])

    useEffect(() => {
        setEligibleTxs(items.map(t => ({ ...t, checked: checkedTxs.includes(t.txHash) })));
    }, [items]);

    useEffect(() => {
        setEligibleTxs(eligibleTxs.map(t => ({ ...t, checked: checkedTxs.includes(t.txHash) })));
    }, [checkedTxs])

    const handleCheckTx = (txHash: string) => {
        if (checkedTxs.includes(txHash)) {
            setCheckedTxs(checkedTxs.filter(h => txHash !== h));
        } else {
            setCheckedTxs([...checkedTxs, txHash])
        }
    }    

    const columns = [
        {
            field: 'txHash',
            label: 'TX',
            header: ({ ...props }) => <Flex justify="flex-start" minWidth={'110px'} {...props} />,
            value: ({ txHash, chainId }) => <Flex justify="flex-start" minWidth={'110px'}>
                <ScannerLink type="tx" value={txHash} chainId={chainId} />
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
            header: ({ ...props }) => <Flex justify="flex-end" minWidth={'100px'} {...props} />,
            value: ({ fees }) => <Flex justify="flex-end" minWidth={'100px'} alignItems="center">
                <Text mr="1">~{shortenNumber(parseFloat(fees), 5)}</Text>
                {/* <AnimatedInfoTooltip message={fees} /> */}
            </Flex>,
        },
        {
            field: 'name',
            label: 'Event',
            header: ({ ...props }) => <Flex justify="flex-end" minWidth={'180px'} {...props} />,
            value: ({ name }) => <Flex justify="flex-end" minWidth={'180px'} alignItems="center">
                {name}
            </Flex>,
            filterWidth: '180px',
            showFilter: true,
        },
        {
            field: 'from',
            label: 'From',
            header: ({ ...props }) => <Flex justify="center" minWidth={'120px'} {...props} />,
            value: ({ from, chainId }) => <Flex justify="center" minWidth={'120px'}>
                <ScannerLink value={from} chainId={chainId} />
            </Flex>,
            filterWidth: '120px',
            showFilter: true,
        },
        {
            field: 'type',
            label: 'Type',
            header: ({ ...props }) => <Flex justify="center" minWidth={'120px'} {...props} />,
            value: ({ type }) => <Flex justify="center" minWidth={'120px'}>
                <Text>{`${type[0].toUpperCase()}${type.substring(1, type.length)}`}</Text>
            </Flex>,
            filterWidth: '120px',
            showFilter: true,
        },
        {
            field: 'to',
            label: 'Contract',
            header: ({ ...props }) => <Flex justify="center" minWidth={'200px'} {...props} />,
            value: ({ to, chainId }) => <Flex justify="center" minWidth={'200px'}>
                <ScannerLink value={to} chainId={chainId} />
            </Flex>,
            filterWidth: '200px',
            showFilter: true,
        },
        {
            field: 'refunded',
            label: 'Refunded?',
            header: ({ ...props }) => <Flex justify="center" minWidth={'120px'} {...props} />,
            value: ({ refunded, refundTxHash, chainId }) => <Flex justify="center" minWidth={'120px'}>
                {
                    refunded ?
                        <VStack>
                            <CheckIcon color="secondary" />
                            <ScannerLink value={refundTxHash} type="tx" chainId={chainId} />
                        </VStack>
                        :
                        <MinusIcon />
                }
            </Flex>,
        },
        {
            field: 'checked',
            label: '#',
            header: ({ ...props }) => <Flex justify="center" minWidth={'80px'} {...props} />,
            value: ({ txHash, checked, refunded }) => <TxCheckbox txHash={txHash} checked={checked} refunded={refunded} handleCheckTx={handleCheckTx} />
        },
    ];

    const handleRefund = (eligibleTxs, checkedTxs) => {
        if (!library?.getSigner()) { return }
        const items = eligibleTxs.filter(t => checkedTxs.includes(t.txHash));
        setTxsToRefund(items);
        onOpen();
    }

    const handleSuccess = ({ refunds, signedBy, signedAt, refundTxHash }) => {
        const refundsTxHashes = refunds.map(r => r.txHash);
        const updatedItems = [...eligibleTxs];
        eligibleTxs.forEach((et, i) => {
            if (refundsTxHashes.includes(et.txHash)) {
                const isRefunded = !!refundTxHash;
                updatedItems[i] = { ...et, refundTxHash: refundTxHash, refunded: isRefunded, signedBy, signedAt }
            }
        })
        setEligibleTxs(updatedItems)
        setCheckedTxs([]);
        onClose();
    }

    const reloadData = () => {
        setChosenStartDate(startDate);
        setChosenEndDate(endDate);
    }

    const isValidDateFormat = (date: string) => {
        return /[0-9]{4}-[0-9]{2}-[0-9]{2}/.test(date);
    }

    return (
        <Container
            label="Potentially Eligible Transactions for Gas Refunds"
            description="Taken into consideration: GovMills txs (VoteCasting: only for delegates) and Multisig txs"
            noPadding
            contentProps={{ maxW: { base: '90vw', sm: '100%' }, overflowX: 'auto' }}
            collapsable={true}
            right={
                !account ?
                    <InfoMessage alertProps={{ fontSize: '12px' }} description="Please Connect Wallet" />
                    :
                    <InfoMessage alertProps={{ fontSize: '12px', w: '500px' }} description="Check at least one Transaction" />
            }
        >
            {
                isLoading ?
                    <SkeletonBlob />
                    :
                    <VStack spacing="4" w='full' alignItems="space-between">
                        <RefundsModal isOpen={isOpen} txs={txsToRefund} onClose={onClose} onSuccess={handleSuccess} />
                        <Stack
                            direction="row"
                            justifyContent="space-between"
                            alignItems="center">
                            <HStack alignItems="center">
                                <Text cursor="pointer" color={'secondaryTextColor'} onClick={() => setHideAlreadyRefunded(!hideAlreadyRefunded)}>Hide Already Refunded Txs?</Text>
                                <Switch isChecked={hideAlreadyRefunded} onChange={() => setHideAlreadyRefunded(!hideAlreadyRefunded)} />
                            </HStack>
                            <HStack>
                                <InputGroup>
                                    <InputLeftElement fontSize="12px" children={<Text color="secondaryTextColor" pl="4">From:</Text>} />
                                    <Input fontSize="12px" isInvalid={!isValidDateFormat(startDate)} p="0" value={startDate} placeholder="Start date UTC" onChange={(e) => setStartDate(e.target.value)} />
                                </InputGroup>
                                <InputGroup>
                                    <InputLeftElement fontSize="12px" children={<Text color="secondaryTextColor" pl="4">To:</Text>} />
                                    <Input fontSize="12px" isInvalid={!isValidDateFormat(endDate) && !!endDate} pattern="[0-9]{4}-[0-9]{2}-[0-9]{2}" p="0" value={endDate} placeholder="End date UTC" onChange={(e) => setEndDate(e.target.value)} />
                                </InputGroup>
                                <SubmitButton disabled={!isValidDateFormat(startDate) || (!isValidDateFormat(endDate) && !!endDate)} maxW="30px" onClick={reloadData}>
                                    <RepeatClockIcon />
                                </SubmitButton>
                            </HStack>
                            <HStack>
                                {/* <SubmitButton
                                        disabled={!checkedTxs.length || !account}
                                        w="240px"
                                        onClick={() => handleRefund(eligibleTxs, checkedTxs, refundTxHash)}>
                                        UNMARK AS REFUNDED
                                    </SubmitButton> */}
                                <SubmitButton
                                    disabled={!checkedTxs.length || !account}
                                    w="240px"
                                    onClick={() => handleRefund(eligibleTxs, checkedTxs)}>
                                    Refund {checkedTxs.length} Txs
                                </SubmitButton>
                            </HStack>
                        </Stack>
                        <Divider />
                        <Table
                            columns={columns}
                            items={filteredTxs}
                            keyName={'txHash'}
                            defaultSort="timestamp"
                            defaultSortDir="desc"
                        />
                        <HStack w='full' justifyContent="flex-end">
                            <SubmitButton
                                disabled={!checkedTxs.length || !account}
                                w="240px"
                                onClick={() => handleRefund(eligibleTxs, checkedTxs)}>
                                Refund {checkedTxs.length} Txs
                            </SubmitButton>
                        </HStack>
                    </VStack>
            }
        </Container>
    )
}