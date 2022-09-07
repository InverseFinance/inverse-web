import { Flex, Stack, Text } from "@chakra-ui/react"
import Table from "@app/components/common/Table";
import { shortenNumber } from "@app/util/markets";
import Container from "@app/components/common/Container";
import { useAccountF2Markets, useDBRMarkets } from '@app/hooks/useDBR';
import { useRouter } from 'next/router';
import { useAccount } from '@app/hooks/misc';
import { getRiskColor } from "@app/util/f2";
import { BigImageButton } from "../common/Button/BigImageButton";

const ColHeader = ({ ...props }) => {
    return <Flex  justify="flex-start" minWidth={'150px'} fontSize="14px" fontWeight="extrabold" {...props} />
}

const Cell = ({ ...props }) => {
    return <Stack  direction="row" fontSize="14px" fontWeight="normal" justify="flex-start" minWidth="150px" {...props} />
}

const CellText = ({ ...props }) => {
    return <Text fontSize="16px" {...props}/>
}

const columns = [
    {
        field: 'name',
        label: 'Market',
        header: ({ ...props }) => <ColHeader minWidth="130px" justify="flex-start"  {...props} />,
        tooltip: 'Market type, each market have an underlying token and strategy',
        value: ({ name }) => {
            return <Cell minWidth="130px" justify="flex-start" alignItems="center" >
                <BigImageButton bg={`url('/assets/f2/markets/${name}.png')`} h="37px" w="60px" />
                <CellText>{name}</CellText>
            </Cell>
        },
    },
    // {
    //     field: 'supplyApy',
    //     label: 'SUPPLY APY',
    //     header: ({ ...props }) => <ColHeader minWidth="100px" justify="center"  {...props} />,
    //     value: ({ supplyApy }) => {
    //         return <Cell minWidth="100px" justify="center" >
    //             <Text>{supplyApy}%</Text>
    //         </Cell>
    //     },
    // },
    // {
    //     field: 'price',
    //     label: 'price',
    //     header: ({ ...props }) => <ColHeader minWidth="100px" justify="center"  {...props} />,
    //     value: ({ price }) => {
    //         return <Cell minWidth="100px" justify="center" >
    //             <CellText>${commify((price||0)?.toFixed(2))}</CellText>
    //         </Cell>
    //     },
    // },
    {
        field: 'collateralFactor',
        label: 'C.F',
        header: ({ ...props }) => <ColHeader minWidth="90px" justify="center"  {...props} />,
        tooltip: 'Collateral Factor: percentage of the collateral worth transformed into borrowing power',
        value: ({ collateralFactor }) => {
            return <Cell minWidth="90px" justify="center" >
                <CellText>{shortenNumber(collateralFactor, 2)}%</CellText>
            </Cell>
        },
    },
    {
        field: 'dola',
        label: 'Liquidity',
        header: ({ ...props }) => <ColHeader minWidth="100px" justify="center"  {...props} />,
        tooltip: 'Remaining borrowable DOLA liquidity',
        value: ({ dola }) => {
            return <Cell minWidth="100px" justify="center" >
                <CellText>{shortenNumber(dola, 2, true)}</CellText>
            </Cell>
        },
    },
    {
        field: 'totalDebt',
        label: 'Borrows',
        header: ({ ...props }) => <ColHeader minWidth="150px" justify="center"  {...props} />,
        tooltip: 'Total DOLA borrowed in the Market',
        value: ({ totalDebt }) => {
            return <Cell minWidth="150px" justify="center" >
                <CellText>{shortenNumber(totalDebt, 2, true)}</CellText>
            </Cell>
        },
    },
    {
        field: 'collateral',
        label: 'Wallet',
        header: ({ ...props }) => <ColHeader minWidth="100px" justify="center"  {...props} />,
        tooltip: 'Collateral balance in your wallet',
        value: ({ collateral, price }) => {
            return <Cell minWidth="100px" justify="center" alignItems="center" direction="column" spacing="0">
                <CellText>{shortenNumber(collateral, 2)}</CellText>
                <CellText>({shortenNumber(collateral * price, 2, true)})</CellText>
            </Cell>
        },
    },
    {
        field: 'debt',
        label: 'Your Deposits',
        header: ({ ...props }) => <ColHeader minWidth="150px" justify="center"  {...props} />,
        tooltip: 'Amount of Collateral you deposited in the Market',
        value: ({ deposits, price }) => {
            return <Cell minWidth="150px" justify="center" alignItems="center" direction="column" spacing="0">
            <CellText>{shortenNumber(deposits, 2)}</CellText>
            <CellText>({shortenNumber(deposits * price, 2, true)})</CellText>
        </Cell>
        },
    },
    {
        field: 'debt',
        label: 'Your Debt',
        header: ({ ...props }) => <ColHeader minWidth="120px" justify="center"  {...props} />,
        tooltip: 'Amount of DOLA you borrowed from the Market',
        value: ({ debt }) => {
            return <Cell minWidth="120px" justify="center" >
                <CellText>{shortenNumber(debt, 2, true)}</CellText>
            </Cell>
        },
    },
    {
        field: 'perc',
        label: 'Loan Health',
        header: ({ ...props }) => <ColHeader minWidth="150px" justify="flex-end"  {...props} />,
        tooltip: 'Remaining Collateral Health',
        value: ({ perc, hasDebt }) => {
            const color = getRiskColor(perc);
            return <Cell minWidth="150px" justify="flex-end" >
                <CellText color={perc && hasDebt ? color : undefined}>{hasDebt ? `${shortenNumber(perc, 2)}%` : '-'}</CellText>
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
        label="Fixed-Rate Markets"
        description="Read more about Inverse's Fixed Rate Markets"
        href="https://docs.inverse.finance/"
        image={<BigImageButton bg={`url('/assets/dola.png')`} h="50px" w="80px" />}
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