import Container from "@app/components/common/Container"
import { InfoMessage } from "@app/components/common/Messages"
import ScannerLink from "@app/components/common/ScannerLink"
import { SkeletonBlob } from "@app/components/common/Skeleton"
import Table from "@app/components/common/Table"
import { ERC20_ABI } from "@app/config/abis"
import { useCustomSWR } from "@app/hooks/useCustomSWR"
import useEtherSWR from "@app/hooks/useEtherSWR"
import { NetworkIds } from "@app/types"
import { getBnToNumber, shortenNumber } from "@app/util/markets"
import { Flex, Text, Stack } from "@chakra-ui/react"
import moment from "moment"

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
        field: 'timestamp',
        label: 'Time',
        header: ({ ...props }) => <Flex minW="120px" {...props} />,
        value: ({ timestamp }) => {
            return (
                <Cell spacing="0" direction="column" w="120px" justify="flex-start">
                    <Text fontWeight="bold" fontSize="12px">{moment(timestamp).fromNow()}</Text>
                    <Text fontSize="12px">{moment(timestamp).format('MMM Do YYYY')}</Text>
                </Cell>
            )
        },
    },
    {
        field: 'account',
        label: 'Requester',
        header: ({ ...props }) => <ColHeader justify="flex-start" {...props} minWidth="120px" />,
        value: ({ account }) => {
            return <Cell w="120px" justify="flex-start" position="relative" onClick={(e) => e.stopPropagation()}>
                {
                    !!account && <ScannerLink value={account} type="address" chainId={NetworkIds.mainnet} />
                }
            </Cell>
        },
    },
    {
        field: 'value',
        label: 'Collateral Address',
        header: ({ ...props }) => <ColHeader justify="flex-start" {...props} minWidth="120px" />,
        value: ({ value }) => {
            return <Cell w="120px" justify="flex-start" position="relative" onClick={(e) => e.stopPropagation()}>
                {
                    !!value ? <ScannerLink useName={false} value={value} type="address" chainId={NetworkIds.mainnet} /> : <CellText>n/a</CellText>
                }
            </Cell>
        },
    },
    {
        field: 'symbol',
        label: 'Collateral Symbol',
        header: ({ ...props }) => <ColHeader minWidth="100px" justify="center"  {...props} />,
        value: ({ symbol }) => {
            return <Cell minWidth="100px" justify="center" alignItems="center" direction="column" spacing="0">
                <CellText>{symbol}</CellText>
            </Cell>
        },
    },
    {
        field: 'balance',
        label: 'User Balance',
        header: ({ ...props }) => <ColHeader minWidth="100px" justify="center"  {...props} />,
        value: ({ value, balance }) => {            
            return <Cell minWidth="100px" justify="center" alignItems="center" direction="column" spacing="0">
                <CellText>
                    {value ? shortenNumber(balance, 2) : 'n/a'}
                </CellText>
            </Cell>
        },
    },
    {
        field: 'wouldUse',
        label: 'Will use?',
        header: ({ ...props }) => <ColHeader minWidth="100px" justify="center"  {...props} />,
        value: ({ wouldUse }) => {
            return <Cell minWidth="100px" justify="center" alignItems="center" direction="column" spacing="0">
                <CellText textTransform="capitalize">{wouldUse ? 'yes' : 'no'}</CellText>
            </Cell>
        },
    },
    {
        field: 'description',
        label: 'Description',
        header: ({ ...props }) => <ColHeader w="300px" justify="center"  {...props} />,
        value: ({ description }) => {
            return <Cell w="300px" justify="center" alignItems="center" direction="column" spacing="0">
                <CellText fontSize='14px'>{description}</CellText>
            </Cell>
        },
    },
]

export const CollateralRequestList = () => {
    const { data, error } = useCustomSWR(`/api/f2/request-collateral`);
    const requests = data?.requests || [];

    const { data: balances } = useEtherSWR({
        abi: ERC20_ABI,
        args: requests.map(r => {
            return r.value ? [r.value, 'balanceOf', r.account] : ['getBalance', r.account]
        })
    });
    
    balances?.forEach((b, i) => {
        if(requests[i].decimals) {
            requests[i].balance = getBnToNumber(b, requests[i].decimals);
        }        
    });

    const isLoading = !data && !error;

    return <Container label="Collateral Requests" noPadding p="0">
        {
            isLoading && <SkeletonBlob />
        }
        {
            !isLoading && !requests.length && <InfoMessage alertProps={{ w: 'full' }} description="No collateral requests yet" />
        }
        {
            !!balances && requests.length > 0 && <Table
                keyName="key"
                columns={columns}
                items={requests}
                defaultSort="timestamp"
                defaultSortDir="desc"
            />
        }
    </Container>
}