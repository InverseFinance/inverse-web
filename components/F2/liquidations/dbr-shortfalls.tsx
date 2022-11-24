import { Flex, HStack, Stack, Text, useDisclosure, VStack } from "@chakra-ui/react"
import { shortenNumber } from "@app/util/markets";
import Container from "@app/components/common/Container";
import { useDBRShortfalls } from "@app/hooks/useFirm";
import Link from "@app/components/common/Link";
import { ViewIcon } from "@chakra-ui/icons";
import ScannerLink from "@app/components/common/ScannerLink";
import moment from 'moment'
import { useState } from "react";
import { MarketImage } from "@app/components/common/Assets/MarketImage";
import { DbrReplenishmentModal } from "./DbrReplenishmentModal";
import TableV2 from "@app/components/common/Table/TableV2";

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
        field: 'user',
        label: 'Borrower',
        header: ({ ...props }) => <ColHeader justify="flex-start" {...props} minWidth="100px" />,
        value: ({ user }) => {
            return <Cell w="100px" justify="flex-start" position="relative" onClick={(e) => e.stopPropagation()}>
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
        field: 'deficit',
        label: 'DBR Deficit',
        header: ({ ...props }) => <ColHeader minWidth="100px" justify="center"  {...props} />,
        value: ({ deficit }) => {
            return <Cell minWidth="100px" justify="center" >
                <CellText>{shortenNumber(deficit, 2, false, true)}</CellText>
            </Cell>
        },
    },
    {
        field: 'debt',
        label: 'DOLA Debt',
        header: ({ ...props }) => <ColHeader minWidth="100px" justify="center"  {...props} />,
        value: ({ debt }) => {
            return <Cell minWidth="100px" justify="center" >
                <CellText>{shortenNumber(debt, 2)}</CellText>
            </Cell>
        },
    },
    {
        field: 'marketIcons',
        label: 'Collaterals',
        header: ({ ...props }) => <ColHeader minWidth="100px" justify="center"  {...props} />,
        value: ({ marketIcons }) => {
            return <Cell minWidth="100px" justify="center">
                {marketIcons.map(img => <MarketImage image={img} size={20} />)}
            </Cell>
        },
    },
]

export const DbrShortfalls = ({

}: {

    }) => {
    const { positions, timestamp } = useDBRShortfalls();
    const { onOpen, onClose, isOpen } = useDisclosure();
    const [position, setPosition] = useState(null);

    const openReplenish = async (data) => {
        setPosition(data);
        onOpen();
    }

    console.log(positions)
    const totalDeficit = positions.reduce((prev, curr) => prev + (curr.deficit), 0);
    const totalDebt = positions.reduce((prev, curr) => prev + curr.debt, 0);

    return <Container
        label="DBR Deficits"
        description={timestamp ? `Last update ${moment(timestamp).from()}` : `Loading...`}
        contentProps={{ maxW: { base: '90vw', sm: '100%' }, overflowX: 'auto' }}
        headerProps={{
            direction: { base: 'column', md: 'row' },
            align: { base: 'flex-start', md: 'flex-end' },
        }}
        right={
            <HStack justify="space-between" spacing="4">
                <VStack alignItems="flex-start">
                    <Text fontWeight="bold">Total DBR Deficit</Text>
                    <Text color="secondaryTextColor">{shortenNumber(totalDeficit, 2)}</Text>
                </VStack>
                <VStack alignItems="flex-end">
                    <Text fontWeight="bold">Total Debt</Text>
                    <Text color="secondaryTextColor">{shortenNumber(totalDebt, 2)}</Text>
                </VStack>
            </HStack>
        }
    >
        {
            !!position && position?.marketPositions?.length > 0 && <DbrReplenishmentModal isOpen={isOpen} onClose={onClose} position={position} />
        }
        <TableV2
            keyName="key"
            noDataMessage="No DBR deficits in last update"
            columns={columns}
            items={positions}
            onClick={(v) => openReplenish(v)}
            defaultSort="deficit"
            defaultSortDir="desc"
        />
    </Container>
}