import Link from "@app/components/common/Link"
import { InfoMessage } from "@app/components/common/Messages"
import { useDBRPrice } from "@app/hooks/useDBR"
import { useStakedDola } from "@app/util/dola-staking"
import { shortenNumber } from "@app/util/markets"
import { preciseCommify } from "@app/util/misc"
import { ExternalLinkIcon } from "@chakra-ui/icons"
import { HStack, SkeletonText, Stack, Text, VStack } from "@chakra-ui/react"

const TextLoader = () => <SkeletonText pt="2" skeletonHeight={2} noOfLines={1} height={'24px'} width={'90px'} />;

export const DsaInfos = () => {
    const { priceUsd: dbrPrice, priceDola: dbrDolaPrice } = useDBRPrice();
    const { dsaTotalSupply, dsaYearlyBudget, maxYearlyRewardBudget, maxRewardPerDolaMantissa, sDolaDsaShare, dolaBalInDsaFromSDola, dbrRatePerDola, isLoading } = useStakedDola(dbrPrice);
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
                        <Text>- Total DOLA staked in DSA:</Text>
                        {isLoading ? <TextLoader /> : <Text fontWeight="bold">{preciseCommify(dsaTotalSupply, 2)}</Text>}
                    </HStack>
                    <HStack w='full'>
                        <Text>- sDOLA's DSA share:</Text>
                        {isLoading ? <TextLoader /> : <Text fontWeight="bold">{`${preciseCommify(dolaBalInDsaFromSDola, 2)} (${shortenNumber(sDolaDsaShare*100, 2)}%)`}</Text>}
                    </HStack>
                    <HStack w='full'>
                        <Text>- DBR annual budget for DSA:</Text>
                        {isLoading ? <TextLoader /> : <Text fontWeight="bold">{preciseCommify(dsaYearlyBudget, 0)} ({preciseCommify(dsaYearlyBudget * dbrPrice, 0, true)})</Text>}
                    </HStack>
                    <HStack w='full'>
                        <Text>- Max. annual budget set by Governance:</Text>
                        {isLoading ? <TextLoader /> : <Text fontWeight="bold">{preciseCommify(maxYearlyRewardBudget, 0)} ({preciseCommify(maxYearlyRewardBudget * dbrPrice, 0, true)})</Text>}
                    </HStack>
                    <HStack w='full'>
                        <Text>- Max. DBR reward per DOLA:</Text>
                        {isLoading ? <TextLoader /> : <Text fontWeight="bold">{preciseCommify(maxRewardPerDolaMantissa, 2)} ({preciseCommify(maxRewardPerDolaMantissa * dbrPrice, 4, true)})</Text>}
                    </HStack>
                    <HStack w='full'>
                        <Text>- DBR rate per DOLA:</Text>
                        {isLoading ? <TextLoader /> : <Text fontWeight="bold">{preciseCommify(dbrRatePerDola, 2)} ({preciseCommify(dbrRatePerDola * dbrPrice, 4, true)})</Text>}
                    </HStack>
                </VStack>
                <Text fontSize="14px" fontWeight="bold">Looking for DBR auctions?</Text>
                <VStack w='full' spacing="0" alignItems="flex-start">                    
                    <Link textDecoration="underline" href='/dbr/auction'>
                        Go to DBR auctions
                    </Link>
                </VStack>
            </Stack>
        }
    />
}