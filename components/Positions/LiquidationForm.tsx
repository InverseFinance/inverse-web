import { useAllowances } from '@app/hooks/useApprovals'
import { useBalances } from '@app/hooks/useBalances'
import { hasAllowance } from '@app/util/web3'
import { Stack, Text } from '@chakra-ui/react'
import { useEffect, useState } from 'react'
import { ApproveButton } from '@app/components/Anchor/AnchorButton'
import { AssetInput } from '@app/components/common/Assets/AssetInput'
import { SubmitButton } from '@app/components/common/Button'
import { AccountPositionDetailed, Token, TokenList } from '@app/types'
import { useWeb3React } from '@app/util/wallet';
import { Web3Provider } from '@ethersproject/providers';
import { getParsedBalance, shortenNumber, getBnToNumber } from '@app/util/markets';
import { useAnchorPricesUsd } from '@app/hooks/usePrices'
import { liquidateBorrow } from '@app/util/contracts'
import { useLiquidationIncentive } from '@app/hooks/usePositions'
import { removeScientificFormat, roundFloorString } from '@app/util/misc';
import useEtherSWR from '@app/hooks/useEtherSWR'
import { parseUnits } from '@ethersproject/units'
import { InfoMessage } from '../common/Messages'

const formattedInfo = (bal: number | string, priceUsd: number) => {
    return <b>{shortenNumber(parseFloat(bal), 4, false, true)} ({shortenNumber(parseFloat(bal) * priceUsd, 2, true, true)})</b>
}

export const LiquidationForm = ({
    position
}: {
    position: AccountPositionDetailed,
}) => {
    const { provider } = useWeb3React<Web3Provider>()
    const { prices: oraclePrices } = useAnchorPricesUsd();
    const { bonusFactor } = useLiquidationIncentive();

    const borrowedList: TokenList = {};
    const anMarkets: TokenList = {};

    position.borrowed.forEach(b => borrowedList[b.underlying.address || 'CHAIN_COIN'] = b.underlying);
    position.borrowed.forEach(b => anMarkets[b.underlying.symbol] = b.ctoken);
    const borrowedUnderlyings: Token[] = position.borrowed.map(b => b.underlying);
    const borrowedUnderlyingsAd = position.borrowed.map(b => b.underlying.address);

    const seizeList = {};
    position.supplied.forEach(b => seizeList[b.ctoken || 'CHAIN_COIN'] = b.underlying);
    const collateralUnderlyings = position.supplied.map(b => b.underlying);
    const collateralUnderlyingsAd = position.supplied.map(b => b.ctoken);

    const [repayToken, setRepayToken] = useState<Token>(borrowedUnderlyings[0]);
    const [seizeAmount, setSeizeAmount] = useState('0');
    const [maxRepayAmount, setMaxRepayAmount] = useState(0);
    const [liquidatorRepayTokenBal, setLiquidatorRepayTokenBal] = useState(0);
    const [borrowedDetails, setBorrowedDetails] = useState(position.borrowed[0]);

    const { approvals } = useAllowances(borrowedUnderlyingsAd, anMarkets[repayToken.symbol]);
    const [isApproved, setIsApproved] = useState(repayToken.address ? hasAllowance(approvals, repayToken.address) : true);
    const { balances } = useBalances(borrowedUnderlyingsAd);

    const [seizeToken, setSeizeToken] = useState(collateralUnderlyings[0]);
    const [seizableDetails, setSeizableDetails] = useState(position.supplied[0]);
    const [repayAmount, setRepayAmount] = useState('0');
    const { data: seizableLiquidityBn } = useEtherSWR([seizableDetails.ctoken, 'getCash']);

    const seizeTokenLiquidity = seizableLiquidityBn ? getBnToNumber(seizableLiquidityBn, seizeToken.decimals) : 0;

    useEffect(() => {
        setRepayToken(borrowedUnderlyings[0])
        setSeizeToken(collateralUnderlyings[0])
    }, [position])

    useEffect(() => {
        setIsApproved(repayToken.address ? hasAllowance(approvals, repayToken.address) : true)
    }, [approvals, repayToken])

    useEffect(() => {
        const liquidatorBal = getParsedBalance(balances, repayToken.address || 'CHAIN_COIN', repayToken.decimals);

        setLiquidatorRepayTokenBal(liquidatorBal);
        const borrowed = position.borrowed.find(m => m.underlying.symbol === repayToken.symbol);
        if (!borrowed) { return }
        setBorrowedDetails(borrowed!);

        const seizableQty = seizableDetails.balance;
        const maxSeizableWorth = seizableQty * (oraclePrices[seizableDetails.ctoken] || seizableDetails.usdPrice);
        const repayAmountToSeizeMax = (maxSeizableWorth / bonusFactor) / (oraclePrices[borrowed.ctoken] || borrowed.usdPrice);

        setMaxRepayAmount(roundFloorString(Math.min(liquidatorBal, borrowed?.balance!, repayAmountToSeizeMax), borrowed.underlying.decimals));
    }, [repayToken, seizableDetails, oraclePrices])

    useEffect(() => {
        const seizable = position.supplied.find(m => m.underlying.symbol === seizeToken.symbol);
        if (!seizable) { return }
        setSeizableDetails(seizable);
    }, [seizeToken]);

    useEffect(() => {
        const repayWorth = parseFloat(repayAmount) * (oraclePrices[borrowedDetails.ctoken] || borrowedDetails.usdPrice);
        const seizePower = (repayWorth * bonusFactor) / (oraclePrices[seizableDetails.ctoken] || seizableDetails.usdPrice);
        setSeizeAmount(removeScientificFormat((seizePower || 0).toString()));
    }, [borrowedDetails, repayAmount, seizableDetails, oraclePrices])

    const handleLiquidation = async () => {
        return liquidateBorrow(position.account, provider?.getSigner(), repayAmount, borrowedDetails.ctoken, borrowedDetails.underlying, seizableDetails.ctoken);
    }

    const inputProps = { fontSize: '14px' }
    
    const collateralBalances = position.supplied.reduce((prev, curr) => ({
        ...prev,
        [curr.ctoken || 'CHAIN_COIN']: parseUnits(roundFloorString(curr.balance, curr.underlying.decimals), curr.underlying.decimals)
    }), {})

    const borrowAssetInputProps = { tokens: borrowedList, balances, showBalance: false }
    const collateralAssetInputProps = { tokens: seizeList, balances: collateralBalances, showBalance: false }
    const isSubmitDisabled = !isApproved || (liquidatorRepayTokenBal < parseFloat(repayAmount))

    return <Stack spacing="5" pt="2" direction="column" w="full" justify="center" alignItems="center">
        <Stack spacing="5">
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
                    orderByBalance={true}
                    {...borrowAssetInputProps}
                />
                <Text fontSize="12px">
                    Your balance: {formattedInfo(liquidatorRepayTokenBal, borrowedDetails.usdPrice)}, the borrowed amount: {formattedInfo(borrowedDetails.balance, borrowedDetails.usdPrice)}, you repay {formattedInfo(repayAmount, borrowedDetails.usdPrice)}
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
                    inputProps={{ fontSize: '14px', disabled: true }}
                    showMax={false}
                    orderByBalance={true}
                    {...collateralAssetInputProps}
                />
                <Text fontSize="12px" fontWeight="bold">
                    You can seize {shortenNumber((bonusFactor - 1) * 100, 2)}% more in USD than what you Repay in USD
                </Text>
                <Text fontSize="12px" color={seizeTokenLiquidity < 0.01 ? 'warning' : 'mainTextColor'}>
                    {seizableDetails.underlying.symbol} Market liquidity: {shortenNumber(seizeTokenLiquidity, 2, false, true)}
                </Text>
                <Text fontSize="12px">
                    Collateral balance: {formattedInfo(seizableDetails.balance, seizableDetails.usdPrice)}, You will seize an estimated {formattedInfo(seizeAmount, seizableDetails.usdPrice)}
                </Text>
                <Text fontSize="12px" fontWeight="bold" color="secondary">
                    Estimated Profit (Gas Fees excluded): {shortenNumber(parseFloat(seizeAmount) * seizableDetails.usdPrice - parseFloat(repayAmount) * borrowedDetails.usdPrice, 2, true, true)}
                </Text>
            </Stack>
        </Stack>
        <Stack direction="row">
            {
                !isApproved &&
                <ApproveButton needPoaFirst={true} tooltipMsg="" signer={provider?.getSigner()} address={repayToken.address} toAddress={borrowedDetails.ctoken} isDisabled={isApproved} />
            }
            <SubmitButton needPoaFirst={true} onClick={async () => handleLiquidation()} refreshOnSuccess={true} disabled={isSubmitDisabled}>
                Liquidate
            </SubmitButton>
        </Stack>
        <InfoMessage description="Note: seized assets are still on Frontier, withdrawing them is another process and requires enough liquidity." />
    </Stack>
}