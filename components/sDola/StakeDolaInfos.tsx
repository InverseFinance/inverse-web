import Link from "@app/components/common/Link"
import { InfoMessage } from "@app/components/common/Messages"
import { ONE_DAY_MS } from "@app/config/constants"
import { useDBRPrice } from "@app/hooks/useDBR"
import useEtherSWR from "@app/hooks/useEtherSWR"
import { useDOLAPrice } from "@app/hooks/usePrices"
import { DOLA_SAVINGS_ADDRESS } from "@app/util/dola-staking"
import { getBnToNumber } from "@app/util/markets"
import { preciseCommify } from "@app/util/misc"
import { ExternalLinkIcon } from "@chakra-ui/icons"
import { HStack, SkeletonText, Stack, Text, VStack } from "@chakra-ui/react"

const TextLoader = () => <SkeletonText pt="2" skeletonHeight={2} noOfLines={1} height={'24px'} width={'90px'} />;

const useStakedDola = (): {
    totalSupply: number;
    yearlyRewardBudget: number;
    maxYearlyRewardBudget: number;
    maxRewardPerDolaMantissa: number;
    weeklyRevenue: number;
    pastWeekRevenue: number;
    isLoading: boolean;
    hasError: boolean;
} => {
    const { data: totalSupply, error } = useEtherSWR(
        [DOLA_SAVINGS_ADDRESS, 'totalSupply']
    );
    const { data: yearlyRewardBudget, error: yearlyRewardBudgetErr } = useEtherSWR(
        [DOLA_SAVINGS_ADDRESS, 'yearlyRewardBudget']
    );
    const { data: maxYearlyRewardBudget, error: maxYearlyRewardBudgetErr } = useEtherSWR(
        [DOLA_SAVINGS_ADDRESS, 'maxYearlyRewardBudget']
    );
    const { data: maxRewardPerDolaMantissa, error: maxRewardPerDolaMantissaErr } = useEtherSWR(
        [DOLA_SAVINGS_ADDRESS, 'maxRewardPerDolaMantissa']
    );
    const d = new Date();
    const weekIndexUtc = Math.floor(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0) / (ONE_DAY_MS * 7));
    const { data: weeklyRevenueData, error: weeklyRevenueErr } = useEtherSWR(
        [DOLA_SAVINGS_ADDRESS, 'weeklyRevenue', weekIndexUtc]
    );
    const { data: pastWeekRevenueData, error: pastWeekRevenueErr } = useEtherSWR(
        [DOLA_SAVINGS_ADDRESS, 'weeklyRevenue', weekIndexUtc - 1]
    );
    return {
        totalSupply: totalSupply ? getBnToNumber(totalSupply) : 0,
        yearlyRewardBudget: yearlyRewardBudget ? getBnToNumber(yearlyRewardBudget) : 0,
        maxYearlyRewardBudget: maxYearlyRewardBudget ? getBnToNumber(maxYearlyRewardBudget) : 0,
        maxRewardPerDolaMantissa: maxRewardPerDolaMantissa ? getBnToNumber(maxRewardPerDolaMantissa) : 0,
        weeklyRevenue: weeklyRevenueData ? getBnToNumber(weeklyRevenueData) : 0,
        pastWeekRevenue: pastWeekRevenueData ? getBnToNumber(pastWeekRevenueData) : 0,
        isLoading: (!totalSupply && !error) || (!yearlyRewardBudget && !yearlyRewardBudgetErr) || (!maxYearlyRewardBudget && !maxYearlyRewardBudgetErr),
        hasError: !!error || !!yearlyRewardBudgetErr || !!maxYearlyRewardBudgetErr,
    }
}

export const StakeDolaInfos = () => {
    const { totalSupply, yearlyRewardBudget, maxYearlyRewardBudget, maxRewardPerDolaMantissa, weeklyRevenue, pastWeekRevenue, isLoading } = useStakedDola();
    const { priceUsd: dbrPrice } = useDBRPrice();
    const { price: dolaPrice } = useDOLAPrice();
    return <InfoMessage
        showIcon={false}
        alertProps={{ fontSize: '12px', mb: '8' }}
        description={
            <Stack>
                <Text fontSize="14px" fontWeight="bold">What is sDOLA?</Text>
                <VStack spacing="0" alignItems="flex-start">
                    <Text>- sDOLA is staked DOLA</Text>
                    <Text>
                        - It uses the ERC4626 standard (Tokenized Vault Token)
                    </Text>
                    <Text>- It's a decentralized yield-bearing asset</Text>
                    <Text>- The yield comes from DBR auctions</Text>
                    <Link textDecoration="underline" href='https://docs.inverse.finance' isExternal target="_blank">
                        Learn more about sDOLA <ExternalLinkIcon />
                    </Link>
                </VStack>
                <Text fontSize="14px" fontWeight="bold">sDOLA stats</Text>
                <VStack w='full' spacing="0" alignItems="flex-start">
                    <HStack w='full'>
                        <Text>- Total supply:</Text>
                        {isLoading ? <TextLoader /> : <Text fontWeight="bold">{preciseCommify(totalSupply, 0)}</Text>}
                    </HStack>
                    <HStack w='full'>
                        <Text>- Weekly revenues from auctions:</Text>
                        {isLoading ? <TextLoader /> : <Text fontWeight="bold">{preciseCommify(weeklyRevenue, 0)} DOLA</Text>}
                    </HStack>
                    <Link textDecoration="underline" href='https://docs.inverse.finance/dbr/auction' isExternal target="_blank">
                        Go to auctions <ExternalLinkIcon />
                    </Link>
                </VStack>
                <Text fontSize="14px" fontWeight="bold">sDOLA Parameters</Text>
                <VStack w='full' spacing="0">
                    <HStack w='full'>
                        <Text>- DBR rate per year:</Text>
                        {isLoading ? <TextLoader /> : <Text fontWeight="bold">{preciseCommify(yearlyRewardBudget, 0)} ({preciseCommify(yearlyRewardBudget * dbrPrice, 0, true)})</Text>}
                    </HStack>
                    <HStack w='full'>
                        <Text>- Max. DBR rate per year:</Text>
                        {isLoading ? <TextLoader /> : <Text fontWeight="bold">{preciseCommify(maxYearlyRewardBudget, 0)} ({preciseCommify(maxYearlyRewardBudget * dbrPrice, 0, true)})</Text>}
                    </HStack>
                    <HStack w='full'>
                        <Text>- Max. DBR per DOLA:</Text>
                        {isLoading ? <TextLoader /> : <Text fontWeight="bold">{preciseCommify(maxRewardPerDolaMantissa, 2)} ({preciseCommify(maxRewardPerDolaMantissa * dbrPrice, 2, true)})</Text>}
                    </HStack>
                </VStack>
            </Stack>
        }
    />
}