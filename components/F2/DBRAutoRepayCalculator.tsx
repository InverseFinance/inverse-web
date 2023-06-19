import { useContext, useEffect, useState } from "react";
import { F2MarketContext } from "./F2Contex";
import { HStack, VStack, Text, useDisclosure, Stack, Input, Divider } from "@chakra-ui/react";
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
    const [tempValues, setTempValues] = useState({ days: 365, type: 'months', typedValue: 12, dolaDebt: undefined });
    const [dolaDebt, setDolaDebt] = useState(newTotalDebt);
    const [duration, setDuration] = useState(365);
    const [durationType, setDurationType] = useState('months');
    const [durationTypeValue, setDurationTypeValue] = useState(12);
    const { isOpen, onOpen, onClose } = useDisclosure();

    const delta = newDeposits - deposits;

    const withoutStake = market.invStakedViaDistributor - deposits;
    const newTotalStaked = market.invStakedViaDistributor + delta;

    // const currentShare = market.invStakedViaDistributor ? deposits / market.invStakedViaDistributor : 0;
    const newShare = newTotalStaked ? newDeposits / (newTotalStaked) : 0;
    const totalRewardsForDuration = duration / 365 * (market?.dbrYearlyRewardRate||0);
    const userRewardsForDuration = newShare * totalRewardsForDuration;
    const userBurnsForDuration = dolaDebt * duration / 365;

    const shareNeeded = market?.dbrYearlyRewardRate < userBurnsForDuration || !market?.dbrYearlyRewardRate ?
        null : (userBurnsForDuration / totalRewardsForDuration);

    const invNeeded = (shareNeeded * withoutStake) / (1 - shareNeeded)
    const invNeededToAdd = invNeeded - deposits;

    const netDbrRate = userRewardsForDuration - userBurnsForDuration;
    const borrowableForFree = userRewardsForDuration;
    const dbrInvExRate = !!cgPrices ? cgPrices['dola-borrowing-right']?.usd / cgPrices['inverse-finance']?.usd : 0;
    const newDbrApr = market?.dbrYearlyRewardRate * dbrInvExRate / newTotalStaked * 100;

    const handleSimulationDuration = () => {
        onOpen();
    }

    const applyTempValues = () => {
        setDuration(tempValues.days);
        setDurationType(tempValues.type);
        setDurationTypeValue(tempValues.typedValue);
        setDolaDebt(tempValues.dolaDebt);
        onClose();
    }

    const handleDolaChange = (value: string) => {
        const stringAmount = value.replace(/[^0-9.]/, '').replace(/(\..*)\./g, '$1');
        try {
            const floatAmount = parseFloat(stringAmount) || 0;
            setTempValues({ ...tempValues, dolaDebt: floatAmount });
        } catch (error) {}
    }

    useEffect(() => {
        if(!!newTotalDebt && tempValues.dolaDebt === undefined) {
            setTempValues({ ...tempValues, dolaDebt: newTotalDebt });
            setDolaDebt(newTotalDebt);
        }
    }, [newTotalDebt, tempValues.dolaDebt]);

    const durationText = `${durationTypeValue} ${durationType}`

    return <VStack w='full' alignItems="flex-start">
        <InfoModal title="Calculator settings" isOpen={isOpen} onClose={onClose} onOk={() => applyTempValues()}>
            <VStack p='2' alignItems="flex-start">
                <Text>Duration of the staking and the DOLA loans?</Text>
                <F2DurationInput
                    columnMode={true}
                    defaultType={durationType}
                    defaultValue={durationTypeValue}
                    onChange={(days, typedValue, type) => setTempValues({ ...tempValues, days, typedValue, type })}
                />
                <Divider />
                <Text>Total DOLA borrowed:</Text>
                <Input textAlign="right" bgColor="mainBackgroundColor" value={tempValues.dolaDebt} onChange={e => handleDolaChange(e.target.value)} />
            </VStack>
        </InfoModal>
        <Stack direction={{ base: 'column', sm: 'row' }} w='full' justify="space-between">
            <TextInfo message="By having more DBR rewards than DBR burns, you can borrow for free (in DBR terms).">
                <Text fontWeight="bold">
                    Interest-free borrowing calculator
                </Text>
            </TextInfo>
            <HStack textDecoration="underline" cursor="pointer" onClick={handleSimulationDuration}>
                <TimeIcon boxSize="3" />
                <Text>Sim. duration: {durationText}</Text>
            </HStack>
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
                    description="Staking INV can make borrowing free if your DBR rewards are higher than DBR burns, input an INV amount to get informations on how much you could borrow for free."
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
            userBurnsForDuration > 0 ? <HStack>
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
                    Note: the DBR APR is volatile, this is for information purposes only.
                </Text>
            </HStack>
        }
    </VStack>
};