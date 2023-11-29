import Link from "@app/components/common/Link"
import { InfoMessage } from "@app/components/common/Messages"
import useEtherSWR from "@app/hooks/useEtherSWR"
import { DBR_AUCTION_ADDRESS } from "@app/util/dbr-auction"
import { getBnToNumber } from "@app/util/markets"
import { preciseCommify } from "@app/util/misc"
import { ExternalLinkIcon } from "@chakra-ui/icons"
import { HStack, SkeletonText, Stack, Text, VStack } from "@chakra-ui/react"

const TextLoader = () => <SkeletonText pt="2" skeletonHeight={2} noOfLines={1} height={'24px'} width={'90px'} />;

const useDbrAuction = (): {
    dolaReserve: number;
    dbrReserve: number;
    dbrRatePerYear: number;
    maxDbrRatePerYear: number;
    isLoading: boolean;
    hasError: boolean;
} => {
    const { data: reserves, error } = useEtherSWR(
        [DBR_AUCTION_ADDRESS, 'getCurrentReserves']
    );
    const { data: dbrRate, error: dbrRateError } = useEtherSWR(
        [DBR_AUCTION_ADDRESS, 'dbrRatePerYear']
    );
    const { data: maxDbrRate, error: maxDbrRateError } = useEtherSWR(
        [DBR_AUCTION_ADDRESS, 'maxDbrRatePerYear']
    );
    return {
        dolaReserve: reserves ? getBnToNumber(reserves._dolaReserve) : 0,
        dbrReserve: reserves ? getBnToNumber(reserves._dbrReserve) : 0,
        dbrRatePerYear: reserves ? getBnToNumber(dbrRate) : 0,
        maxDbrRatePerYear: reserves ? getBnToNumber(maxDbrRate) : 0,
        isLoading: (!reserves && !error) || (!dbrRate && !dbrRateError) || (!maxDbrRate && !maxDbrRateError),
        hasError: !!error || !!dbrRateError || !!maxDbrRateError,
    }
}

export const DbrAuctionInfos = () => {
    const { dolaReserve, dbrReserve, dbrRatePerYear, maxDbrRatePerYear, isLoading } = useDbrAuction();
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
                    <Text>- DBR can be bought to borrow or speculate on interest rates!</Text>
                </VStack>
                <Link textDecoration="underline" href='https://docs.inverse.finance/inverse-finance/inverse-finance/product-guide/tokens/dbr' isExternal target="_blank">
                    Learn more about DBR <ExternalLinkIcon />
                </Link>
                <Text fontSize="14px" fontWeight="bold">Auction Current Reserves</Text>
                <VStack w='full' spacing="0">
                    <HStack w='full'>
                        <Text>- DOLA reserves:</Text>
                        {isLoading ? <TextLoader /> : <Text fontWeight="bold">{preciseCommify(dolaReserve, 0)}</Text>}
                    </HStack>
                    <HStack w='full'>
                        <Text>- DBR reserves:</Text>
                        {isLoading ? <TextLoader /> : <Text fontWeight="bold">{preciseCommify(dbrReserve, 0)}</Text>}
                    </HStack>
                </VStack>
                <Text fontSize="14px" fontWeight="bold">Auction Contract Parameters</Text>
                <VStack w='full' spacing="0">
                    <HStack w='full'>
                        <Text>- DBR rate per year:</Text>
                        {isLoading ? <TextLoader /> : <Text fontWeight="bold">{preciseCommify(dbrRatePerYear, 0)}</Text>}
                    </HStack>
                    <HStack w='full'>
                        <Text>- Max. DBR rate per year:</Text>
                        {isLoading ? <TextLoader /> : <Text fontWeight="bold">{preciseCommify(maxDbrRatePerYear, 0)}</Text>}
                    </HStack>
                </VStack>
            </Stack>
        }
    />
}