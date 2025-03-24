import Link from "@app/components/common/Link"
import ScannerLink from "@app/components/common/ScannerLink"
import Table from "@app/components/common/Table"
import { getRiskColor } from "@app/util/f2"
import { shortenNumber } from "@app/util/markets"
import { ViewIcon } from "@chakra-ui/icons"
import { Flex, Stack, Text } from "@chakra-ui/react"
import { MarketNameAndIcon } from "../F2Markets"

export const FirmPositionsTable = ({
    onClick,
    positions,
    isOneUserOnly = false,
}: {
    onClick: (v: any) => void
    positions: any[]
    isOneUserOnly?: boolean
}) => {
    return <Table
        enableMobileRender={isOneUserOnly}
        keyName="key"
        noDataMessage="No live positions in last update"
        columns={isOneUserOnly ? oneUserOnlyColumns : columns}
        items={positions}
        onClick={onClick}
        defaultSort="debt"
        defaultSortDir="desc"
    />
}

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
        field: 'marketName',
        label: 'Market',
        header: ({ ...props }) => <ColHeader minWidth="200px" justify="flex-start"  {...props} />,
        value: ({ market }) => {
            const { name, icon, marketIcon, underlying } = market;
            return <Cell minWidth="200px" justify="flex-start" alignItems="center" >
                <MarketNameAndIcon name={name} marketIcon={marketIcon} icon={marketIcon} underlying={underlying} />
            </Cell>
        },
        showFilter: true,
        filterWidth: '200px',
        filterItemRenderer: ({ marketName }) => <CellText>{marketName}</CellText>
    },
    {
        field: 'user',
        label: 'Borrower',
        header: ({ ...props }) => <ColHeader justify="flex-start" {...props} minWidth="120px" />,
        value: ({ user }) => {
            return <Cell w="120px" justify="flex-start" position="relative" onClick={(e) => e.stopPropagation()}>
                <Link isExternal href={`/firm?viewAddress=${user}`}>
                    <ViewIcon color="blue.600" boxSize={3} />
                </Link>
                <ScannerLink value={user} />
            </Cell>
        },
        showFilter: true,
        filterWidth: '100px',
    },
    {
        field: 'depositsUsd',
        label: 'Deposits',
        header: ({ ...props }) => <ColHeader minWidth="100px" justify="center"  {...props} />,
        value: ({ deposits, depositsUsd }) => {
            return <Cell minWidth="100px" justify="center" alignItems="center" direction="column" spacing="0">
                <CellText>{shortenNumber(deposits, 2)}</CellText>
                <CellText>({shortenNumber(depositsUsd, 2, true)})</CellText>
            </Cell>
        },
    },
    {
        field: 'creditLimit',
        label: 'Max debt',
        header: ({ ...props }) => <ColHeader minWidth="100px" justify="center"  {...props} />,
        value: ({ creditLimit }) => {
            return <Cell minWidth="100px" justify="center" alignItems="center" direction="column" spacing="0">
                <CellText>{shortenNumber(creditLimit, 2)}</CellText>
            </Cell>
        },
    },
    {
        field: 'debt',
        label: 'Debt',
        header: ({ ...props }) => <ColHeader minWidth="100px" justify="center"  {...props} />,
        value: ({ debt }) => {
            return <Cell minWidth="100px" justify="center" >
                <CellText>{shortenNumber(debt, 2)}</CellText>
            </Cell>
        },
    },
    // {
    //     field: 'liquidationPrice',
    //     label: 'Liq. price',
    //     header: ({ ...props }) => <ColHeader minWidth="100px" justify="center"  {...props} />,
    //     value: ({ liquidationPrice }) => {
    //         return <Cell minWidth="100px" justify="center" alignItems="center" direction="column" spacing="0">
    //             <CellText>{preciseCommify(liquidationPrice, 2, true)}</CellText>                
    //         </Cell>
    //     },
    // },
    {
        field: 'isStableMarket',
        label: 'Stable?',
        header: ({ ...props }) => <ColHeader minWidth="90px" alignItems="center" justify="center"  {...props} />,
        value: ({ isStableMarket }) => {
            return <Cell minWidth="90px" justify="center" direction="column" alignItems="center">
                <CellText>{isStableMarket ? 'Yes' : 'No'}</CellText>
            </Cell>
        },
        showFilter: true,
        filterWidth: '100px',
    },
    {
        field: 'isLiquidatable',
        label: 'In shortfall?',
        header: ({ ...props }) => <ColHeader minWidth="150px" alignItems="center" justify="center"  {...props} />,
        value: ({ isLiquidatable }) => {
            return <Cell minWidth="150px" justify="center" direction="column" alignItems="center">
                <CellText color={isLiquidatable ? 'error' : 'mainTextColor'}>{isLiquidatable ? 'Yes' : 'No'}</CellText>
            </Cell>
        },
        showFilter: true,
        filterWidth: '100px',
    },
    {
        field: 'liquidatableDebt',
        label: 'Seizable',
        header: ({ ...props }) => <ColHeader minWidth="150px" alignItems="center" justify="center"  {...props} />,
        value: ({ seizableWorth, liquidatableDebt }) => {
            return <Cell minWidth="100px" justify="center" direction="column" alignItems="center">
                {
                    liquidatableDebt > 0 ? <>
                        <CellText>{shortenNumber(seizableWorth, 2, true)}</CellText>
                        <CellText>for {shortenNumber(liquidatableDebt, 2)} DOLA</CellText>
                    </> : <CellText>-</CellText>
                }
            </Cell>
        },
    },
    {
        field: 'userBorrowLimit',
        label: 'Borrow Limit',
        header: ({ ...props }) => <ColHeader minWidth="100px" justify="flex-end"  {...props} />,
        value: ({ perc, debt, userBorrowLimit }) => {
            const color = getRiskColor(perc);
            return <Cell minWidth="100px" justify="flex-end" >
                <CellText color={debt > 0 ? color : undefined}>{debt > 0 ? `${shortenNumber(userBorrowLimit, 2)}%` : '-'}</CellText>
            </Cell>
        },
    },
]

const oneUserOnlyColumns = [
    {
        field: 'marketName',
        label: 'Market',
        header: ({ ...props }) => <ColHeader minWidth="200px" justify="flex-start"  {...props} />,
        value: ({ market }) => {
            const { name, icon, marketIcon, underlying } = market;
            return <Cell minWidth="200px" justify="flex-start" alignItems="center" >
                <MarketNameAndIcon name={name} marketIcon={marketIcon} icon={marketIcon} underlying={underlying} />              
            </Cell>
        },
    },
    columns.find(c => c.field === 'depositsUsd'),
    columns.find(c => c.field === 'debt'),
    columns.find(c => c.field === 'userBorrowLimit'),
]