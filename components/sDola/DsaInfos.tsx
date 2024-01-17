import Link from "@app/components/common/Link"
import { InfoMessage } from "@app/components/common/Messages"
import { useDBRPrice } from "@app/hooks/useDBR"
import { useStakedDola } from "@app/util/dola-staking"
import { preciseCommify } from "@app/util/misc"
import { ExternalLinkIcon } from "@chakra-ui/icons"
import { HStack, SkeletonText, Stack, Text, VStack } from "@chakra-ui/react"

const TextLoader = () => <SkeletonText pt="2" skeletonHeight={2} noOfLines={1} height={'24px'} width={'90px'} />;

export const DsaInfos = () => {
    const { priceUsd: dbrPrice, priceDola: dbrDolaPrice } = useDBRPrice();
    const { savingsTotalSupply, savingsYearlyBudget, maxYearlyRewardBudget, maxRewardPerDolaMantissa, isLoading } = useStakedDola(dbrDolaPrice);
    return <InfoMessage
        showIcon={false}
        alertProps={{ fontSize: '12px', mb: '8' }}
        description={
            <Stack>
                <Text fontSize="14px" fontWeight="bold">What is the DOLA Savings Account?</Text>
                <VStack spacing="0" alignItems="flex-start">
                    <Text>The DOLA Savings Account (DSA) is staking contract for DOLA that yields <b>claimable DBR rewards</b>, the yield comes from an annual DBR budget.</Text>
                    <Link textDecoration="underline" href='https://docs.inverse.finance' isExternal target="_blank">
                        Learn more about DSA <ExternalLinkIcon />
                    </Link>
                </VStack>
                <Text fontSize="14px" fontWeight="bold">DSA stats & Parameters</Text>
                <VStack w='full' spacing="0" alignItems="flex-start">
                    <HStack w='full'>
                        <Text>- Total supply:</Text>
                        {isLoading ? <TextLoader /> : <Text fontWeight="bold">{preciseCommify(savingsTotalSupply, 2)}</Text>}
                    </HStack>
                    <HStack w='full'>
                        <Text>- DBR rate per year:</Text>
                        {isLoading ? <TextLoader /> : <Text fontWeight="bold">{preciseCommify(savingsYearlyBudget, 0)} ({preciseCommify(savingsYearlyBudget * dbrPrice, 0, true)})</Text>}
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