import { UnderlyingItem } from "@app/components/common/Assets/UnderlyingItem";
import { RSubmitButton } from "@app/components/common/Button/RSubmitButton"
import { InfoMessage } from "@app/components/common/Messages";
import { F2Market } from "@app/types";
import { shortenNumber } from "@app/util/markets";
import { preciseCommify } from "@app/util/misc"
import { TOKENS, getToken } from "@app/variables/tokens";
import { HStack, VStack, Text, Stack } from "@chakra-ui/react"
import { DbrExtraClaimButtons } from "./DbrExtraClaimButtons";
import { FEATURE_FLAGS } from "@app/config/features";

export const ZapperTokens = ({
    claimables,
    totalRewardsUSD,
    handleClaim,
    onSuccess,
    market,
    showMarketBtn = false,
}: {
    claimables: any,
    totalRewardsUSD: number,
    market: F2Market,
    showMarketBtn?: boolean,
    handleClaim: () => void,
    onSuccess?: () => void,
}) => {
    const showClaimButtons = (totalRewardsUSD > 0.1 || !!claimables.find(c => !c.price && c.balance > 0));
    const isUnknownPricing = !claimables.find(c => !!c.price);// 0 asset with known price (in case ref price source is down)
    return <VStack spacing='4' w='full' alignItems="flex-start">
        <Stack spacing={{ base: '2', xl: '8' }} direction={{ base: 'column', xl: 'row' }}>
            <HStack>
                <Text whiteSpace='nowrap' fontSize="18px" fontWeight="bold">Total Rewards:</Text>
                {
                    !isUnknownPricing && <Text color="success" fontWeight="extrabold" fontSize="20px">
                        {preciseCommify(totalRewardsUSD, 2, true)}
                    </Text>
                }
            </HStack>
            {
                showClaimButtons && <RSubmitButton
                    // disabled={!totalRewardsUSD}
                    fontSize='16px'
                    onClick={() => handleClaim()}
                    onSuccess={onSuccess}
                >
                    Claim rewards
                </RSubmitButton>
            }
            {
                showClaimButtons && market.isInv && claimables?.length > 0 && FEATURE_FLAGS.firmDbrRewardsHelper
                    && <DbrExtraClaimButtons dbrRewardsInfo={claimables[0]} onSuccess={onSuccess} />
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
                            {
                                !!t.price && <Text color='mainTextColorLight' fontSize='14px'>
                                    {shortenNumber(t.price, 4, true)}
                                </Text>
                            }
                        </VStack>
                        <VStack spacing="1" alignItems="flex-end">
                            <Text fontSize='14px'>{shortenNumber(t.balance, 2)}</Text>
                            {
                                !!t.price && <Text color="success" fontWeight="extrabold" fontSize='14px'>{preciseCommify(t.balanceUSD, 2, true)}</Text>
                            }
                        </VStack>
                    </HStack>
                })
            }
        </Stack>
        {
            isUnknownPricing && <InfoMessage description="Note: could not fetch the market price of some assets" />
        }
    </VStack>
}