import Link from "@app/components/common/Link"
import { InfoMessage } from "@app/components/common/Messages"
import useEtherSWR from "@app/hooks/useEtherSWR"
import { DBR_AUCTION_ADDRESS } from "@app/util/dbr-auction"
import { getBnToNumber } from "@app/util/markets"
import { preciseCommify } from "@app/util/misc"
import { ExternalLinkIcon } from "@chakra-ui/icons"
import { HStack, Stack, Text, VStack } from "@chakra-ui/react"

export const DbrAuctionInfos = () => {
    const { data } = useEtherSWR(
        [DBR_AUCTION_ADDRESS, 'getCurrentReserves']
    );
    const dolaReserve = data ? getBnToNumber(data._dolaReserve) : 0;
    const dbrReserve = data ? getBnToNumber(data._dbrReserve) : 0;
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
                <Text fontSize="14px" fontWeight="bold">Auction Reserves</Text>
                <VStack w='full'>
                    <HStack w='full'>
                        <Text>- DOLA reserves:</Text>
                        <Text fontWeight="bold">{preciseCommify(dolaReserve, 0)}</Text>
                    </HStack>
                    <HStack w='full'>
                        <Text>- DOLA reserves:</Text>
                        <Text fontWeight="bold">{preciseCommify(dbrReserve, 0)}</Text>
                    </HStack>
                </VStack>
            </Stack>
        }
    />
}