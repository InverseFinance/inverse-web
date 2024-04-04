import { Input } from '@app/components/common/Input';
import { RadioCardGroup } from '@app/components/common/Input/RadioCardGroup';
import { useEligibleRefunds } from '@app/hooks/useDAO';
import { NetworkIds, RefundableTransaction } from '@app/types';
import { namedAddress } from '@app/util';
import { addTxToRefund } from '@app/util/governance';
import { shortenNumber } from '@app/util/markets';
import { exportToCsv, timestampToUTC } from '@app/util/misc';
import { CheckIcon, MinusIcon, PlusSquareIcon, RepeatClockIcon } from '@chakra-ui/icons';
import { Box, Checkbox, Divider, Flex, HStack, Stack, Text, useDisclosure, VStack, InputLeftElement, InputGroup, Select } from '@chakra-ui/react';
import { Web3Provider } from '@ethersproject/providers';
import { useWeb3React } from '@web3-react/core';
import { isAddress } from 'ethers/lib/utils';
import { useEffect, useState } from 'react';
import { Timestamp } from '../../common/BlockTimestamp/Timestamp';
import { SubmitButton } from '../../common/Button';
import Container from '../../common/Container';
import { InfoMessage } from '../../common/Messages';
import ScannerLink from '../../common/ScannerLink';
import { SkeletonBlob } from '../../common/Skeleton';
import Table from '../../common/Table';
import { RefundsModal } from './RefundModal';
import { ONE_DAY_MS } from '@app/config/constants';
import { getNetworkConfigConstants } from '@app/util/networks';
import moment from 'moment';

const { MULTISIGS } = getNetworkConfigConstants();

const TxCheckbox = ({ txHash, checked, refunded, handleCheckTx }) => {
    // visually better, as table refresh can take XXXms
    const [localCheck, setLocalCheck] = useState(checked);

    useEffect(() => {
        setLocalCheck(checked);
    }, [checked]);

    return <Flex justify="center" minWidth={'80px'} position="relative" onClick={() => {
        setLocalCheck(!localCheck);
        setTimeout(() => handleCheckTx(txHash), 200);
    }}>
        <Box position="absolute" top="0" bottom="0" left="0" right="0" maring="auto" zIndex="1"></Box>
        {
            !refunded && <Checkbox value="true" isChecked={localCheck} />
        }
    </Flex>
}

export const EligibleRefunds = () => {
    const { account, provider } = useWeb3React<Web3Provider>();
    const [eligibleTxs, setEligibleTxs] = useState<RefundableTransaction[]>([]);
    // given to table
    const [tableItems, setTableItems] = useState<RefundableTransaction[]>([]);
    // filtered inside table with subfilters
    const [visibleItems, setVisibleItems] = useState<RefundableTransaction[]>([]);
    const [txsToRefund, setTxsToRefund] = useState<RefundableTransaction[]>([]);
    const [refundFilter, setRefundFilter] = useState<'all' | 'refunded' | 'non-refunded'>('non-refunded');
    const { isOpen, onClose, onOpen } = useDisclosure();

    const now = new Date();
    // const startOfMonth = `${now.getUTCFullYear()}-${(now.getUTCMonth() + 1).toString().padStart(2, '0')}-01`;    
    const [startDate, setStartDate] = useState(timestampToUTC((+(now)) - ONE_DAY_MS * 6));
    const [endDate, setEndDate] = useState(timestampToUTC(+(now)));
    const [chosenStartDate, setChosenStartDate] = useState(startDate);
    const [chosenEndDate, setChosenEndDate] = useState(endDate);
    const [reloadIndex, setReloadIndex] = useState(0);
    const [subfilters, setSubfilters] = useState({});
    const [serverFilter, setServerFilter] = useState('');
    const [serverMultisigFilter, setServerMultisigFilter] = useState('');
    const [chosenServerFilter, setChosenServerFilter] = useState(serverFilter);
    const [chosenServerMultisigFilter, setChosenServerMultisigFilter] = useState(serverMultisigFilter);

    const { transactions: items, isLoading, cachedMostRecentTimestamp } = useEligibleRefunds(chosenStartDate, chosenEndDate, reloadIndex, false, chosenServerFilter, chosenServerMultisigFilter);

    useEffect(() => {
        setTableItems(refundFilter === 'all' ? eligibleTxs : eligibleTxs.filter(t => t.refunded === (refundFilter === 'refunded')));
    }, [refundFilter, eligibleTxs])

    useEffect(() => {
        if (isLoading) {
            return;
        }
        const checkedTxs = txsToRefund.map(t => t.txHash);
        setEligibleTxs(items.map(t => ({ ...t, checked: checkedTxs.includes(t.txHash) })));
    }, [items, txsToRefund, isLoading]);

    const handleCheckTx = (tx: RefundableTransaction) => {
        const { txHash } = tx;
        const checkedTxs = txsToRefund.map(t => t.txHash);
        const _toRefund = [...txsToRefund];
        const txIndex = checkedTxs.indexOf(txHash);
        if (txIndex !== -1) {
            _toRefund.splice(txIndex, 1);
        } else {
            _toRefund.push(tx);
        }
        setTxsToRefund(_toRefund);
    }

    const toggleAll = (isSelect: boolean) => {
        const checkedTxHashes = txsToRefund.map(t => t.txHash);
        const removed: string[] = [];
        const _toRefund = [...txsToRefund];
        visibleItems
            .filter(t => !t.refunded)
            .forEach((tx) => {
                const { txHash } = tx;
                const txIndex = checkedTxHashes.indexOf(txHash);
                if (txIndex !== -1 && !isSelect) {
                    removed.push(txHash);
                }
                else if (txIndex === -1 && isSelect) {
                    _toRefund.push(tx);
                }
            });
        setTxsToRefund(isSelect ? _toRefund : _toRefund.filter(t => !removed.includes(t.txHash)));
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
            value: ({ name, contractTicker }) => <VStack justify="flex-end" minWidth={'180px'} alignItems="center">
                <Text>{name}</Text>
                {!!contractTicker && <Text>{contractTicker}</Text>}
            </VStack>,
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
            value: (tx: RefundableTransaction) => {
                const { txHash, checked, refunded } = tx;
                return <TxCheckbox txHash={txHash} checked={checked} refunded={refunded} handleCheckTx={() => handleCheckTx(tx)} />;
            }
        },
    ];

    const handleRefund = (toRefund: RefundableTransaction[]) => {
        if (!provider?.getSigner()) { return }
        setTxsToRefund(toRefund);
        onOpen();
    }

    const handleSuccess = () => {
        setTxsToRefund([]);
        onClose();
        reloadData();
    }

    const reloadData = () => {
        setChosenStartDate(startDate);
        setChosenEndDate(endDate);
        setChosenServerFilter(serverFilter);
        setChosenServerMultisigFilter(serverFilter === 'multisig' ? serverMultisigFilter : '');
        setReloadIndex(reloadIndex + 1);
    }

    const isValidDateFormat = (date: string) => {
        return /[0-9]{4}-[0-9]{2}-[0-9]{2}/.test(date);
    }

    const addTx = () => {
        if (!provider?.getSigner()) { return }
        const txHash = window.prompt('Tx hash to add');
        if (!txHash) { return }
        return addTxToRefund(txHash, provider?.getSigner(), () => reloadData());
    }

    const handleExportAllVisibleCsv = () => {
        const data = visibleItems.map(({ txHash, timestamp, fees, name, from, type, to, refunded, refundTxHash }) => {
            return {
                TxHash: txHash,
                Timestamp: timestamp,
                DateUTC: timestampToUTC(timestamp),
                From: from,
                FromName: namedAddress(from),
                EventName: name,
                TxType: type,
                To: to || '',
                ToName: to && isAddress(to) ? namedAddress(to) : '',
                Fees: fees,
                Refunded: refunded,
                RefundTxHash: refundTxHash || '',
            };
        });
        data.sort((a, b) => b.Timestamp - a.Timestamp);
        exportToCsv(data, 'refunds_all_visible');
    }

    const handleExportCsv = () => {
        const data = txsToRefund.map(({ txHash, timestamp, fees, name, from, type, to, refunded, refundTxHash }) => {
            return {
                TxHash: txHash,
                Timestamp: timestamp,
                DateUTC: timestampToUTC(timestamp),
                From: from,
                FromName: namedAddress(from),
                EventName: name,
                TxType: type,
                To: to || '',
                ToName: to && isAddress(to) ? namedAddress(to) : '',
                Fees: fees,
                // Refunded: refunded,
                // RefundTxHash: refundTxHash || '',
            };
        });
        data.sort((a, b) => b.Timestamp - a.Timestamp);
        exportToCsv(data, 'refunds');
    }

    const CTAs = <HStack justifyContent="flex-end">
        <SubmitButton
            disabled={!txsToRefund.length || !account}
            w="180px"
            onClick={() => handleRefund(txsToRefund)}
            themeColor="green.500"
        >
            Inspect {txsToRefund.length} Txs
        </SubmitButton>
        <SubmitButton
            disabled={!visibleItems.length || !account}
            w="180px"
            onClick={() => handleExportAllVisibleCsv()}
            themeColor="green.500"
        >
            Export all visible
        </SubmitButton>
    </HStack>

    const handleServerFilter = (value) => {
        setServerFilter(value)
    }

    return (
        <Container
            label="Potentially Eligible Transactions for Gas Refunds"
            description="Taken into consideration: GovMills txs, Multisig txs, Delegations, Fed actions, Inv oracle txs"
            noPadding
            contentProps={{ maxW: { base: '90vw', sm: '100%' }, overflowX: 'auto', direction: 'column' }}
            collapsable={true}
            right={
                !account ?
                    <InfoMessage alertProps={{ fontSize: '12px' }} description="Please Connect Wallet" />
                    :
                    <HStack spacing="8">
                        <HStack>
                            <SubmitButton themeColor="blue.500" onClick={() => toggleAll(true)}>Select all visible</SubmitButton>
                            <SubmitButton themeColor="orange.500" onClick={() => toggleAll(false)}>Unselect all visible</SubmitButton>
                        </HStack>
                        <SubmitButton themeColor="pink.500" onClick={() => setTxsToRefund([])}>Unselect all</SubmitButton>
                    </HStack>
            }
        >
            {
                isLoading ?
                    <SkeletonBlob />
                    :
                    <VStack spacing="4" w='full' alignItems="space-between">
                        <HStack borderBottom="1px solid #ccc" pb="4" justify="space-between">
                            <HStack w='700px'>
                                <Text>Server-side filters:</Text>
                                <Select value={serverFilter} minW='fit-content' maxW='100px' onChange={(e) => handleServerFilter(e.target.value)}>
                                    <option value=''>All types</option>
                                    <option value='multisig'>Multisig</option>
                                    <option value='fed'>Fed</option>
                                    <option value='governance'>Governance</option>
                                    <option value='oracle'>INV Oracles</option>
                                    <option value='multidelegator'>INV Multidelegator</option>
                                    <option value='gnosisproxy'>Gnosis proxy</option>
                                    <option value='custom'>Custom txs</option>
                                </Select>
                                {
                                    serverFilter === 'multisig' &&
                                    <Select value={serverMultisigFilter}
                                        minW='fit-content'
                                        maxW='100px'
                                        onChange={(e) => setServerMultisigFilter(e.target.value)}>
                                        <option value="">All eligible multisigs</option>
                                        {
                                            MULTISIGS
                                                .filter(m => m.chainId === NetworkIds.mainnet)
                                                .map(m => <option key={m.shortName} value={m.shortName}>{m.shortName}</option>)
                                        }
                                    </Select>
                                }
                            </HStack>
                            <HStack w='650px' justify="flex-end">
                                <InfoMessage alertProps={{ fontSize: '12px' }} description="After choosing server filters or dates, click the reload icon" />
                                <VStack fontSize="12px" alignItems="flex-end">
                                    <Text>Latest cron job is from:</Text>
                                    <Text>{cachedMostRecentTimestamp ? moment(cachedMostRecentTimestamp).fromNow() : '-'}</Text>
                                </VStack>
                            </HStack>
                        </HStack>
                        <RefundsModal isOpen={isOpen} txs={txsToRefund} onClose={onClose} onSuccess={handleSuccess} handleExportCsv={handleExportCsv} />
                        <Stack
                            direction="row"
                            justifyContent="space-between"
                            alignItems="center">
                            <HStack alignItems="center" justifyItems="center">
                                <RadioCardGroup
                                    wrapperProps={{ w: 'full', justify: 'center' }}
                                    group={{
                                        name: 'bool',
                                        defaultValue: refundFilter,
                                        onChange: (value) => setRefundFilter(value),
                                    }}
                                    radioCardProps={{ w: 'fit-content', textAlign: 'center', px: '3', py: '1' }}
                                    options={[
                                        { label: 'All', value: 'all' },
                                        { label: 'Refunded', value: 'refunded' },
                                        { label: 'Non-Refunded', value: 'non-refunded' }
                                    ]}
                                />
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
                                <SubmitButton maxW="30px" onClick={addTx}>
                                    <PlusSquareIcon />
                                </SubmitButton>
                            </HStack>
                            {CTAs}
                        </Stack>
                        <Divider />
                        <Table
                            columns={columns}
                            items={tableItems}
                            keyName={'txHash'}
                            defaultSort="timestamp"
                            defaultSortDir="desc"
                            defaultFilters={subfilters}
                            onFilter={(visibleItems, filters) => {
                                setVisibleItems(visibleItems)
                                setSubfilters(filters);
                            }}
                        />
                        {CTAs}
                    </VStack>
            }
        </Container>
    )
}