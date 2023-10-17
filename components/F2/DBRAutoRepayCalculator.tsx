import { HStack, VStack, Text, Stack } from "@chakra-ui/react";
import { preciseCommify } from "@app/util/misc";
import { TextInfo } from "../common/Messages/TextInfo";
import { shortenNumber } from "@app/util/markets";
import { InfoMessage } from "../common/Messages";

const duration = 365;
const durationType = 'months';
const durationTypeValue = 12;

export const DBRAutoRepayCalculator = ({
    invStakedViaDistributor,
    dbrYearlyRewardRate,
    newTotalDebt,
    newDeposits,
    deposits,
    handleCollateralChange,
}: {
    invStakedViaDistributor?: number
    dbrYearlyRewardRate?: number,
    newTotalDebt?: number,
    newDeposits?: number,
    deposits?: number,
    handleCollateralChange: (v: string) => void,
}) => {
    const delta = newDeposits - deposits;

    const withoutStake = invStakedViaDistributor - deposits;
    const newTotalStaked = invStakedViaDistributor + delta;

    const newShare = newTotalStaked ? newDeposits / (newTotalStaked) : 0;
    const totalRewardsForDuration = duration / 365 * (dbrYearlyRewardRate || 0);
    const userRewardsForDuration = newShare * totalRewardsForDuration;
    const userBurnsForDuration = newTotalDebt * duration / 365;

    const shareNeeded = dbrYearlyRewardRate < userBurnsForDuration || !dbrYearlyRewardRate ?
        null : (userBurnsForDuration / totalRewardsForDuration);

    const invNeeded = (shareNeeded * withoutStake) / (1 - shareNeeded)
    const invNeededToAdd = invNeeded - deposits;

    const netDbrRate = userRewardsForDuration - userBurnsForDuration;
    const borrowableForFree = userRewardsForDuration;

    const durationText = `${durationTypeValue} ${durationType}`

    return <VStack w='full' alignItems="flex-start">
        <Stack direction={{ base: 'column', sm: 'row' }} w='full' justify="space-between">
            <TextInfo message="By having more DBR rewards than DBR burns, you can borrow for free (in DBR terms). As the DBR APR is volatile, it's better to stake more than what is suggested for the current APR.">
                <Text fontWeight="bold">
                    Interest-free borrowing calculator
                </Text>
            </TextInfo>
        </Stack>
        {
            newDeposits > 0 || deposits > 0 ?
                <HStack>
                    <Text w="270px">
                        Your DBR rewards for {durationText}:
                    </Text>
                    <Text fontWeight="bold" color={userRewardsForDuration > 0 ? 'success' : undefined}>
                        {preciseCommify(userRewardsForDuration, 0)} DBR
                    </Text>
                </HStack> : userBurnsForDuration > 0 ? null : <InfoMessage
                    alertProps={{ w: 'full' }}
                    description="Staking INV can make borrowing interest-free if your DBR rewards are higher than your DBR burns, input an INV amount to get informations on how much you could borrow for free."
                />
        }
        {
            userBurnsForDuration > 0 && <>
                <HStack>
                    <Text w="270px">
                        Your DBR burns for {durationText}:
                    </Text>
                    <Text fontWeight="bold" color={userBurnsForDuration > 0 ? 'warning' : undefined}>
                        {preciseCommify(userBurnsForDuration, 0)} DBR
                    </Text>
                </HStack>
                <HStack>
                    <Text w="270px">
                        Your DBR net result for {durationText}:
                    </Text>
                    <Text fontWeight="bold" color={Math.round(netDbrRate) === 0 ? undefined : netDbrRate < 0 ? 'warning' : 'success'}>
                        {preciseCommify(netDbrRate, 0)} DBR
                    </Text>
                </HStack>
            </>
        }
        {
            userBurnsForDuration > 0 ? invNeededToAdd > 0 ? <HStack>
                <Text>
                    Staking amount to add to borrow interest-free:
                </Text>
                <Text fontWeight="bold" textDecoration="underline" cursor="pointer" onClick={() => handleCollateralChange(invNeededToAdd.toFixed(2))}>
                    {preciseCommify(invNeededToAdd, 2)} INV
                </Text>
            </HStack> :
                null
                :
                newDeposits > 0 ? <HStack>
                    <Text>
                        With <b>{shortenNumber(newDeposits, 2)} INV</b> you could borrow:
                    </Text>
                    <Text fontWeight="bold">
                        ~{preciseCommify(borrowableForFree, 0)} DOLA for {durationText}
                    </Text>
                </HStack> : null
        }
        {
            (newDeposits > 0 || deposits > 0 || userBurnsForDuration > 0) && <HStack>
                <Text fontWeight="bold">
                    Note: the DBR APR being volatile, {
                        userBurnsForDuration > 0 ? `it's better to stake more than needed.` : `this is for information only.`
                    }
                </Text>
            </HStack>
        }
    </VStack>
};