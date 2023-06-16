import { useContext } from "react";
import { F2MarketContext } from "./F2Contex";
import { HStack, VStack, Text } from "@chakra-ui/react";
import { useStakedInFirm } from "@app/hooks/useFirm";
import { preciseCommify } from "@app/util/misc";
import { useAccount } from "@app/hooks/misc";

export const DBRAutoRepayCalculator = () => {
    const {
        market,
        newTotalDebt,
    } = useContext(F2MarketContext);

    const account = useAccount();
    const { stakedInFirm } = useStakedInFirm(account);

    const share = market.invStakedViaDistributor ? stakedInFirm / market.invStakedViaDistributor : 0;
    const dbrYearlyRewards = share * market?.dbrYearlyRewardRate;
    const shareNeeded = market?.dbrYearlyRewardRate < newTotalDebt || !market?.dbrYearlyRewardRate ?
        null : (newTotalDebt / market?.dbrYearlyRewardRate);
    const invNeeded = (shareNeeded * market.invStakedViaDistributor) / (1-shareNeeded);

    return <VStack>
        <HStack>
            <Text>
                Yearly DBR burn rate:
            </Text>
            <Text>
                {preciseCommify(newTotalDebt, 2)} DBR
            </Text>
        </HStack>
        <HStack>
            <Text>
                Yearly DBR rewards:
            </Text>
            <Text>
                {preciseCommify(dbrYearlyRewards, 2)} DBR
            </Text>
        </HStack>
        <HStack>
            <Text>
                At current DBR APR, staking X INV is required to have a free loan.
            </Text>
            <Text>
                {preciseCommify(invNeeded, 2)} INV
            </Text>
        </HStack>
    </VStack>
};