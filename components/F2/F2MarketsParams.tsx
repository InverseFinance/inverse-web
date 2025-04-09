import { Stack, useMediaQuery, Flex, Text, useDisclosure, VStack, RadioGroup, Radio } from "@chakra-ui/react"
import { smartShortNumber } from "@app/util/markets";
import Container from "@app/components/common/Container";
import Table from "@app/components/common/Table";
import { F2Market } from "@app/types";
import { commify } from "@ethersproject/units";
import ScannerLink from "../common/ScannerLink";
import { useWeb3React } from "@web3-react/core";
import { useEffect, useMemo, useState } from "react";
import { ADMIN_ADS } from "@app/variables/names";
import ConfirmModal from "../common/Modal/ConfirmModal";
import { InfoMessage } from "../common/Messages";
import { Textarea } from "../common/Input";
import { getSignMessageWithUtcDate } from "@app/util/misc";
import { showToast } from "@app/util/notify";

const ColHeader = ({ ...props }) => {
    return <Flex justify="flex-start" minWidth={'130px'} fontSize="14px" fontWeight="extrabold" {...props} />
}

const Cell = ({ ...props }) => {
    return <Stack direction="row" fontSize="14px" fontWeight="normal" justify="flex-start" minWidth="130px" {...props} />
}

const CellText = ({ ...props }) => {
    return <Text fontSize="14px" {...props} />
}

const MarketCell = ({ name, address }: { name: string, address: string }) => {
    return <Cell fontSize={'12px'} alignItems="flex-start" direction="column" minWidth="130px" position="relative">
        <CellText maxW="130px" textOverflow="ellipsis" overflow="hidden" whiteSpace="nowrap" fontWeight="bold" fontSize={{ base: '12px' }}>
            {name}
        </CellText>
        <ScannerLink value={address} type="address" useName={false} />
    </Cell>
}

const CollateralCell = ({ name, address }: { name: string, address: string }) => {
    return <Cell fontSize={'12px'} alignItems="flex-start" direction="column" minWidth="70px" position="relative">
        <CellText maxW="70px" textOverflow="ellipsis" overflow="hidden" whiteSpace="nowrap" fontWeight="bold">
            {name}
        </CellText>
        <ScannerLink superShorten={true} fontSize={'12px'} value={address} type="address" useName={false} />
    </Cell>
}

const CollateralFactorCell = ({ collateralFactor, borrowPaused, _isMobileCase }: { collateralFactor: number, borrowPaused: boolean, _isMobileCase: boolean }) => {
    return <Cell spacing="0" direction="column" minWidth="70px" alignItems={_isMobileCase ? 'flex-end' : 'center'} justify="center" >
        <CellText>{smartShortNumber(collateralFactor * 100, 0)}%</CellText>
    </Cell>
}

const columns = [
    {
        field: 'marketIndex',
        label: '#',
        header: ({ ...props }) => <ColHeader minWidth="25px" justify="flex-start"  {...props} />,
        value: ({ marketIndex }) => {
            return <Cell minWidth="25px" justify="flex-start" >
                <CellText fontSize={'12px'} color="mainTextColorLight">{marketIndex + 1}</CellText>
            </Cell>
        },
    },
    {
        field: 'price',
        label: 'O.Price',
        header: ({ ...props }) => <ColHeader minWidth="80px" justify="center"  {...props} />,
        value: ({ price }) => {
            return <Cell minWidth="80px" justify="center" >
                <CellText fontSize={'12px'} color={price < 0.1 ? 'error' : ''}>${commify((price || 0)?.toFixed(2))}</CellText>
            </Cell>
        },
    },
    {
        field: 'name',
        label: 'Market',
        header: ({ ...props }) => <ColHeader minWidth="130px" justify="flex-start"  {...props} />,
        showFilter: true,
        filterWidth: '120px',
        value: ({ name, address }) => {
            return <MarketCell name={name} address={address} />
        },
    },
    {
        field: 'collateralSymbol',
        label: 'Collateral',
        header: ({ ...props }) => <ColHeader minWidth="70px" justify="flex-start"  {...props} />,
        showFilter: true,
        filterWidth: '70px',
        value: ({ collateralSymbol, collateral }) => {
            return <CollateralCell name={collateralSymbol} address={collateral} />
        },
    },
    {
        field: 'borrowController',
        label: 'Controller',
        header: ({ ...props }) => <ColHeader minWidth="70px" justify="center"  {...props} />,
        showFilter: true,
        filterWidth: '70px',
        value: ({ borrowController }) => {
            return <Cell minWidth="70px" justify="center" >
                <CellText fontSize="12px"><ScannerLink superShorten={true} value={borrowController} type="address" useName={false} /></CellText>
            </Cell>
        },
    },
    {
        field: 'oracle',
        label: 'Oracle',
        header: ({ ...props }) => <ColHeader minWidth="70px" justify="center"  {...props} />,
        showFilter: true,
        filterWidth: '70px',
        value: ({ oracle }) => {
            return <Cell minWidth="70px" justify="center" >
                <CellText fontSize="12px"><ScannerLink superShorten={true} value={oracle} type="address" useName={false} /></CellText>
            </Cell>
        },
    },
    {
        field: 'oracleFeed',
        label: 'Feed',
        header: ({ ...props }) => <ColHeader minWidth="70px" justify="center"  {...props} />,
        showFilter: true,
        filterWidth: '70px',
        value: ({ oracleFeed }) => {
            return <Cell minWidth="70px" justify="center" >
                <CellText fontSize="12px"><ScannerLink superShorten={true} value={oracleFeed} type="address" useName={false} /></CellText>
            </Cell>
        },
    },
    {
        field: 'collateralFactor',
        label: 'C.F',
        showFilter: true,
        filterWidth: '70px',
        header: ({ ...props }) => <ColHeader minWidth="70px" justify="center"  {...props} />,
        // filterItemRenderer: ({collateralFactor}) => filterItemPercRenderer(collateralFactor),
        value: ({ collateralFactor, borrowPaused, _isMobileCase }) => {
            return <CollateralFactorCell _isMobileCase={_isMobileCase} collateralFactor={collateralFactor} borrowPaused={borrowPaused} />
        },
    },
    {
        field: 'borrowPaused',
        label: 'Paused',
        header: ({ ...props }) => <ColHeader minWidth="50px" justify="center"  {...props} />,
        showFilter: true,
        filterWidth: '50px',
        value: ({ borrowPaused }) => {
            return <Cell minWidth="50px" justify="center" >
                <CellText color={borrowPaused ? 'warning' : ''}>{borrowPaused ? 'Yes' : 'No'}</CellText>
            </Cell>
        },
    },
    {
        field: 'isPhasingOut',
        label: 'Hidden',
        showFilter: true,
        filterWidth: '50px',
        header: ({ ...props }) => <ColHeader minWidth="50px" justify="center"  {...props} />,
        value: ({ isPhasingOut }) => {
            return <Cell minWidth="50px" justify="center" >
                <CellText>{isPhasingOut ? 'Yes' : 'No'}</CellText>
            </Cell>
        },
    },
    {
        field: 'dailyLimit',
        label: 'Daily.L',
        showFilter: true,
        filterWidth: '70px',
        header: ({ ...props }) => <ColHeader minWidth="70px" justify="center"  {...props} />,
        value: ({ dailyLimit }) => {
            return <Cell minWidth="70px" justify="center">
                <CellText color={dailyLimit > 2_000_000 ? 'warning' : dailyLimit > 3_000_000 ? 'error' : ''}>{smartShortNumber(dailyLimit, 0)}</CellText>
            </Cell>
        },
    },
    {
        field: 'minDebt',
        label: 'minDebt',
        showFilter: true,
        filterWidth: '70px',
        header: ({ ...props }) => <ColHeader minWidth="70px" justify="center"  {...props} />,
        value: ({ minDebt }) => {
            return <Cell minWidth="70px" justify="center">
                <CellText color={minDebt < 1000 ? 'warning' : minDebt < 500 ? 'error' : ''}>{smartShortNumber(minDebt, 2)}</CellText>
            </Cell>
        },
    },
    {
        field: 'ceiling',
        label: 'Ceiling',
        showFilter: true,
        filterWidth: '70px',
        header: ({ ...props }) => <ColHeader minWidth="70px" justify="center"  {...props} />,
        value: ({ ceiling }) => {
            return <Cell minWidth="70px" justify="center" >
                <CellText>{smartShortNumber(ceiling, 2)}</CellText>
            </Cell>
        },
    },
    {
        field: 'liquidationFactor',
        label: 'L.Factor',
        showFilter: true,
        filterWidth: '70px',
        header: ({ ...props }) => <ColHeader minWidth="70px" justify="center"  {...props} />,
        value: ({ liquidationFactor }) => {
            return <Cell minWidth="70px" justify="center" >
                <CellText color={liquidationFactor < 0.5 ? 'warning' : ''}>{smartShortNumber(liquidationFactor * 100, 0)}%</CellText>
            </Cell>
        },
    },
    {
        field: 'liquidationFee',
        label: 'L.Fee',
        showFilter: true,
        filterWidth: '70px',
        header: ({ ...props }) => <ColHeader minWidth="70px" justify="center"  {...props} />,
        value: ({ liquidationFee }) => {
            return <Cell minWidth="70px" justify="center" >
                <CellText>{smartShortNumber(liquidationFee * 100, 0)}%</CellText>
            </Cell>
        },
    },
    {
        field: 'liquidationIncentive',
        label: 'L.Incentive',
        showFilter: true,
        filterWidth: '70px',
        header: ({ ...props }) => <ColHeader minWidth="70px" justify="center"  {...props} />,
        value: ({ liquidationIncentive }) => {
            return <Cell minWidth="70px" justify="center" >
                <CellText color={liquidationIncentive < 0.05 ? 'error' : ''}>{smartShortNumber(liquidationIncentive * 100, 0)}%</CellText>
            </Cell>
        },
    },
    {
        field: 'replenishmentIncentive',
        label: 'R.Incentive',
        showFilter: true,
        filterWidth: '70px',
        header: ({ ...props }) => <ColHeader minWidth="70px" justify="center"  {...props} />,
        value: ({ replenishmentIncentive }) => {
            return <Cell minWidth="70px" justify="center" >
                <CellText>{smartShortNumber(replenishmentIncentive * 100, 0)}%</CellText>
            </Cell>
        },
    },
]

const responsiveThreshold = 1260;

export const F2MarketsParams = ({
    markets,
    isSimContext = false
}: {
    markets: F2Market[]
    isSimContext?: boolean
}) => {
    const { account, provider } = useWeb3React();
    const { isOpen, onOpen, onClose } = useDisclosure();
    const isWhitelisted = useMemo(() => ADMIN_ADS.map(a => a.toLowerCase()).includes((account || '')?.toLowerCase()), [account]);
    const [isSmallerThan] = useMediaQuery(`(max-width: ${responsiveThreshold}px)`);
    const [selectedMarket, setSelectedMarket] = useState<F2Market | null>(null);
    const [isPhasingOut, setIsPhasingOut] = useState('no');
    const [noDeposit, setNoDeposit] = useState('no');
    const [phasingOutComment, setPhasingOutComment] = useState('');
    const [optimisticUpdates, setOptimisticUpdates] = useState({});

    useEffect(() => {
        if (selectedMarket) {
            setIsPhasingOut(selectedMarket.isPhasingOut ? 'yes' : 'no');
            setNoDeposit(selectedMarket.noDeposit ? 'yes' : 'no');
            setPhasingOutComment(selectedMarket.phasingOutComment || '');
        }
    }, [selectedMarket]);

    const handleOk = async () => {
        const m = { ...selectedMarket };
        if (isSimContext) {
            showToast({
                title: 'Sim mode',
                description: 'Market visibility cannot be updated in sim mode',
                status: 'warning',
            });
            return;
        }
        const signer = provider?.getSigner()!;
        const sig = await signer.signMessage(getSignMessageWithUtcDate()).catch(() => '');
        if (!sig) {
            showToast({
                title: 'Error signing message',
                description: 'Please try again',
                status: 'error',
            });
            return;
        }
        const res = await fetch(`/api/f2/markets-display`, {
            method: 'PUT',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                sig,
                marketAddress: m?.address,
                isPhasingOut: isPhasingOut,
                noDeposit: noDeposit,
                phasingOutComment: phasingOutComment,
            }),
        });
        const resData = await res.json();
        if (resData.status === 'success') {
            onClose();
            showToast({
                title: 'Market visibility updated',
                description: 'The change might take up to ~2 minutes to be reflected',
                status: 'success',
            });
            setOptimisticUpdates({
                ...optimisticUpdates,
                [m?.address]: {
                    noDeposit: noDeposit === 'yes',
                    isPhasingOut: isPhasingOut === 'yes',
                    phasingOutComment,
                },
            });
        } else {
            showToast({
                title: 'Error updating market visibility',
                description: resData.message,
                status: 'error',
            });
        }
    }

    const _markets = useMemo(() => {
        return markets.map(m => ({
            ...m,
            ...optimisticUpdates[m.address],
        }));
    }, [markets, optimisticUpdates]);

    return <Container
        p={'0'}
        noPadding
        labelProps={{ fontSize: { base: '14px', sm: '18px' }, fontWeight: 'extrabold' }}
        contentBgColor={isSmallerThan ? 'transparent' : undefined}
    >
        <ConfirmModal
            title={selectedMarket?.name}
            isOpen={isOpen}
            onClose={onClose}
            onCancel={onClose}
            onOk={handleOk}
            okLabel="Edit"
            cancelLabel="Dismiss"
        >
            <VStack w='full' p="4">
                <InfoMessage
                    alertProps={{
                        w: 'full',
                        title: 'Here you can edit market visibility',
                    }}
                />
                <VStack alignItems="flex-start" w='full' spacing="2">
                    <Text fontWeight="bold">Hide this market to non-users?</Text>
                    <RadioGroup w='full' bgColor="mainBackground" p="2" onChange={setIsPhasingOut} value={isPhasingOut}>
                        <Stack direction='row' w='full' spacing="4">
                            <Radio value='yes'>Yes</Radio>
                            <Radio value='no'>No</Radio>
                        </Stack>
                    </RadioGroup>
                </VStack>
                {
                    isPhasingOut === 'yes' && <VStack alignItems="flex-start" w='full' spacing="2">
                        <Text fontWeight="bold">Message to display for existing users</Text>
                        <Textarea fontSize="14px" p="2" value={phasingOutComment} onChange={(e) => setPhasingOutComment(e.target.value)} />
                    </VStack>
                }
                <VStack alignItems="flex-start" w='full' spacing="2">
                    <Text fontWeight="bold">Disable deposits in UI?</Text>
                    <RadioGroup w='full' bgColor="mainBackground" p="2" onChange={setNoDeposit} value={noDeposit}>
                        <Stack direction='row' w='full' spacing="4">
                            <Radio value='yes'>Yes</Radio>
                            <Radio value='no'>No</Radio>
                        </Stack>
                    </RadioGroup>
                </VStack>
            </VStack>
        </ConfirmModal>
        <Table
            keyName="address"
            columns={columns}
            onClick={isWhitelisted ? (market) => { setSelectedMarket(market); onOpen(); } : undefined}
            items={
                _markets
                    .map((m, i) => ({
                        ...m,
                        isPhasingOut: !!m.isPhasingOut,
                        marketIndex: i,
                    }))
            }
            enableMobileRender={true}
            defaultSortField="marketIndex"
            defaultSortDir="desc"
            mobileThreshold={responsiveThreshold}
            showRowBorder={true}
            spacing="0"
        />
    </Container >
}