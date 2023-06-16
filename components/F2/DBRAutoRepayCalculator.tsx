import { useContext } from "react";
import { F2MarketContext } from "./F2Contex";
import { HStack, VStack, Text } from "@chakra-ui/react";
import { useStakedInFirm } from "@app/hooks/useFirm";
import { preciseCommify } from "@app/util/misc";
import { useAccount } from "@app/hooks/misc";
import Container from "../common/Container";
import { TextInfo } from "../common/Messages/TextInfo";

export const DBRAutoRepayCalculator = () => {
    const {
        market,
        newTotalDebt,
        newDeposits,
        deposits,
    } = useContext(F2MarketContext);

    const delta = newDeposits - deposits;

    const withoutStake = market.invStakedViaDistributor - deposits;
    const newTotalStaked = market.invStakedViaDistributor + delta;

    // const currentShare = market.invStakedViaDistributor ? deposits / market.invStakedViaDistributor : 0;
    const newShare = newTotalStaked ? newDeposits / (newTotalStaked) : 0;     
    const dbrYearlyRewards = newShare * market?.dbrYearlyRewardRate;
    const shareNeeded = market?.dbrYearlyRewardRate < newTotalDebt || !market?.dbrYearlyRewardRate ?
        null : (newTotalDebt / market?.dbrYearlyRewardRate);

    const invNeeded = (shareNeeded * withoutStake) / (1-shareNeeded)
    const invNeededToAdd = invNeeded - deposits;

    const netDbrRate = dbrYearlyRewards - newTotalDebt;

    return <VStack w='full' alignItems="flex-start">
        <TextInfo message="By having more DBR rewards than DBR burns, you can borrow for free (purely in DBR terms).">
            <Text fontWeight="bold">
                Interest-free borrowing calculator
            </Text>
        </TextInfo>
        <HStack>
            <Text w="200px">
                Your yearly DBR rewards:
            </Text>
            <Text fontWeight="bold" color={dbrYearlyRewards > 0 ? 'success' : undefined}>
                {preciseCommify(dbrYearlyRewards, 2)} DBR
            </Text>
        </HStack>
        <HStack>
            <Text w="200px">
                Your yearly DBR burn rate:
            </Text>
            <Text fontWeight="bold" color={newTotalDebt > 0 ? 'warning' : undefined}>
                {preciseCommify(newTotalDebt, 2)} DBR
            </Text>
        </HStack>
        <HStack>
            <Text w="200px">
                Your yearly DBR net rate:
            </Text>
            <Text fontWeight="bold" color={netDbrRate === 0 ? undefined : netDbrRate < 0 ? 'warning' : 'success'}>
                {preciseCommify(netDbrRate, 2)} DBR
            </Text>
        </HStack>
        <HStack>
            <Text>
                At current DBR APR, for a free loan stake at least:
            </Text>
            <Text fontWeight="bold">
                {preciseCommify(invNeededToAdd, 2)} INV
            </Text>
        </HStack>
    </VStack>
};