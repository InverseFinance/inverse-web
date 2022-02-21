import { useAllowances } from '@app/hooks/useApprovals'
import { useBalances } from '@app/hooks/useBalances'
import { hasAllowance } from '@app/util/web3'
import { Stack, Text } from '@chakra-ui/react'
import { useEffect, useState } from 'react'
import { ApproveButton } from '@app/components/Anchor/AnchorButton'
import { AssetInput } from '@app/components/common/Assets/AssetInput'
import { SubmitButton } from '@app/components/common/Button'
import { AccountPositionDetailed, Token, TokenList } from '@app/types'
import { useWeb3React } from '@web3-react/core';
import { Web3Provider } from '@ethersproject/providers';
import { getParsedBalance, shortenNumber } from '@app/util/markets';

export const LiquidationForm = ({
    position
}: {
    position: AccountPositionDetailed,
}) => {
    const { library } = useWeb3React<Web3Provider>()

    const borrowedList: TokenList = {};
    const anMarkets: TokenList = {};

    position.borrowed.forEach(b => borrowedList[b.underlying.address || 'CHAIN_COIN'] = b.underlying);
    position.borrowed.forEach(b => anMarkets[b.underlying.symbol] = b.market);
    const borrowedUnderlyings: Token[] = position.borrowed.map(b => b.underlying);
    const borrowedUnderlyingsAd = position.borrowed.map(b => b.underlying.address);

    const seizeList = {};
    position.supplied.forEach(b => seizeList[b.underlying.address || 'CHAIN_COIN'] = b.underlying);
    const collateralUnderlyings = position.supplied.map(b => b.underlying);
    const collateralUnderlyingsAd = position.supplied.map(b => b.underlying.address);

    const [repayToken, setRepayToken] = useState<Token>(borrowedUnderlyings[0]);
    const [seizeAmount, setSeizeAmount] = useState('0');
    const [maxSeizeAmount, setMaxSeizeAmount] = useState(0);
    const [maxRepayAmount, setMaxRepayAmount] = useState(0);
    const [liquidatorRepayTokenBal, setLiquidatorRepayTokenBal] = useState(0);
    const [borrowedDetails, setBorrowedDetails] = useState(position.borrowed[0]);

    const { approvals } = useAllowances(borrowedUnderlyingsAd, anMarkets[repayToken.symbol]);
    const [isApproved, setIsApproved] = useState(repayToken.address ? hasAllowance(approvals, repayToken.address) : true);
    const { balances } = useBalances(borrowedUnderlyingsAd);

    const [seizeToken, setSeizeToken] = useState(collateralUnderlyings[0]);
    const [repayAmount, setRepayAmount] = useState('0');

    useEffect(() => {
        const liquidatorBal = getParsedBalance(balances, repayToken.address, repayToken.decimals);
        setLiquidatorRepayTokenBal(liquidatorBal);
        const borrowed = position.borrowed.find(b => b.underlying.address === repayToken.address);
        setBorrowedDetails(borrowed!);
        setMaxRepayAmount(Math.min(liquidatorBal, borrowed?.balance!));
    }, [repayToken])

    const handleLiquidation = () => {

    }

    const inputProps = { fontSize: '14px' }
    const borrowAssetInputProps = { tokens: borrowedList, balances, showBalance: false }
    const collateralAssetInputProps = { tokens: seizeList, balances, showBalance: false }

    return <Stack spacing="5" pt="2" direction="column" w="full" justify="center" alignItems="center">
        <Stack>
            <Stack>
                <Text fontWeight="bold">Borrowed Asset to Repay:</Text>
                <AssetInput
                    amount={repayAmount}
                    token={repayToken}
                    assetOptions={borrowedUnderlyingsAd}
                    onAssetChange={(newToken) => setRepayToken(newToken)}
                    onAmountChange={(newAmount) => setRepayAmount(newAmount)}
                    maxValue={maxRepayAmount}
                    inputProps={inputProps}
                    {...borrowAssetInputProps}
                />
                <Text fontSize="12px">
                    Your balance: {shortenNumber(liquidatorRepayTokenBal, 4)}, the borrowed amount: {shortenNumber(borrowedDetails.balance, 2)}
                </Text>
            </Stack>
            <Stack>
                <Text fontWeight="bold">Collateral to Seize:</Text>
                <AssetInput
                    amount={seizeAmount}
                    token={seizeToken}
                    assetOptions={collateralUnderlyingsAd}
                    onAssetChange={(newToken) => setSeizeToken(newToken)}
                    onAmountChange={(newAmount) => setSeizeAmount(newAmount)}
                    inputProps={{ disabled: true }}
                    showMax={false}
                    {...collateralAssetInputProps}
                />
            </Stack>
        </Stack>
        <Stack direction="row">
            <ApproveButton signer={library?.getSigner()} asset={{ ...repayToken, token: repayToken.market }} isDisabled={isApproved} />
            <SubmitButton disabled={!isApproved}>
                Liquidate
            </SubmitButton>
        </Stack>
    </Stack>
}