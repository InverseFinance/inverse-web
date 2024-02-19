import { SubmitButton } from "@app/components/common/Button";
import { InfoMessage } from "@app/components/common/Messages";
import ScannerLink from "@app/components/common/ScannerLink";
import { F2_MARKET_ABI } from "@app/config/abis";
import { useAccountDBR, useBorrowLimits, useDBRReplenishmentPrice } from "@app/hooks/useDBR";
import { useTransactionCost } from "@app/hooks/usePrices";
import { f2replenishAll } from "@app/util/f2";
import { shortenNumber } from "@app/util/markets";
import { roundFloorString } from "@app/util/misc";
import { HStack, VStack, Text, Divider, Select } from "@chakra-ui/react";
import { parseEther } from "@ethersproject/units";
import { useWeb3React } from "@web3-react/core";
import { Contract } from "ethers";
import { useEffect, useState } from "react";

export const DbrReplenishmentForm = ({
    userData,
}: {
    userData: any,
}) => {
    const { provider, account } = useWeb3React();

    const [repayAmount, setRepayAmount] = useState('');
    const [chosenPosition, setChosenPosition] = useState(userData.marketPositions?.[0]);
    const [dolaReward, setDolaReward] = useState(0);
    const { replenishmentPrice } = useDBRReplenishmentPrice();

    const liveData = useAccountDBR(userData.user);
    const { dolaLiquidity, isLoading } = useBorrowLimits(chosenPosition?.market);
    const hasEnoughLiquidityForReward = dolaLiquidity >= dolaReward;
    const dataSource = !!account && !!liveData ? liveData : userData;
    const { signedBalance, debt } = dataSource;
    const deficit = signedBalance < 0 ? Math.abs(signedBalance) : 0;

    const { costEth, costUsd } = useTransactionCost(
        new Contract(chosenPosition?.market?.address, F2_MARKET_ABI, provider?.getSigner()),
        'forceReplenish',
        [
            userData.user,
            repayAmount ? parseEther(roundFloorString(Math.abs(signedBalance), 18)) : '1',
        ],
    );

    const estimatedProfit = dolaReward - costUsd;

    const handleReplenish = async () => {
        return f2replenishAll(provider?.getSigner(), userData.user, chosenPosition?.market?.address);
    }

    const handleMarketSelect = (v) => {
        const i = userData.marketPositions.findIndex(mp => mp.market.address === v);
        setChosenPosition(userData.marketPositions?.[i]);
    }

    useEffect(() => {
        if (!userData) { return }
        const reward = deficit * replenishmentPrice * chosenPosition?.market.replenishmentIncentive;
        setDolaReward(reward);
    }, [deficit, userData, chosenPosition, replenishmentPrice]);

    if (!userData) {
        return null
    }

    return <VStack w='full' p="4">
        <HStack w='full' justify="space-between">
            <Text>Borrower:</Text>
            <ScannerLink value={userData.user} />
        </HStack>
        <HStack w='full' justify="space-between">
            <Text>Market to add cost:</Text>
            <Select minW='fit-content' maxW='100px' onChange={(e) => handleMarketSelect(e.target.value)}>
                {userData?.marketPositions?.map(mp => <option value={mp.market.address}>
                    {mp.market.name}
                </option>)}
            </Select>
        </HStack>
        <Divider />
        <HStack w='full' justify="space-between">
            <Text>Market's Debt:</Text>
            <Text fontWeight="bold">{shortenNumber(chosenPosition.debt, 2)} DOLA</Text>
        </HStack>
        {
            userData?.liquidatableDebt !== debt &&
            <HStack w='full' justify="space-between">
                <Text>Total Debt:</Text>
                <Text fontWeight="bold">{shortenNumber(debt, 2)} DOLA</Text>
            </HStack>
        }
        <HStack w='full' justify="space-between">
            <Text>Replenishment Possible:</Text>
            <Text fontWeight="bold">{shortenNumber(deficit, 4, false, true)} DBR</Text>
        </HStack>
        <HStack w='full' justify="space-between">
            <Text>Replenishment Price:</Text>
            <Text fontWeight="bold">{shortenNumber(replenishmentPrice, 2)} DOLA per DBR</Text>
        </HStack>
        <HStack w='full' justify="space-between">
            <Text>Replenishment Cost to borrower:</Text>
            <Text fontWeight="bold">{shortenNumber(deficit * replenishmentPrice, 2, false, true)} DOLA</Text>
        </HStack>
        <HStack w='full' justify="space-between">
            <Text>Replenishment Incentive:</Text>
            <Text fontWeight="bold">{chosenPosition?.market.replenishmentIncentive * 100}%</Text>
        </HStack>
        <HStack w='full' justify="space-between">
            <Text>Your reward:</Text>
            <Text fontWeight="bold">
                {shortenNumber(dolaReward, 2, false, true)} DOLA
            </Text>
        </HStack>
        {
            !account && <InfoMessage alertProps={{ w: 'full' }} description="Please connect wallet" />
        }
        <SubmitButton isDisabled={dolaReward <= 0 || !hasEnoughLiquidityForReward} refreshOnSuccess={true} onClick={handleReplenish}>
            Replenish
        </SubmitButton>
        {
            !!account &&
            <VStack pt="4" w='full' alignItems="flex-start">
                <InfoMessage
                    alertProps={{ w: 'full' }}
                    description={
                        !isLoading && !hasEnoughLiquidityForReward ?
                            `Not enough DOLA liquidity in the market at the moment to pay the reward.`
                            : `You only pay a transaction fee and get a DOLA reward while the borrower has their debt increased. Note: use flashbot rpc to not be frontrun by a bot.`
                    }
                />
                <HStack w='full' justify="space-between">
                    <Text>Tx cost: ~{shortenNumber(costEth, 4)} ({shortenNumber(costUsd, 2, true)})</Text>
                    <Text color={estimatedProfit > 0 ? 'success' : 'error'}>Profit: {shortenNumber(estimatedProfit, 2, true)}</Text>
                </HStack>
            </VStack>
        }
    </VStack>
}