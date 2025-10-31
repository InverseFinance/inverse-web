import { NavButtons } from "@app/components/common/Button";
import { InfoMessage } from "@app/components/common/Messages";
import ScannerLink from "@app/components/common/ScannerLink";
import { SimpleAmountForm } from "@app/components/common/SimpleAmountForm";
import { F2_MARKET_ABI } from "@app/config/abis";
import { useAccountDBRMarket } from "@app/hooks/useDBR";
import { useDOLAPrice, useTransactionCost } from "@app/hooks/usePrices";
import { f2liquidate, f2repay } from "@app/util/f2";
import { getNumberToBn, shortenNumber } from "@app/util/markets";
import { preciseCommify, roundFloorString } from "@app/util/misc";
import { getNetworkConfigConstants } from "@app/util/networks";
import { HStack, VStack, Text } from "@chakra-ui/react";
import { parseEther } from "@ethersproject/units";
import { useWeb3React } from "@web3-react/core";
import { BigNumber, Contract } from "ethers";
import { useEffect, useState } from "react";

const { DOLA } = getNetworkConfigConstants();

export const FirmLiquidationForm = ({
    position,
}: {
    position: any,
}) => {
    const { provider, account } = useWeb3React();
    const { price: dolaMarketPrice } = useDOLAPrice();

    const [mode, setMode] = useState<'Liquidate' | 'Repay on-behalf'>('Liquidate');
    const [repayAmount, setRepayAmount] = useState('');
    const [seizeAmount, setSeizeAmount] = useState(0);
    const [seizeWorth, setSeizeWorth] = useState(0);

    const { costEth, costUsd } = useTransactionCost(
        new Contract(position.market.address, F2_MARKET_ABI, provider?.getSigner()),
        'liquidate',
        [
            position.user,
            repayAmount ? parseEther(roundFloorString(repayAmount, 18)) : '1',
        ],
    );

    const liveData = useAccountDBRMarket(position.market, position.user);
    const dataSource = !!account && !!liveData ? liveData : position;
    const { debt, liquidatableDebt, seizableWorth, perc, deposits, liquidationPrice } = dataSource;
    const estimatedProfit = seizeWorth - costUsd - (parseFloat(repayAmount) || 0) * dolaMarketPrice;

    const handleLiquidation = async (repayAmountBn: BigNumber) => {
        return f2liquidate(provider?.getSigner(), position.user, position.market.address, repayAmountBn);
    }

    const handleRepayOnBehalf = async (repayAmountBn: BigNumber) => {
        return f2repay(provider?.getSigner(), position.market.address, repayAmountBn, position.user);
    }

    useEffect(() => {
        setRepayAmount('');
        setSeizeAmount(0);
        setSeizeWorth(0);
    }, [position?.key])

    useEffect(() => {
        if (!position) { return }
        const repayFloat = parseFloat(repayAmount) || 0;
        const seizeWorth = repayFloat + repayFloat * position.market.liquidationIncentive;
        setSeizeWorth(seizeWorth);
        setSeizeAmount(seizeWorth / position.market.price);
    }, [repayAmount, position]);

    // TODO: refacto, in some cases view price can be different than price for liq
    const depositWorth = deposits * position?.market.price;
    const maxSeizableWorth = Math.min(liquidatableDebt, depositWorth);

    const maxRepayableForDeposits = depositWorth * (1 - position.market.liquidationIncentive);
    const maxRepayable = Math.min(liquidatableDebt, maxRepayableForDeposits);

    const maxWorthSeizable = maxRepayable * (1 + position.market.liquidationIncentive);
    const maxCollateralSeizable = maxWorthSeizable / position?.market.price;

    if (!position) {
        return null
    }

    return <VStack w='full' p="4">
        <NavButtons
            active={mode}
            options={['Liquidate', 'Repay on-behalf']}
            onClick={(v) => setMode(v)}
        />
        <HStack w='full' justify="space-between">
            <Text>Borrower:</Text>
            <ScannerLink value={position.user} />
        </HStack>
        <HStack w='full' justify="space-between">
            <Text>Debt:</Text>
            <Text fontWeight="bold">{shortenNumber(debt, 2)}</Text>
        </HStack>
        {
            mode === 'Liquidate' && <>
                <HStack w='full' justify="space-between">
                    <Text>Deposits:</Text>
                    <Text fontWeight="bold">{shortenNumber(deposits, 4)} {position?.market.underlying.symbol} ({shortenNumber(depositWorth, 2, true)})</Text>
                </HStack>
                <HStack w='full' justify="space-between">
                    <Text>Deposits worth (with {shortenNumber(position?.market.collateralFactor * 100, 0)}% CF):</Text>
                    <Text fontWeight="bold">{shortenNumber(depositWorth * position?.market.collateralFactor, 2, true)}</Text>
                </HStack>
                <HStack w='full' justify="space-between">
                    <Text>Liquidation Incentive:</Text>
                    <Text fontWeight="bold">{position?.market.liquidationIncentive * 100}%</Text>
                </HStack>
                <HStack w='full' justify="space-between">
                    <Text>Liquidation Factor:</Text>
                    <Text fontWeight="bold">{position?.market.liquidationFactor * 100}%</Text>
                </HStack></>
        }
        {
            mode === 'Liquidate' && <>
                <HStack w='full' justify="space-between">
                    <Text>Max Repayable Debt:</Text>
                    <Text fontWeight="bold">{shortenNumber(maxRepayable, 2, false, true)}</Text>
                </HStack>
                <HStack w='full' justify="space-between">
                    <Text>Max Seizable:</Text>
                    <Text fontWeight="bold">{shortenNumber(maxCollateralSeizable, 4, false, true)} ({shortenNumber(maxWorthSeizable, 2, true, true)})</Text>
                </HStack>
                {
                    maxSeizableWorth > 0 && <HStack w='full' justify="space-between">
                        <Text>Max Seizable:</Text>
                        <Text fontWeight="bold">
                            {shortenNumber(maxCollateralSeizable, 4, false, true)} {position?.market.underlying.symbol} ({shortenNumber(maxSeizableWorth, 2, true)})
                        </Text>
                    </HStack>
                }
            </>
        }
        <HStack w='full' justify="space-between">
            <Text>Liquidation Price:</Text>
            <Text fontWeight="bold">{preciseCommify(liquidationPrice, 2, true)}</Text>
        </HStack>
        <HStack w='full' justify="space-between">
            <Text>Borrow limit:</Text>
            <Text fontWeight="bold">{shortenNumber(100 - perc, 2)}%</Text>
        </HStack>
        {
            !account && <InfoMessage alertProps={{ w: 'full' }} description="Please connect wallet" />
        }

        {
            mode === 'Liquidate' && maxSeizableWorth > 0 && !!account &&
            <VStack pt="4" w='full' alignItems="flex-start">
                <Text fontWeight="bold">Amount to repay:</Text>
                <SimpleAmountForm
                    defaultAmount={repayAmount}
                    address={DOLA}
                    destination={position?.market.address}
                    signer={provider?.getSigner()}
                    decimals={18}
                    hideInputIfNoAllowance={false}
                    maxAmountFrom={[getNumberToBn(maxRepayable)]}
                    includeBalanceInMax={true}
                    onAction={({ bnAmount }) => handleLiquidation(bnAmount)}
                    onAmountChange={(v) => setRepayAmount(v)}
                    showMaxBtn={false}
                    showNotEnoughTokenMsg={true}
                    actionLabel="Liquidate"
                    btnProps={{
                        needPoaFirst: true
                    }}
                />
                <InfoMessage
                    alertProps={{ w: 'full' }}
                    description={
                        seizeAmount > 0 ? `You will seize: ${shortenNumber(seizeAmount, 4)} (${shortenNumber(seizeWorth, 2, true)})` : 'Repay a DOLA amount to seize collateral'
                    }
                />
                <HStack w='full' justify="space-between">
                    <Text>Tx cost: ~{shortenNumber(costEth, 4)} ({shortenNumber(costUsd, 2, true)})</Text>
                    <Text color={estimatedProfit > 0 ? 'success' : 'error'}>Profit: {shortenNumber(estimatedProfit, 2, true)}</Text>
                </HStack>
            </VStack>
        }
        {
            mode === 'Repay on-behalf' && !!account &&
            <VStack pt="4" w='full' alignItems="flex-start">
                <Text fontWeight="bold">Repay debt on-behalf:</Text>
                <SimpleAmountForm
                    defaultAmount={repayAmount}
                    address={DOLA}
                    destination={position?.market.address}
                    signer={provider?.getSigner()}
                    decimals={18}
                    hideInputIfNoAllowance={false}
                    maxAmountFrom={[getNumberToBn(debt)]}
                    includeBalanceInMax={true}
                    onAction={({ bnAmount }) => handleRepayOnBehalf(bnAmount)}
                    onAmountChange={(v) => setRepayAmount(v)}
                    showMaxBtn={false}
                    showNotEnoughTokenMsg={true}
                    actionLabel="Repay on-behalf"
                    btnProps={{
                        needPoaFirst: false
                    }}
                />
            </VStack>
        }
    </VStack>
}