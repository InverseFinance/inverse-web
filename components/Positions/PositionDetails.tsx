import { useEffect, useState } from 'react';
import { ScaleFade, Stack, Text, useDisclosure } from '@chakra-ui/react';
import { useBorrowedAssets, useSuppliedCollaterals } from '@app/hooks/useBalances';
import { Funds } from '@app/components/Transparency/Funds';
import { AccountPositionDetailed, AccountPositionAssets } from '@app/types';
import { shortenNumber } from '@app/util/markets';
import { ArrowLeftIcon, ArrowRightIcon } from '@chakra-ui/icons';
import { useWeb3React } from '@app/util/wallet';
import { Web3Provider } from '@ethersproject/providers';

import { LiquidationForm } from './LiquidationForm';
import { useAccountLiquidity } from '@app/hooks/useAccountLiquidity';

type Props = {
    position: AccountPositionDetailed,
    needFresh?: boolean,
}

const FundsDetails = ({ funds, title }: { funds: any, title: string }) => {
    return <Stack p={'1'} direction="column" minW={{ base: 'full', sm: '350px' }} >
        <Stack>
            <Text fontWeight="bold">{title}:</Text>
            {
                funds?.length && <Funds funds={funds} chartMode={true} showTotal={true} />
            }
        </Stack>
        <Stack>
            <Funds funds={funds} showPrice={false} showTotal={false} />
        </Stack>
    </Stack>
}

const toFunds = (data: AccountPositionDetailed["supplied"]) => {
    return data.map(d => ({
        ...d,
        token: { ...d.underlying },
    }))
}

const toFresh = (fromApi: AccountPositionAssets[], fromFresh: AccountPositionAssets[], applyCollateralFactor = false) => {
    return fromApi.map(m => {
        const freshSupplied = fromFresh.find(s => s.ctoken === m.ctoken) || m;
        const priceFactor = (applyCollateralFactor ? freshSupplied.collateralFactor : 1);
        return {
            ...m,
            usdPrice: freshSupplied.usdPrice * priceFactor,
            balance: freshSupplied.balance,
            usdWorth: freshSupplied.balance * priceFactor,
        }
    });
}

export const PositionDetails = ({
    position,
    needFresh = true,
}: Props) => {
    const { account } = useWeb3React<Web3Provider>()
    const { isOpen, onOpen, onClose } = useDisclosure();
    const supplied = useSuppliedCollaterals(position.account);
    const borrowed = useBorrowedAssets(position.account);

    const { usdBorrowable, usdBorrow, usdShortfall, usdSupply } = useAccountLiquidity(position.account);

    const [freshPosition, setFreshPosition] = useState(position);

    useEffect(() => {
        if (position.account !== freshPosition.account) {
            onClose();
            setFreshPosition(position);
        }
    }, [position.account, freshPosition.account])

    useEffect(() => {
        if (!needFresh || !supplied?.length || !borrowed?.length) { return }
        const fresh = {
            ...position,
            usdSupplied: usdSupply ?? position.supplied,
            usdBorrowed: usdBorrow ?? position.usdBorrowed,
            usdBorrwable: usdBorrowable ?? position.usdBorrowable,
            usdShortfall: usdShortfall ?? position.usdShortfall,
        };

        fresh.supplied = toFresh(fresh.supplied, supplied);
        fresh.borrowingPower = toFresh(fresh.supplied, supplied, true);
        fresh.borrowed = toFresh(position.borrowed, borrowed);

        const borrowTotal = fresh.usdBorrowable + fresh.usdBorrowed;
        fresh.borrowLimitPercent = borrowTotal ? Math.floor((fresh.usdBorrowed / (borrowTotal)) * 100) : 0;

        if (JSON.stringify(fresh) === JSON.stringify(freshPosition)) { return }
        setFreshPosition(fresh);
    }, [position, needFresh, supplied, borrowed, usdBorrowable, usdSupply, usdBorrow, usdShortfall]);

    const maxSeize = Math.min(freshPosition.usdSupplied, freshPosition.usdShortfall);
    const totalBorrowCapacity = freshPosition.supplied.reduce((prev, b) => prev + b.balance * b.usdPrice * b.collateralFactor, 0);

    return (
        <Stack w='full' position="relative" maxH={{ base: '95vh', sm: '90vh' }} overflowY="auto" overflowX="hidden">
            {
                !isOpen && <ScaleFade in={!isOpen} unmountOnExit={true}>
                    <Stack spacing="5" direction={{ base: 'column', lg: 'row' }} w="full" justify="space-around">
                        <FundsDetails funds={toFunds(freshPosition.supplied)} title="Supplied as Collaterals" />
                        <FundsDetails funds={toFunds(freshPosition.borrowingPower)} title="Borrowing Power From Collaterals" />
                        <FundsDetails funds={toFunds(freshPosition.borrowed)} title="Borrowed Assets" />
                    </Stack>
                </ScaleFade>
            }
            <Text fontSize="12px" pt={ isOpen ? 2 : 0 }>
                Calculations here use <b>Oracle Prices</b>, these can differ from Coingecko's, displayed balances are the "stored" balances snapshoted at last interest accrual (= not real time)
            </Text>
            <Stack spacing="5" direction="row" w="full">
                <Text fontWeight="bold" color={freshPosition.borrowLimitPercent >= 100 ? 'error' : 'mainTextColor'}>
                    Borrow Limit: {shortenNumber(freshPosition.borrowLimitPercent, 2)}%
                </Text>
                <Text fontWeight="bold" color={freshPosition.usdShortfall > 0 ? 'error' : 'secondary'}>
                    {freshPosition.usdShortfall > 0 ? 'Shortfall' : 'Borrowing Power left'}: {shortenNumber(totalBorrowCapacity - freshPosition.usdBorrowed, 2, true)} (= {shortenNumber(totalBorrowCapacity, 2, true)} - {shortenNumber(freshPosition.usdBorrowed, 2, true)})
                </Text>
                {
                    freshPosition.usdShortfall > 0 && <Text fontWeight="bold" color={freshPosition.usdShortfall > 0 ? 'secondary' : 'mainTextColor'}>
                        Max Seizable: {shortenNumber(maxSeize, 2, true)}
                    </Text>
                }
                {/* <Text fontWeight="bold" color={hasLiquidationOpportunity ? 'secondary' : 'mainTextColor'}>
                    Liquidation Opportunity: {hasLiquidationOpportunity ? 'Yes' : 'No'}
                </Text> */}
                {
                    !!account && account.toLowerCase() !== freshPosition?.account?.toLowerCase() && freshPosition.usdShortfall > 0 &&
                    <>
                        {
                            !isOpen ?
                                <Text fontWeight="bold" _hover={{ color: 'secondary' }} position="absolute" right="10px" cursor="pointer" onClick={onOpen}>
                                    Liquidate
                                    <ArrowRightIcon ml="2" fontSize="12px" />
                                </Text>
                                :
                                <Text fontWeight="bold" _hover={{ color: 'secondary' }} position="absolute" right="10px" cursor="pointer" onClick={onClose}>
                                    <ArrowLeftIcon mr="2" fontSize="12px" />Hide Liquidation Form
                                </Text>
                        }
                    </>
                }
            </Stack>
            {
                isOpen &&
                <ScaleFade in={isOpen} unmountOnExit={true}>
                    <LiquidationForm position={freshPosition} />
                </ScaleFade>
            }
        </Stack>
    )
}