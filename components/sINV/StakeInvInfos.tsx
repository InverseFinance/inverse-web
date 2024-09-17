import Link from "@app/components/common/Link"
import { InfoMessage } from "@app/components/common/Messages"
import { ONE_DAY_MS, SECONDS_PER_BLOCK } from "@app/config/constants"
import { useDBRPrice } from "@app/hooks/useDBR"
import { preciseCommify } from "@app/util/misc"
import { useStakedInv } from "@app/util/sINV"
import { ExternalLinkIcon } from "@chakra-ui/icons"
import { HStack, SkeletonText, Stack, Text, VStack, useInterval } from "@chakra-ui/react"
import { useEffect, useState } from "react"

const TextLoader = () => <SkeletonText pt="2" skeletonHeight={2} noOfLines={1} height={'24px'} width={'90px'} />;

const STAKE_BAL_INC_INTERVAL = 100;
const MS_PER_BLOCK = SECONDS_PER_BLOCK * 1000;

export const StakeInvInfos = () => {
    const { priceUsd: dbrPrice, priceDola: dbrDolaPrice } = useDBRPrice();
    const { apy, sInvSupply, sInvTotalAssets, yearlyRewardBudget, maxYearlyRewardBudget, distributorYearlyBudget, periodRevenue, pastPeriodRevenue, yearlyDbrEarnings, sInvDistributorShare, isLoading } = useStakedInv(dbrDolaPrice);
    const [previousSupply, setPreviousSupply] = useState(sInvSupply);
    const [realTimeBalance, setRealTimeBalance] = useState(0);

    useInterval(() => {
        const curr = (realTimeBalance);
        const incPerInterval = ((curr * (apy / 100)) * (STAKE_BAL_INC_INTERVAL / (ONE_DAY_MS * 365)));
        const neo = curr + incPerInterval;
        setRealTimeBalance(neo);
    }, STAKE_BAL_INC_INTERVAL);

    // every ~12s recheck base balance
    useInterval(() => {
        if (realTimeBalance > sInvTotalAssets) return;
        setRealTimeBalance(sInvTotalAssets);
    }, MS_PER_BLOCK);

    useEffect(() => {
        if (previousSupply === sInvSupply) return;
        setRealTimeBalance(sInvTotalAssets);
        setPreviousSupply(sInvSupply);
    }, [sInvSupply, previousSupply, sInvTotalAssets]);

    useEffect(() => {
        if (realTimeBalance > sInvTotalAssets) return;
        setRealTimeBalance(sInvTotalAssets);
    }, [realTimeBalance, sInvTotalAssets]);

    return <InfoMessage
        showIcon={false}
        alertProps={{ fontSize: '12px', mb: '8', w: 'full', maxW: '470px' }}
        description={
            <Stack w='full'>
                <Text fontSize="14px" fontWeight="bold">What is sINV?</Text>
                <VStack spacing="0" alignItems="flex-start">
                    <Text>- sINV is staked INV</Text>
                    <Text>
                        - It uses the ERC4626 standard (Tokenized Vault Token)
                    </Text>
                    <Text>- It's a decentralized yield-bearing fungible asset</Text>
                    <Text>- The yield comes from DBR auctions and INV staking </Text>
                    <Link textDecoration="underline" href='https://x.com/InverseFinance/status/1833555567895310836' isExternal target="_blank">
                        Watch the launch video <ExternalLinkIcon />
                    </Link>
                    <Link textDecoration="underline" href='https://docs.inverse.finance/inverse-finance/inverse-finance/product-guide/tokens/sinv' isExternal target="_blank">
                        Learn more about sINV <ExternalLinkIcon />
                    </Link>
                </VStack>
                <Text fontSize="14px" fontWeight="bold">sINV stats</Text>
                <VStack w='full' spacing="0" alignItems="flex-start">
                    <HStack w='full'>
                        <Text>- Total INV staked in sINV:</Text>
                        {isLoading ? <TextLoader /> : <Text fontWeight="bold">{preciseCommify(realTimeBalance, 4)}</Text>}
                    </HStack>
                    <HStack w='full'>
                        <Text>- Past's week revenues from auctions:</Text>
                        {isLoading ? <TextLoader /> : <Text fontWeight="bold">{preciseCommify(pastPeriodRevenue, 2)} INV</Text>}
                    </HStack>
                    <HStack w='full'>
                        <Text>- Current week's revenues from auctions:</Text>
                        {isLoading ? <TextLoader /> : <Text fontWeight="bold">{preciseCommify(periodRevenue, 2)} INV</Text>}
                    </HStack>
                </VStack>
                <Text fontSize="14px" fontWeight="bold">sINV Parameters</Text>
                <VStack w='full' spacing="0">
                    <HStack w='full'>
                        <Text>- Total DBR rate per year:</Text>
                        {isLoading ? <TextLoader /> : <Text fontWeight="bold">{preciseCommify(distributorYearlyBudget, 0)} ({preciseCommify(distributorYearlyBudget * dbrPrice, 0, true)})</Text>}
                    </HStack>
                    {/* <HStack w='full'>
                        <Text>- sINV's share:</Text>
                        {isLoading ? <TextLoader /> : <Text fontWeight="bold">{sInvDistributorShare*100}%</Text>}
                    </HStack> */}
                    <HStack w='full'>
                        <Text>- Current sINV's DBR rewards yearly share:</Text>
                        {isLoading ? <TextLoader /> : <Text fontWeight="bold">{preciseCommify(yearlyDbrEarnings, 0)} ({preciseCommify(yearlyDbrEarnings * dbrPrice, 0, true)})</Text>}
                    </HStack>
                    <HStack w='full'>
                        <Text>- Max. DBR rate per year:</Text>
                        {isLoading ? <TextLoader /> : <Text fontWeight="bold">{preciseCommify(maxYearlyRewardBudget, 0)} ({preciseCommify(maxYearlyRewardBudget * dbrPrice, 0, true)})</Text>}
                    </HStack>
                    {/* <HStack w='full'>
                        <Text>- Max. DBR per INV:</Text>
                        {isLoading ? <TextLoader /> : <Text fontWeight="bold">{preciseCommify(maxRewardPerDolaMantissa, 2)} ({preciseCommify(maxRewardPerDolaMantissa * dbrPrice, 4, true)})</Text>}
                    </HStack> */}
                </VStack>
            </Stack>
        }
    />
}