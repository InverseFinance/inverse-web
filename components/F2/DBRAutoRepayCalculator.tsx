import { useContext, useState } from "react";
import { F2MarketContext } from "./F2Contex";
import { HStack, VStack, Text, useDisclosure } from "@chakra-ui/react";
import { preciseCommify } from "@app/util/misc";
import { TextInfo } from "../common/Messages/TextInfo";
import { shortenNumber } from "@app/util/markets";
import { InfoMessage } from "../common/Messages";
import { usePrices } from "@app/hooks/usePrices";
import { TimeIcon } from "@chakra-ui/icons";
import InfoModal from "../common/Modal/InfoModal";
import { F2DurationInput } from "./forms/F2DurationInput";

export const DBRAutoRepayCalculator = () => {
    const {
        market,
        newTotalDebt,
        newDeposits,
        deposits,
    } = useContext(F2MarketContext);

    const { prices: cgPrices } = usePrices();
    const [duration, setDuration] = useState(365);
    const { isOpen, onOpen, onClose } = useDisclosure();

    const delta = newDeposits - deposits;

    const withoutStake = market.invStakedViaDistributor - deposits;
    const newTotalStaked = market.invStakedViaDistributor + delta;

    // const currentShare = market.invStakedViaDistributor ? deposits / market.invStakedViaDistributor : 0;
    const newShare = newTotalStaked ? newDeposits / (newTotalStaked) : 0;
    const totalRewardsForDuration = duration / 365 * (market?.dbrYearlyRewardRate||0);
    const userRewardsForDuration = newShare * totalRewardsForDuration;
    const userBurnsForDuration = newTotalDebt * duration / 365;

    const shareNeeded = market?.dbrYearlyRewardRate < userBurnsForDuration || !market?.dbrYearlyRewardRate ?
        null : (userBurnsForDuration / totalRewardsForDuration);

    const invNeeded = (shareNeeded * withoutStake) / (1 - shareNeeded)
    const invNeededToAdd = invNeeded - deposits;

    const netDbrRate = userRewardsForDuration - newTotalDebt;
    const borrowableForFree = userRewardsForDuration;
    const dbrInvExRate = !!cgPrices ? cgPrices['dola-borrowing-right']?.usd / cgPrices['inverse-finance']?.usd : 0;
    const newDbrApr = market?.dbrYearlyRewardRate * dbrInvExRate / newTotalStaked * 100;

    const handleSimulationDuration = () => {
        onOpen();
    }

    const handleDurationChange = (v) => {
        setDuration(v);
    }

    return <VStack w='full' alignItems="flex-start">
        <InfoModal isOpen={isOpen} onClose={onClose}>
            <VStack>
                <Text>Loan duration to simulate for the calculator</Text>
                <F2DurationInput
                    onChange={handleDurationChange}
                    defaultType={durationType}
                    defaultValue={durationTypedValue}
                />
            </VStack>
        </InfoModal>
        <HStack w='full' justify="space-between">
            <TextInfo message="By having more DBR rewards than DBR burns, you can borrow for free (in DBR terms).">
                <Text fontWeight="bold">
                    Interest-free borrowing calculator
                </Text>
            </TextInfo>
            <HStack cursor="pointer" onClick={handleSimulationDuration}>
                <TimeIcon />
                <Text>Sim. duration</Text>
            </HStack>
        </HStack>
        {
            newDeposits > 0 || deposits > 0 ?
                <HStack>
                    <Text w="200px">
                        Your yearly DBR rewards:
                    </Text>
                    <Text fontWeight="bold" color={userRewardsForDuration > 0 ? 'success' : undefined}>
                        {preciseCommify(userRewardsForDuration, 0)} DBR
                    </Text>
                </HStack> : newTotalDebt > 0 ? null : <InfoMessage
                    alertProps={{ w: 'full' }}
                    description="Staking INV can make borrowing free if your DBR rewards are higher than DBR burns, input an INV amount to get informations on how much you could borrow for free."
                />
        }
        {
            newTotalDebt > 0 && <>
                <HStack>
                    <Text w="200px">
                        Your yearly DBR burn rate:
                    </Text>
                    <Text fontWeight="bold" color={newTotalDebt > 0 ? 'warning' : undefined}>
                        {preciseCommify(newTotalDebt, 0)} DBR
                    </Text>
                </HStack>
                <HStack>
                    <Text w="200px">
                        Your yearly DBR net rate:
                    </Text>
                    <Text fontWeight="bold" color={Math.round(netDbrRate) === 0 ? undefined : netDbrRate < 0 ? 'warning' : 'success'}>
                        {preciseCommify(netDbrRate, 0)} DBR
                    </Text>
                </HStack>
            </>
        }
        {
            newTotalDebt > 0 ? <HStack>
                <Text>
                    Staking amount to add for a free loan:
                </Text>
                <Text fontWeight="bold">
                    {preciseCommify(invNeededToAdd, 2)} INV
                </Text>
            </HStack>
                :
                newDeposits > 0 ? <HStack>
                    <Text>
                        With <b>{shortenNumber(newDeposits, 2)} INV</b> you can borrow for free:
                    </Text>
                    <Text fontWeight="bold">
                        ~{preciseCommify(borrowableForFree, 0)} DOLA a year
                    </Text>
                </HStack> : null
        }
        {
            (newDeposits > 0 || deposits > 0 || newTotalDebt > 0) && <HStack>
                <Text fontWeight="bold">
                    Note: the DBR APR is volatile, this is for information purposes only.
                </Text>
            </HStack>
        }
    </VStack>
};