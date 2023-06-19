import { useContext } from "react";
import { F2MarketContext } from "./F2Contex";
import { HStack, VStack, Text } from "@chakra-ui/react";
import { preciseCommify } from "@app/util/misc";
import { TextInfo } from "../common/Messages/TextInfo";
import { shortenNumber } from "@app/util/markets";
import { InfoMessage } from "../common/Messages";
import { usePrices } from "@app/hooks/usePrices";

export const DBRAutoRepayCalculator = () => {
    const {
        market,
        newTotalDebt,
        newDeposits,
        deposits,
    } = useContext(F2MarketContext);

    const { prices: cgPrices } = usePrices();

    const delta = newDeposits - deposits;

    const withoutStake = market.invStakedViaDistributor - deposits;
    const newTotalStaked = market.invStakedViaDistributor + delta;

    // const currentShare = market.invStakedViaDistributor ? deposits / market.invStakedViaDistributor : 0;
    const newShare = newTotalStaked ? newDeposits / (newTotalStaked) : 0;
    const dbrYearlyRewards = newShare * market?.dbrYearlyRewardRate;
    const shareNeeded = market?.dbrYearlyRewardRate < newTotalDebt || !market?.dbrYearlyRewardRate ?
        null : (newTotalDebt / market?.dbrYearlyRewardRate);

    const invNeeded = (shareNeeded * withoutStake) / (1 - shareNeeded)
    const invNeededToAdd = invNeeded - deposits;

    const netDbrRate = dbrYearlyRewards - newTotalDebt;
    const borrowableForFree = dbrYearlyRewards;
    const dbrInvExRate = !!cgPrices ? cgPrices['dola-borrowing-right']?.usd / cgPrices['inverse-finance']?.usd : 0;
    const newDbrApr = market?.dbrYearlyRewardRate * dbrInvExRate / newTotalStaked * 100;

    return <VStack w='full' alignItems="flex-start">
        <TextInfo message="By having more DBR rewards than DBR burns, you can borrow for free (in DBR terms).">
            <Text fontWeight="bold">
                Interest-free borrowing calculator
            </Text>
        </TextInfo>
        {
            newDeposits > 0 || deposits > 0 ?
                <HStack>
                    <Text w="200px">
                        Your yearly DBR rewards:
                    </Text>
                    <Text fontWeight="bold" color={dbrYearlyRewards > 0 ? 'success' : undefined}>
                        {preciseCommify(dbrYearlyRewards, 0)} DBR
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