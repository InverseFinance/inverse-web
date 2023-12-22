import Link from "@app/components/common/Link"
import { InfoMessage } from "@app/components/common/Messages"
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
    return {
        totalSupply: totalSupply ? getBnToNumber(totalSupply) : 0,
        yearlyRewardBudget: yearlyRewardBudget ? getBnToNumber(yearlyRewardBudget) : 0,
        maxYearlyRewardBudget: maxYearlyRewardBudget ? getBnToNumber(maxYearlyRewardBudget) : 0,        
        maxRewardPerDolaMantissa: maxRewardPerDolaMantissa ? getBnToNumber(maxRewardPerDolaMantissa) : 0,        
        isLoading: (!totalSupply && !error) || (!yearlyRewardBudget && !yearlyRewardBudgetErr) || (!maxYearlyRewardBudget && !maxYearlyRewardBudgetErr),
        hasError: !!error || !!yearlyRewardBudgetErr || !!maxYearlyRewardBudgetErr,
    }
}

export const StakeDolaInfos = () => {
    const { totalSupply, yearlyRewardBudget, maxYearlyRewardBudget, maxRewardPerDolaMantissa, isLoading } = useStakedDola();
    const { priceUsd: dbrPrice } = useDBRPrice();
    const { price: dolaPrice } = useDOLAPrice();
    return <InfoMessage
        showIcon={false}
        alertProps={{ fontSize: '12px', mb: '8' }}
        description={
            <Stack>
                <Text fontSize="14px" fontWeight="bold">What is DBR?</Text>
                <VStack spacing="0" alignItems="flex-start">
                    <Text>
                        - DBR is the DOLA Borrowing Right token
                    </Text>
                    <Text>- One DBR allows to borrow one DOLA for one year</Text>
                    <Text>- It's also the reward token for INV stakers on FiRM</Text>
                    <Text>- DBR can be bought to borrow or hedge against interest rates!</Text>
                </VStack>
                <Link textDecoration="underline" href='https://docs.inverse.finance/inverse-finance/inverse-finance/product-guide/tokens/dbr' isExternal target="_blank">
                    Learn more about DBR <ExternalLinkIcon />
                </Link>
                <Text fontSize="14px" fontWeight="bold">sDOLA stats</Text>
                <VStack w='full' spacing="0">
                    <HStack w='full'>
                        <Text>- Total supply:</Text>
                        {isLoading ? <TextLoader /> : <Text fontWeight="bold">{preciseCommify(totalSupply, 0)}</Text>}
                    </HStack>
                    <HStack w='full'>
                        <Text>- Weekly revenues:</Text>
                        {/* {isLoading ? <TextLoader /> : <Text fontWeight="bold">{preciseCommify(dbrReserve, 0)} ({preciseCommify(dbrReserve * dbrPrice, 0, true)})</Text>} */}
                    </HStack>
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
                        {isLoading ? <TextLoader /> : <Text fontWeight="bold">{preciseCommify(maxRewardPerDolaMantissa, 0)} ({preciseCommify(maxRewardPerDolaMantissa * dbrPrice, 0, true)})</Text>}
                    </HStack>                    
                </VStack>
                <Text fontSize="14px" fontWeight="bold">Where does the yield come from?</Text>                
                <Text>The yield comes from DBR issuance which is related to DOLA borrowing, the more people borrow DOLA on FiRM, the more DBR can be issued</Text>
            </Stack>
        }
    />
}