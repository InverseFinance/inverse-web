import { SubmitButton } from "@app/components/common/Button";
import { InfoMessage } from "@app/components/common/Messages";
import { Modal } from "@app/components/common/Modal"
import ScannerLink from "@app/components/common/ScannerLink";
import { DBR_ABI, F2_MARKET_ABI } from "@app/config/abis";
import { useAccountDBR, useDBRReplenishmentPrice } from "@app/hooks/useDBR";
import { useTransactionCost } from "@app/hooks/usePrices";
import { f2replenish } from "@app/util/f2";
import { shortenNumber } from "@app/util/markets";
import { roundFloorString } from "@app/util/misc";
import { getNetworkConfigConstants } from "@app/util/networks";
import { HStack, VStack, Text, Divider, Select } from "@chakra-ui/react";
import { parseEther } from "@ethersproject/units";
import { useWeb3React } from "@web3-react/core";
import { Contract } from "ethers";
import { useEffect, useState } from "react";

const { DBR } = getNetworkConfigConstants();

export const DbrReplenishmentModal = ({
    position,
    onClose,
    isOpen,
}: {
    position: any,
    onClose: () => void,
    isOpen: boolean,
}) => {
    const { library, account } = useWeb3React();

    const [repayAmount, setRepayAmount] = useState('');
    const [chosenMarket, setChosenMarket] = useState(position.marketPositions?.[0]?.market);
    const [dolaReward, setDolaReward] = useState(0);
    const { replenishmentPrice } = useDBRReplenishmentPrice();

    const liveData = useAccountDBR(position.user);
    const dataSource = !!account && !!liveData ? liveData : position;
    const { signedBalance, debt } = dataSource;
    const deficit = signedBalance < 0 ? Math.abs(signedBalance) : 0;

    const { costEth, costUsd } = useTransactionCost(
        new Contract(chosenMarket?.address, F2_MARKET_ABI, library?.getSigner()),
        'forceReplenish',
        [
            position.user,
            repayAmount ? parseEther(roundFloorString(Math.abs(signedBalance), 18)) : '1',
        ],
    );

    const estimatedProfit = dolaReward - costUsd;

    const handleLiquidation = async () => {
        const deficit = await (new Contract(DBR, DBR_ABI, library?.getSigner())).deficitOf(position.user);
        return f2replenish(library?.getSigner(), position.user, chosenMarket.address, deficit);
    }

    const handleMarketSelect = (v) => {        
        const i = position.marketPositions.findIndex(mp => mp.market.address === v);        
        setChosenMarket(position.marketPositions?.[i]?.market);
    }

    useEffect(() => {
        if (!position) { return }
        const reward = deficit * replenishmentPrice * chosenMarket.replenishmentIncentive;
        setDolaReward(reward);
    }, [deficit, position, chosenMarket, replenishmentPrice]);

    return <Modal
        header={`Replenishment Form`}
        onClose={onClose}
        isOpen={isOpen}
    >
        {
            !!position &&
            <VStack w='full' p="4">
                <HStack w='full' justify="space-between">
                    <Text>Borrower:</Text>
                    <ScannerLink value={position.user} />
                </HStack>
                <HStack w='full' justify="space-between">
                    <Text>Market to add cost:</Text>
                    <Select minW='fit-content' maxW='100px' onChange={(e) => handleMarketSelect(e.target.value)}>
                        {position?.marketPositions?.map(mp => <option value={mp.market.address}>
                            {mp.market.name}
                        </option>)}
                    </Select>
                </HStack>
                <Divider />
                {
                    position?.liquidatableDebt !== debt &&
                    <HStack w='full' justify="space-between">
                        <Text>Debt:</Text>
                        <Text fontWeight="bold">{shortenNumber(debt, 2)}</Text>
                    </HStack>
                }
                <HStack w='full' justify="space-between">
                    <Text>Replenishment Possible:</Text>
                    <Text fontWeight="bold">{shortenNumber(deficit, 4, false, true)}</Text>
                </HStack>
                <HStack w='full' justify="space-between">
                    <Text>Replenishment Price:</Text>
                    <Text fontWeight="bold">{shortenNumber(replenishmentPrice, 2)} DOLA</Text>
                </HStack>
                <HStack w='full' justify="space-between">
                    <Text>Replenishment Cost to borrower:</Text>
                    <Text fontWeight="bold">{shortenNumber(deficit * replenishmentPrice, 2, false, true)} DOLA</Text>
                </HStack>
                <HStack w='full' justify="space-between">
                    <Text>Replenishment Incentive:</Text>
                    <Text fontWeight="bold">{chosenMarket.replenishmentIncentive * 100}%</Text>
                </HStack>
                <HStack w='full' justify="space-between">
                    <Text>DOLA reward for you:</Text>
                    <Text fontWeight="bold">
                        {shortenNumber(dolaReward, 2, false, true)}
                    </Text>
                </HStack>
                {
                    !account && <InfoMessage alertProps={{ w: 'full' }} description="Please connect wallet" />
                }
                <SubmitButton refreshOnSuccess={true} onClick={handleLiquidation}>
                    Replenishment
                </SubmitButton>

                {
                    !!account &&
                    <VStack pt="4" w='full' alignItems="flex-start">
                        <Text fontWeight="bold">Amount to repay:</Text>

                        <InfoMessage
                            alertProps={{ w: 'full' }}
                            description={
                                `You only pay a transaction fee and get a DOLA reward while the borrower has their debt increased.`
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
    </Modal>
}