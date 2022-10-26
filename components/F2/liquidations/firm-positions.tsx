import { Flex, HStack, Stack, Text, useDisclosure, VStack } from "@chakra-ui/react"
import Table from "@app/components/common/Table";
import { shortenNumber } from "@app/util/markets";
import Container from "@app/components/common/Container";
import { f2liquidate, getRiskColor } from "@app/util/f2";
import { BigImageButton } from "@app/components/common/Button/BigImageButton";
import { useFirmPositions } from "@app/hooks/useFirm";
import Link from "@app/components/common/Link";
import { ViewIcon } from "@chakra-ui/icons";
import ScannerLink from "@app/components/common/ScannerLink";
import { useWeb3React } from "@web3-react/core";
import moment from 'moment'
import { useEffect, useState } from "react";
import { SimpleAmountForm } from "@app/components/common/SimpleAmountForm";
import { getNetworkConfigConstants } from "@app/util/networks";
import { InfoMessage } from "@app/components/common/Messages";
import { Modal } from "@app/components/common/Modal";

const { DOLA } = getNetworkConfigConstants();

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
            const { name, icon, marketIcon } = market;
            return <Cell minWidth="200px" justify="flex-start" alignItems="center" >
                <BigImageButton bg={`url('${marketIcon || icon}')`} h="40px" w="60px" backgroundSize='contain' backgroundRepeat="no-repeat" />
                <CellText>{name}</CellText>
            </Cell>
        },
        showFilter: true,
        filterWidth: '200px',
        filterItemRenderer: ({ marketName }) => <CellText>{marketName}</CellText>
    },
    {
        field: 'user',
        label: 'Account',
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
        field: 'deposits',
        label: 'Deposits',
        header: ({ ...props }) => <ColHeader minWidth="100px" justify="center"  {...props} />,
        value: ({ deposits, market }) => {
            return <Cell minWidth="100px" justify="center" alignItems="center" direction="column" spacing="0">
                <CellText>{shortenNumber(deposits, 2)}</CellText>
                <CellText>({shortenNumber(deposits * market?.price, 2, true)})</CellText>
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
        field: 'isLiquidatable',
        label: 'In shortfall?',
        header: ({ ...props }) => <ColHeader minWidth="150px" alignItems="center" justify="center"  {...props} />,
        value: ({ isLiquidatable }) => {
            return <Cell minWidth="150px" justify="center" direction="column" alignItems="center">
                <CellText>{isLiquidatable}</CellText>
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
            return <Cell minWidth="150px" justify="center" direction="column" alignItems="center">
                <CellText>{shortenNumber(seizableWorth, 2, true)}</CellText>
                <CellText>for {shortenNumber(liquidatableDebt, 2)} DOLA</CellText>
            </Cell>
        },
    },
    {
        field: 'perc',
        label: 'Loan Health',
        header: ({ ...props }) => <ColHeader minWidth="100px" justify="flex-end"  {...props} />,
        value: ({ perc, debt }) => {
            const color = getRiskColor(perc);
            return <Cell minWidth="100px" justify="flex-end" >
                <CellText color={debt > 0 ? color : undefined}>{debt > 0 ? `${shortenNumber(perc, 2)}%` : '-'}</CellText>
            </Cell>
        },
    },
]

export const FirmPositions = ({

}: {

    }) => {
    const { library } = useWeb3React();
    const { positions, timestamp } = useFirmPositions();
    const { onOpen, onClose, isOpen } = useDisclosure();
    const [position, setPosition] = useState(null);
    const [repayAmount, setRepayAmount] = useState('');
    const [seizeAmount, setSeizeAmount] = useState(0);
    const [seizeWorth, setSeizeWorth] = useState(0);

    useEffect(() => {
        if (!position) { return }
        const repayFloat = parseFloat(repayAmount) || 0;
        const seizeWorth = repayFloat + repayFloat * position.market.liquidationIncentive;
        setSeizeWorth(seizeWorth);
        setSeizeAmount(seizeWorth / position.market.price);
    }, [repayAmount, position]);

    const openLiquidation = async (data) => {
        setPosition(data);
        setRepayAmount('');
        setSeizeAmount(0);
        setSeizeWorth(0);
        onOpen();
    }

    const handleLiquidation = async (repayAmountBn) => {
        return f2liquidate(library?.getSigner(), position.user, position.market.address, repayAmountBn);
    }

    return <Container
        label="FiRM Positions"
        description={timestamp ? `Last update ${moment(timestamp).from()}` : `Loading...`}
        contentProps={{ maxW: { base: '90vw', sm: '100%' }, overflowX: 'auto' }}
    >
        <Modal
            header={`Liquidation Form`}
            onClose={onClose}
            isOpen={isOpen}
        >
            {
                !!position &&
                <VStack w='full' p="4">
                    {
                        position?.liquidatableDebt !== position?.debt &&
                        <HStack w='full' justify="space-between">
                            <Text>Debt:</Text>
                            <Text fontWeight="bold">{shortenNumber(position?.debt, 2)}</Text>
                        </HStack>
                    }
                    <HStack w='full' justify="space-between">
                        <Text>Liquidable Debt:</Text>
                        <Text fontWeight="bold">{shortenNumber(position?.liquidatableDebt, 2)}</Text>
                    </HStack>
                    <HStack w='full' justify="space-between">
                        <Text>Liquidation Incentive:</Text>
                        <Text fontWeight="bold">{position?.market.liquidationIncentive * 100}%</Text>
                    </HStack>
                    <HStack w='full' justify="space-between">
                        <Text>Max Seizable:</Text>
                        <Text fontWeight="bold">
                            {shortenNumber(position?.seizable, 4, false, true)} {position?.market.underlying.symbol} ({shortenNumber(position?.seizableWorth, 2, true)})
                        </Text>
                    </HStack>

                    {
                        position.isLiquidatable &&
                        <VStack pt="4" w='full' alignItems="flex-start">
                            <Text>Amount to repay:</Text>
                            <SimpleAmountForm
                                defaultAmount={repayAmount}
                                address={DOLA}
                                destination={position?.market.address}
                                signer={library?.getSigner()}
                                decimals={18}
                                hideInputIfNoAllowance={false}
                                maxAmountFrom={[position?.liquidatableDebtBn]}
                                includeBalanceInMax={true}
                                onAction={({ bnAmount }) => handleLiquidation(bnAmount)}
                                onAmountChange={(v) => setRepayAmount(v)}
                                showMaxBtn={false}
                            />
                            <InfoMessage
                                alertProps={{ w: 'full' }}
                                description={
                                    seizeAmount > 0 ? `You will seize: ${shortenNumber(seizeAmount, 4)} (${shortenNumber(seizeWorth, 2, true)})` : 'Repay a DOLA amount to seize collateral'
                                }
                            />
                        </VStack>
                    }
                </VStack>
            }
        </Modal>
        <Table
            keyName="key"
            noDataMessage="Loading..."
            columns={columns}
            items={positions}
            onClick={(v) => openLiquidation(v)}
            defaultSort="perc"
            defaultSortDir="asc"
        />
    </Container>
}