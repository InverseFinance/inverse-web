import { useState } from 'react';
import { Stack, Text, useDisclosure } from '@chakra-ui/react';
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

type Props = {
    position: AccountPositionDetailed,
    isOpen: boolean
    onClose: () => void
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
    const { account } = useWeb3React<Web3Provider>()
    const borrowedList = {}
    position.borrowed.forEach(b => borrowedList[b.underlying.address||'CHAIN_COIN'] = b.underlying);
    const borrowedUnderlyings = position.borrowed.map(b => b.underlying);
    const borrowedUnderlyingsAd = position.borrowed.map(b => b.underlying.address);
    const [repayAmount, setRepayAmount] = useState('0');
    const [repayToken, setRepayToken] = useState(borrowedUnderlyings[0]);

    const { balances } = useBalances(borrowedUnderlyingsAd);
    console.log(balances);
    console.log(borrowedUnderlyings);
    console.log(borrowedList);
    
    const { isOpen, onOpen, onClose } = useDisclosure();
    const hasLiquidationOpportunity = position.usdShortfall < position.usdSupplied;

    const handleLiquidation = () => {

    }

    const maxSeize = Math.min(position.usdSupplied, position.usdShortfall);

    const commonAssetInputProps = { tokens: borrowedList, balances, showBalance: true }

    return (
        <Stack w='full' maxH="80vh" overflowY="auto">
            <Text position="absolute" right="10px" fontWeight="bold">
                Account: <ScannerLink value={position.account} />
            </Text>
            <Stack spacing="5" direction="row" w="full" justify="space-around">
                <FundsDetails funds={toFunds(position.supplied)} title="Supplied as Collaterals" />
                <FundsDetails funds={toFunds(position.borrowingPower)} title="Borrowing Power" />
                <FundsDetails funds={toFunds(position.borrowed)} title="Borrowed Assets" />
            </Stack>
            <Stack spacing="5" direction="row" w="full">
                <Text fontWeight="bold" color={position.usdShortfall > 0 ? 'error' : 'secondary'}>
                    Shortfall: {shortenNumber(position.usdBorrowable, 2, true)} - {shortenNumber(position.usdBorrowed, 2, true)} = {shortenNumber(position.usdBorrowable - position.usdBorrowed, 2, true)}
                </Text>
                <Text fontWeight="bold" color={position.usdShortfall > 0 ? 'secondary' : 'white'}>
                    Max Seizable: {shortenNumber(maxSeize, 2, true)}
                </Text>
                <Text fontWeight="bold" color={hasLiquidationOpportunity ? 'secondary' : 'white'}>
                    Liquidation Opportunity: {hasLiquidationOpportunity ? 'Yes' : 'No'}
                </Text>
                {
                    !!account && account.toLowerCase() !== position.account.toLowerCase() &&
                    <>
                        {
                            !isOpen ?
                                <Text fontWeight="bold" _hover={{ color: 'secondary' }} position="absolute" right="10px" cursor="pointer" onClick={onOpen}>
                                    Liquidate
                                    <ArrowRightIcon ml="2" fontSize="12px" />
                                </Text>
                                :
                                <Text fontWeight="bold" _hover={{ color: 'secondary' }} position="absolute" right="10px" cursor="pointer" onClick={onClose}>
                                    <ArrowLeftIcon mr="2" fontSize="12px" />Back
                                </Text>
                        }
                    </>
                }
            </Stack>
            {
                isOpen &&
                <Stack spacing="5" direction="row" w="full">
                    <Stack>
                        <AssetInput
                            amount={repayAmount}
                            token={repayToken}
                            assetOptions={borrowedUnderlyingsAd}
                            onAssetChange={(newToken) => setRepayToken(newToken)}
                            onAmountChange={(newAmount) => setRepayAmount(newAmount)}
                            {...commonAssetInputProps}
                        />
                    </Stack>
                    <SubmitButton>Liquidate</SubmitButton>
                </Stack>
            }
        </Stack>
    )
}