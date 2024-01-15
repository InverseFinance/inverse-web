import Link from "@app/components/common/Link"
import { InfoMessage } from "@app/components/common/Messages"
import { useDBRPrice } from "@app/hooks/useDBR"
import { useStakedDola } from "@app/util/dola-staking"
import { preciseCommify } from "@app/util/misc"
import { ExternalLinkIcon } from "@chakra-ui/icons"
import { HStack, SkeletonText, Stack, Text, VStack } from "@chakra-ui/react"

const TextLoader = () => <SkeletonText pt="2" skeletonHeight={2} noOfLines={1} height={'24px'} width={'90px'} />;

export const StakeDolaInfos = () => {
    const { priceUsd: dbrPrice, priceDola: dbrDolaPrice } = useDBRPrice();
    const { totalSupply, yearlyRewardBudget, maxYearlyRewardBudget, maxRewardPerDolaMantissa, weeklyRevenue, pastWeekRevenue, isLoading } = useStakedDola(dbrDolaPrice);
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
                        {isLoading ? <TextLoader /> : <Text fontWeight="bold">{preciseCommify(totalSupply, 2)}</Text>}
                    </HStack>
                    <HStack w='full'>
                        <Text>- Past's week revenues from auctions:</Text>
                        {isLoading ? <TextLoader /> : <Text fontWeight="bold">{preciseCommify(pastWeekRevenue, 2)} DOLA</Text>}
                    </HStack>
                    <HStack w='full'>
                        <Text>- Current week's revenues from auctions:</Text>
                        {isLoading ? <TextLoader /> : <Text fontWeight="bold">{preciseCommify(weeklyRevenue, 2)} DOLA</Text>}
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