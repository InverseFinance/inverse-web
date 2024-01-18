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
                    <Text>- DSA is a DOLA staking contract</Text>
                    <Text>
                        - It yields claimable DBR rewards
                    </Text>
                    <Text>- The yield comes from an annual budget</Text>
                    <Text>- There is no lock period</Text>
                    <Link textDecoration="underline" href='https://docs.inverse.finance' isExternal target="_blank">
                        Learn more about DSA <ExternalLinkIcon />
                    </Link>
                </VStack>
                <Text fontSize="14px" fontWeight="bold">DSA stats & Parameters</Text>
                <VStack w='full' spacing="0" alignItems="flex-start">
                    <HStack w='full'>
                        <Text>- Total staked in DSA:</Text>
                        {isLoading ? <TextLoader /> : <Text fontWeight="bold">{preciseCommify(savingsTotalSupply, 2)}</Text>}
                    </HStack>
                    <HStack w='full'>
                        <Text>- DBR annual budget for DSA:</Text>
                        {isLoading ? <TextLoader /> : <Text fontWeight="bold">{preciseCommify(savingsYearlyBudget, 0)} ({preciseCommify(savingsYearlyBudget * dbrPrice, 0, true)})</Text>}
                    </HStack>
                    <HStack w='full'>
                        <Text>- Max. annual budget set by Governance:</Text>
                        {isLoading ? <TextLoader /> : <Text fontWeight="bold">{preciseCommify(maxYearlyRewardBudget, 0)} ({preciseCommify(maxYearlyRewardBudget * dbrPrice, 0, true)})</Text>}
                    </HStack>
                    <HStack w='full'>
                        <Text>- Max. DBR reward per DOLA:</Text>
                        {isLoading ? <TextLoader /> : <Text fontWeight="bold">{preciseCommify(maxRewardPerDolaMantissa, 2)} ({preciseCommify(maxRewardPerDolaMantissa * dbrPrice, 4, true)})</Text>}
                    </HStack>
                </VStack>
                <Text fontSize="14px" fontWeight="bold">Looking for sDOLA?</Text>
                <VStack w='full' spacing="0" alignItems="flex-start">
                    <Text>sDOLA is a Tokenized Vault Token while DSA is a simple staking contract.</Text>
                    <Link textDecoration="underline" href='/sdola' isExternal target="_blank">
                        Go to sDOLA <ExternalLinkIcon />
                    </Link>
                </VStack>
            </Stack>
        }
    />
}