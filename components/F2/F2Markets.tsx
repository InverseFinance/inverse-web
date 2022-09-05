import { Flex, Stack, Text } from "@chakra-ui/react"
import Table from "@app/components/common/Table";
import { UnderlyingItemBlock } from "@app/components/common/Assets/UnderlyingItemBlock";
import { shortenNumber } from "@app/util/markets";
import Container from "@app/components/common/Container";
import { useAccountF2Markets, useDBRMarkets } from '@app/hooks/useDBR';
import { commify } from 'ethers/lib/utils';
import { useRouter } from 'next/router';
import { useAccount } from '@app/hooks/misc';
import { getRiskColor } from "@app/util/f2";

const ColHeader = ({ ...props }) => {
    return <Flex justify="flex-start" minWidth={'150px'} fontSize="12px" fontWeight="extrabold" {...props} />
}

const Cell = ({ ...props }) => {
    return <Stack direction="row" fontSize="14px" fontWeight="normal" justify="flex-start" minWidth="150px" {...props} />
}

const columns = [
    {
        field: 'name',
        label: 'Market',
        header: ({ ...props }) => <ColHeader minWidth="100px" justify="center"  {...props} />,
        value: ({ address, underlying }) => {
            return <Cell minWidth="100px" justify="center" >
                <UnderlyingItemBlock symbol={underlying?.symbol} imgSize={20} />
            </Cell>
        },
    },
    {
        field: 'supplyApy',
        label: 'SUPPLY APY',
        header: ({ ...props }) => <ColHeader minWidth="100px" justify="center"  {...props} />,
        value: ({ supplyApy }) => {
            return <Cell minWidth="100px" justify="center" >
                <Text>{supplyApy}%</Text>
            </Cell>
        },
    },
    {
        field: 'price',
        label: 'price',
        header: ({ ...props }) => <ColHeader minWidth="100px" justify="center"  {...props} />,
        value: ({ price }) => {
            return <Cell minWidth="100px" justify="center" >
                <Text>${commify((price||0)?.toFixed(2))}</Text>
            </Cell>
        },
    },
    {
        field: 'collateralFactor',
        label: 'C.F',
        header: ({ ...props }) => <ColHeader minWidth="100px" justify="center"  {...props} />,
        value: ({ collateralFactor }) => {
            return <Cell minWidth="100px" justify="center" >
                <Text>{shortenNumber(collateralFactor, 2)}%</Text>
            </Cell>
        },
    },
    {
        field: 'totalDebt',
        label: 'Total Borrows',
        header: ({ ...props }) => <ColHeader minWidth="100px" justify="center"  {...props} />,
        value: ({ totalDebt }) => {
            return <Cell minWidth="100px" justify="center" >
                <Text>{shortenNumber(totalDebt, 2)} DOLA</Text>
            </Cell>
        },
    },
    {
        field: 'debt',
        label: 'You Borrowed',
        header: ({ ...props }) => <ColHeader minWidth="100px" justify="center"  {...props} />,
        value: ({ debt }) => {
            return <Cell minWidth="100px" justify="center" >
                <Text>{shortenNumber(debt, 2)} DOLA</Text>
            </Cell>
        },
    },
    {
        field: 'perc',
        label: 'Health',
        header: ({ ...props }) => <ColHeader minWidth="100px" justify="center"  {...props} />,
        value: ({ perc, hasDebt }) => {
            const color = getRiskColor(perc);
            return <Cell minWidth="100px" justify="center" >
                <Text color={color}>{hasDebt ? `${shortenNumber(perc, 2)}%` : '-'}</Text>
            </Cell>
        },
    },
]

export const F2Markets = ({

}: {

}) => {
    const { markets } = useDBRMarkets();
    const account = useAccount();
    const accountMarkets = useAccountF2Markets(markets, account);
    const router = useRouter();

    const openMarket = (market: any) => {
        router.push(`/f2/${market.name}`)
    }

    return <Container
        label="Markets"        
        contentProps={{ maxW: { base: '90vw', sm: '100%' }, overflowX: 'auto' }}
    >
        <Table
            keyName="address"
            noDataMessage="Loading..."
            columns={columns}
            items={accountMarkets}
            onClick={openMarket}
            defaultSort="address"
            defaultSortDir="desc"
        />
    </Container>
}