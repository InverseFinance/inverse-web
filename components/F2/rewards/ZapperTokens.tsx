import { UnderlyingItem } from "@app/components/common/Assets/UnderlyingItem";
import { RSubmitButton } from "@app/components/common/Button/RSubmitButton"
import { F2Market } from "@app/types";
import { shortenNumber } from "@app/util/markets";
import { preciseCommify } from "@app/util/misc"
import { TOKENS, getToken } from "@app/variables/tokens";
import { HStack, VStack, Text, Stack } from "@chakra-ui/react"

export const ZapperTokens = ({
    claimables,
    totalRewardsUSD,
    handleClaim,
    market,
    showMarketBtn = false,
}: {
    claimables: any,
    totalRewardsUSD: number,
    market: F2Market,
    showMarketBtn?: boolean,
    handleClaim: () => void,
}) => {
    return <VStack spacing='4' w='full' alignItems="flex-start">
        <Stack spacing={{ base: '2', sm: '8' }} direction={{ base: 'column', sm: 'row' }}>
            <HStack>
                <Text whiteSpace='nowrap' fontSize="18px" fontWeight="bold">Total Rewards:</Text>
                <Text color="success" fontWeight="extrabold" fontSize="20px">{preciseCommify(totalRewardsUSD, 2, true)}</Text>
            </HStack>
            {
                totalRewardsUSD > 0.1 && <RSubmitButton disabled={!totalRewardsUSD} fontSize='16px' onClick={() => handleClaim()}>
                    Claim rewards
                </RSubmitButton>
            }
        </Stack>
        <Stack spacing="4" w='full' direction={{ base: 'column', sm: 'row' }}>
            {
                claimables?.map((t, i) => {
                    const underlying = getToken(TOKENS, t.address) || {};
                    return <HStack justify='space-between' key={t.address} w={{ base: 'full', sm: 'fit-content' }} border='1px solid #ccc' p='2' borderRadius='5px'>
                        <VStack spacing="1" alignItems="flex-start" w='80px'>
                            <HStack>
                                <UnderlyingItem {...underlying} label={underlying.symbol || t.symbol} textProps={{ fontSize: '14px', fontWeight: 'bold' }} />
                            </HStack>
                            <Text color='mainTextColorLight' fontSize='14px'>{shortenNumber(t.price, 2, true)}</Text>
                        </VStack>
                        <VStack spacing="1" alignItems="flex-end">
                            <Text fontSize='14px'>{shortenNumber(t.balance, 2)}</Text>
                            <Text color="success" fontWeight="extrabold" fontSize='14px'>{preciseCommify(t.balanceUSD, 2, true)}</Text>
                        </VStack>
                    </HStack>
                })
            }
        </Stack>
    </VStack>
}