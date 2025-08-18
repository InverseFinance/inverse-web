import Table from "@app/components/common/Table"
import { shortenNumber } from "@app/util/markets"
import { Flex, Stack, Text } from "@chakra-ui/react"
import { MarketNameAndIcon } from "../F2Markets"

export const YieldBreakdownTable = ({
    items
}: {
    items: any[]
}) => {
    return <Table
        enableMobileRender={true}
        keyName="name"
        noDataMessage="No data"
        columns={columns}
        items={items}
        defaultSort="monthlyUsdYield"
        defaultSortDir="desc"
        mobileThreshold={800}
    />
}

const ColHeader = ({ ...props }) => {
    return <Flex justify="flex-start" minWidth={'100px'} fontSize="18px" fontWeight="extrabold" {...props} />
}

const Cell = ({ ...props }) => {
    return <Stack direction="row" fontSize="14px" fontWeight="normal" justify="flex-start" minWidth="100px" {...props} />
}

const CellText = ({ ...props }) => {
    return <Text fontSize="16px" {...props} />
}

const boxProps = { fontSize: '16px', fontWeight: 'bold' }

const columns = [
    {
        field: 'name',
        label: 'Market',
        boxProps,
        header: ({ ...props }) => <ColHeader minWidth="180px" justify="flex-start"  {...props} />,
        value: ({ name, underlying, marketIcon, icon }) => {
            return <Cell minWidth="180px" justify="flex-start" alignItems="flex-start" >
                <MarketNameAndIcon name={name} icon={icon} marketIcon={marketIcon} underlying={underlying} />
            </Cell>
        },
    },
    {
        field: 'depositsUsd',
        label: 'Deposits',
        boxProps,
        header: ({ ...props }) => <ColHeader minWidth="100px" justify="center"  {...props} />,
        value: ({ depositsUsd }) => {
            return <Cell minWidth="100px" justify="center" alignItems="center" direction="column" spacing="0">
                <CellText>{shortenNumber(depositsUsd, 2, true)}</CellText>
            </Cell>
        },
    },
    {
        field: 'totalApy',
        label: 'APY',
        boxProps,
        header: ({ ...props }) => <ColHeader minWidth="100px" justify="center"  {...props} />,
        value: ({ totalApy }) => {
            return <Cell minWidth="100px" justify="center" alignItems="center" direction="column" spacing="0">
                <CellText>{shortenNumber(totalApy, 2)}%</CellText>
            </Cell>
        },
    },
    {
        field: 'userLeveragedApy',
        label: 'Leveraged APY',
        boxProps,
        header: ({ ...props }) => <ColHeader minWidth="100px" justify="center"  {...props} />,
        value: ({ userLeveragedApy, underlying }) => {
            return <Cell minWidth="100px" justify="center" alignItems="center" direction="column" spacing="0">
                <CellText>{underlying?.isStable ? `~${shortenNumber(userLeveragedApy, 2)}%` : '-'}</CellText>
            </Cell>
        },
    },
    {
        field: 'userLeverageLevel',
        label: 'Leverage Level',
        boxProps,
        header: ({ ...props }) => <ColHeader minWidth="100px" justify="center"  {...props} />,
        value: ({ userLeverageLevel, underlying }) => {
            return <Cell minWidth="100px" justify="center" alignItems="center" direction="column" spacing="0">
                <CellText>{underlying?.isStable ? `~${shortenNumber(userLeverageLevel, 2)}x` : '-'}</CellText>
            </Cell>
        },
    },
    {
        field: 'monthlyUsdYield',
        label: 'Monthly Yield',
        boxProps,
        header: ({ ...props }) => <ColHeader minWidth="130px" justify="center"  {...props} />,
        value: ({ monthlyUsdYield }) => {
            return <Cell minWidth="130px" justify="center" alignItems="center" direction="column" spacing="0">
                <CellText>{shortenNumber(monthlyUsdYield, 2, true)}</CellText>
            </Cell>
        },
    },
    {
        field: 'monthlyDbrBurnUsd',
        label: 'Monthly Cost',
        boxProps,
        header: ({ ...props }) => <ColHeader minWidth="130px" justify="center"  {...props} />,
        value: ({ dbrUserRefPrice, monthlyDbrBurnUsd }) => {
            return <Cell minWidth="130px" justify="center" alignItems="center" direction="column" spacing="0">
                <CellText>{dbrUserRefPrice ? shortenNumber(monthlyDbrBurnUsd, 2, true) : 'Ref price not set'}</CellText>
            </Cell>
        },
    },
    {
        field: 'monthlyNetUsdYield',
        label: 'Monthly Net-Yield',
        boxProps,
        header: ({ ...props }) => <ColHeader minWidth="150px" justify="center"  {...props} />,
        value: ({ dbrUserRefPrice, monthlyNetUsdYield }) => {
            return <Cell minWidth="150px" justify="center" alignItems="center" direction="column" spacing="0">
                <CellText>{dbrUserRefPrice ? shortenNumber(monthlyNetUsdYield, 2, true) : 'Ref price not set'}</CellText>
            </Cell>
        },
    },
];