import Link from "@app/components/common/Link"
import { InfoMessage } from "@app/components/common/Messages"
import { ONE_DAY_MS, SECONDS_PER_BLOCK } from "@app/config/constants"
import { useDBRPrice } from "@app/hooks/useDBR"
import { useStakedDola } from "@app/util/dola-staking"
import { useStakedJDola } from "@app/util/junior"
import { shortenNumber } from "@app/util/markets"
import { preciseCommify } from "@app/util/misc"
import { ExternalLinkIcon } from "@chakra-ui/icons"
import { HStack, SkeletonText, Stack, Text, VStack, useInterval } from "@chakra-ui/react"
import { useEffect, useState } from "react"

const TextLoader = () => <SkeletonText pt="2" skeletonHeight={2} noOfLines={1} height={'24px'} width={'90px'} />;

const STAKE_BAL_INC_INTERVAL = 100;
const MS_PER_BLOCK = SECONDS_PER_BLOCK * 1000;

export const StakeJDolaInfos = ({
    sDolaExRate = 1
}: {
    sDolaExRate: number;
}) => {
    const { priceUsd: dbrPrice, priceDola: dbrDolaPrice } = useDBRPrice();
    const { apy, jDolaSupply, jDolaTotalAssets, yearlyRewardBudget, maxYearlyRewardBudget, maxRewardPerDolaMantissa, weeklyRevenue, pastWeekRevenue, yearlyDbrEarnings, isLoading } = useStakedJDola(dbrPrice);
    const [previousSupply, setPreviousSupply] = useState(jDolaSupply);    
    const [realTimeBalance, setRealTimeBalance] = useState(0);

    useInterval(() => {            
        const curr = (realTimeBalance);
        const incPerInterval = ((curr * (apy / 100)) * (STAKE_BAL_INC_INTERVAL/(ONE_DAY_MS * 365)));
        const neo = curr + incPerInterval;        
        setRealTimeBalance(neo);
    }, STAKE_BAL_INC_INTERVAL);

    // every ~12s recheck base balance
    useInterval(() => {
        if(realTimeBalance > jDolaTotalAssets) return;
        setRealTimeBalance(jDolaTotalAssets);        
    }, MS_PER_BLOCK);

    useEffect(() => {
        if(previousSupply === jDolaSupply) return;        
        setRealTimeBalance(jDolaTotalAssets);
        setPreviousSupply(jDolaSupply);
    }, [jDolaSupply, previousSupply, jDolaTotalAssets]);    

    useEffect(() => {
        if(realTimeBalance > jDolaTotalAssets) return;        
        setRealTimeBalance(jDolaTotalAssets);
    }, [realTimeBalance, jDolaTotalAssets]);

    return <InfoMessage
        showIcon={false}
        alertProps={{ fontSize: '12px', mb: '8', w: 'full', maxW: '470px' }}
        description={
            <Stack w='full'>
                <Text fontSize="14px" fontWeight="bold">What is jrDOLA?</Text>
                <VStack spacing="0" alignItems="flex-start">
                    <Text>- jrDOLA is a liquid yield-bearing vault</Text>
                    <Text>
                        - It uses the ERC4626 standard (Tokenized Vault Token)
                    </Text>
                    <Text>- It's not a stablecoin</Text>
                    <Text>- The yield comes from DBR auctions</Text>
                    <Link textDecoration="underline" href='https://docs.inverse.finance/inverse-finance/inverse-finance/product-guide/tokens/jdola' isExternal target="_blank">
                        Learn more about jrDOLA <ExternalLinkIcon />
                    </Link>                    
                </VStack>
                <Text fontSize="14px" fontWeight="bold">jrDOLA stats</Text>
                <VStack w='full' spacing="0" alignItems="flex-start">
                    <HStack w='full'>
                        <Text>- Total sDOLA staked in jrDOLA:</Text>
                        {isLoading ? <TextLoader /> : <Text fontWeight="bold">{preciseCommify(realTimeBalance, 4)} ({shortenNumber(sDolaExRate * realTimeBalance, 2)} DOLA)</Text>}
                    </HStack>
                    <HStack w='full'>
                        <Text>- Past's week revenues from auctions:</Text>
                        {isLoading ? <TextLoader /> : <Text fontWeight="bold">{preciseCommify(pastWeekRevenue, 2)} ({shortenNumber(pastWeekRevenue * sDolaExRate, 2)} DOLA)</Text>}
                    </HStack>
                    <HStack w='full'>
                        <Text>- Current week's revenues from auctions:</Text>
                        {isLoading ? <TextLoader /> : <Text fontWeight="bold">{preciseCommify(weeklyRevenue, 2)} ({shortenNumber(weeklyRevenue * sDolaExRate, 2)} DOLA)</Text>}
                    </HStack>
                </VStack>
                <Text fontSize="14px" fontWeight="bold">jrDOLA Parameters</Text>
                <VStack w='full' spacing="0">
                    <HStack w='full'>
                        <Text>- Yearly budget:</Text>
                        {isLoading ? <TextLoader /> : <Text fontWeight="bold">{preciseCommify(yearlyRewardBudget, 0)} ({preciseCommify(yearlyRewardBudget * dbrPrice, 0, true)})</Text>}
                    </HStack>
                    <HStack w='full'>
                        <Text>- Max. DBR rate per year:</Text>
                        {isLoading ? <TextLoader /> : <Text fontWeight="bold">{preciseCommify(maxYearlyRewardBudget, 0)} ({preciseCommify(maxYearlyRewardBudget * dbrPrice, 0, true)})</Text>}
                    </HStack>
                    <HStack w='full'>
                        <Text>- Max. DBR per sDOLA:</Text>
                        {isLoading ? <TextLoader /> : <Text fontWeight="bold">{preciseCommify(maxRewardPerDolaMantissa, 2)} ({preciseCommify(maxRewardPerDolaMantissa * dbrPrice, 4, true)})</Text>}
                    </HStack>
                    <HStack w='full'>
                        <Text>- Current effective DBR rate per year:</Text>
                        {isLoading ? <TextLoader /> : <Text fontWeight="bold">{preciseCommify(yearlyDbrEarnings, 0)} ({preciseCommify(yearlyDbrEarnings * dbrPrice, 0, true)})</Text>}
                    </HStack>
                </VStack>
                <Text fontSize="14px" fontWeight="bold">Looking for the jrDOLA auction?</Text>
                <Link textDecoration="underline" href='/dbr/auction'>
                    Go to auctions
                </Link>
            </Stack>
        }
    />
}