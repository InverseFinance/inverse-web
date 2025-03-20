import { Input } from '@app/components/common/Input';
import { RadioCardGroup } from '@app/components/common/Input/RadioCardGroup';
import { useEligibleRefunds } from '@app/hooks/useDAO';
import { NetworkIds, RefundableTransaction } from '@app/types';
import { shortenNumber } from '@app/util/markets';
import { timestampToUTC } from '@app/util/misc';
import { RepeatClockIcon } from '@chakra-ui/icons';
import { Divider, Flex, HStack, Stack, Text, VStack, InputLeftElement, InputGroup, Select } from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import { Timestamp } from '@app/components/common/BlockTimestamp/Timestamp';
import { SubmitButton } from '@app/components/common/Button';
import Container from '@app/components/common/Container';
import { InfoMessage } from '@app/components/common/Messages';
import ScannerLink from '@app/components/common/ScannerLink';
import { SkeletonBlob } from '@app/components/common/Skeleton';
import Table from '@app/components/common/Table';
import { ONE_DAY_MS } from '@app/config/constants';
import { getNetworkConfigConstants } from '@app/util/networks';
 ;
import { timeSince } from '@app/util/time';

const { MULTISIGS } = getNetworkConfigConstants();

export const DaoOperationsTable = () => {    
    const [eligibleTxs, setEligibleTxs] = useState<RefundableTransaction[]>([]);   
    // filtered inside table with subfilters
    const [visibleItems, setVisibleItems] = useState<RefundableTransaction[]>([]);
    const [txsToRefund, setTxsToRefund] = useState<RefundableTransaction[]>([]);    

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
        if (isLoading) {
            return;
        }
        const checkedTxs = txsToRefund.map(t => t.txHash);
        setEligibleTxs(items.map(t => ({ ...t, checked: checkedTxs.includes(t.txHash) })));
    }, [items, txsToRefund, isLoading]);

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
    ];

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

    const handleServerFilter = (value) => {
        setServerFilter(value)
    }

    return (
        <Container
            label="DAO Transactions on Ethereum"
            description="Taken into consideration: GovMills txs, Multisig txs, Delegations, Fed actions, Inv oracle txs"
            noPadding
            p="0"
            contentProps={{ maxW: { base: '90vw', sm: '100%' }, overflowX: 'auto', direction: 'column' }}            
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
                                    <Text>{cachedMostRecentTimestamp ? timeSince(cachedMostRecentTimestamp) : '-'}</Text>
                                </VStack>
                            </HStack>
                        </HStack>                        
                        <Stack
                            direction="row"
                            justifyContent="space-between"
                            alignItems="center">
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
                        </Stack>
                        <Divider />
                        <Table
                            columns={columns}
                            items={eligibleTxs}
                            keyName={'txHash'}
                            defaultSort="timestamp"
                            defaultSortDir="desc"
                            defaultFilters={subfilters}
                            onFilter={(visibleItems, filters) => {
                                setVisibleItems(visibleItems)
                                setSubfilters(filters);
                            }}
                        />                        
                    </VStack>
            }
        </Container>
    )
}