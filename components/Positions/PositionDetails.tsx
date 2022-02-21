import { useState } from 'react';
import { ScaleFade, Stack, Text, useDisclosure } from '@chakra-ui/react';
import { SubmitButton } from '@app/components/common/Button';
import { useBalances } from '@app/hooks/useBalances';
import { Funds } from '../Transparency/Funds';
import { AccountPositionDetailed } from '@app/types';
import { shortenNumber } from '@app/util/markets';
import { ArrowLeftIcon, ArrowRightIcon } from '@chakra-ui/icons';
import { useWeb3React } from '@web3-react/core';
import { Web3Provider } from '@ethersproject/providers';
import ScannerLink from '../common/ScannerLink';
import { AssetInput } from '../common/Assets/AssetInput';
import { useAllowances } from '@app/hooks/useApprovals';
import { hasAllowance } from '@app/util/web3';
import { ApproveButton } from '../Anchor/AnchorButton';
import { LiquidationForm } from './LiquidationForm';

type Props = {
    position: AccountPositionDetailed
}

const FundsDetails = ({ funds, title }: { funds: any, title: string }) => {
    return <Stack p={'5'} direction="column" minW="350px" >
        <Stack>
            <Text fontWeight="bold">{title}:</Text>
            <Funds funds={funds} chartMode={true} showTotal={true} />
        </Stack>
        <Stack>
            <Funds funds={funds} showTotal={false} />
        </Stack>
    </Stack>
}

const toFunds = (data: AccountPositionDetailed["supplied"]) => {
    return data.map(d => ({
        ...d,
        token: { ...d.underlying },
    }))
}

export const PositionDetails = ({
    position,
}: Props) => {
    const { account, library } = useWeb3React<Web3Provider>()
    const { isOpen, onOpen, onClose } = useDisclosure();
    const hasLiquidationOpportunity = position.usdShortfall < position.usdSupplied;
    const maxSeize = Math.min(position.usdSupplied, position.usdShortfall);

    return (
        <Stack w='full' position="relative" maxH="100vh" overflowY="auto" overflowX="hidden">
            <Text position="absolute" right="10px" fontWeight="bold">
                Account: <ScannerLink value={position.account} />,
            </Text>
            {
                !isOpen && <ScaleFade in={!isOpen} unmountOnExit={true}>
                    <Stack spacing="5" direction="row" w="full" justify="space-around">
                        <FundsDetails funds={toFunds(position.supplied)} title="Supplied as Collaterals" />
                        <FundsDetails funds={toFunds(position.borrowingPower)} title="Borrowing Power" />
                        <FundsDetails funds={toFunds(position.borrowed)} title="Borrowed Assets" />
                    </Stack>
                </ScaleFade>
            }
            <Stack pt="5" spacing="5" direction="row" w="full">
                <Text fontWeight="bold" color={position.borrowLimitPercent >= 100 ? 'error' : 'white'}>
                    Borrow Limit: {shortenNumber(position.borrowLimitPercent, 2)}%
                </Text>
                <Text fontWeight="bold" color={position.usdShortfall > 0 ? 'error' : 'secondary'}>
                    Solvency: {shortenNumber(position.usdBorrowable, 2, true)} - {shortenNumber(position.usdBorrowed, 2, true)} = {shortenNumber(position.usdBorrowable - position.usdBorrowed, 2, true)}
                </Text>
                <Text fontWeight="bold" color={position.usdShortfall > 0 ? 'secondary' : 'white'}>
                    Max Seizable: {shortenNumber(maxSeize, 2, true)}
                </Text>
                <Text fontWeight="bold" color={hasLiquidationOpportunity ? 'secondary' : 'white'}>
                    Liquidation Opportunity: {hasLiquidationOpportunity ? 'Yes' : 'No'}
                </Text>
                {
                    !!account && account.toLowerCase() !== position.account.toLowerCase() && position.usdShortfall > 0 &&
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
                    <LiquidationForm position={position} />
                </ScaleFade>
            }
        </Stack>
    )
}