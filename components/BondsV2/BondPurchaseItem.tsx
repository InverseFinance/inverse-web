import { UserBondV2 } from '@app/types';
import { shortenNumber } from '@app/util/markets';
import { Stack, Flex, Text, VStack, HStack } from '@chakra-ui/react';
import { SubmitButton } from '@app/components/common/Button';
import { UnderlyingItem } from '@app/components/common/Assets/UnderlyingItem';
import { useWeb3React } from '@app/util/wallet';
import { CheckCircleIcon, TimeIcon } from '@chakra-ui/icons';
import { Timestamp } from '../common/BlockTimestamp/Timestamp';
import { NotifBadge } from '../common/NotifBadge';

export const BondPurchaseItem = ({ bond, bondIndex, handleDetails }: { bond: UserBondV2, bondIndex: number, handleDetails: (i: number) => void }) => {
    const { account } = useWeb3React();
    return (
        <Stack
            borderTop={{ base: bondIndex > 0 ? `1px solid #cccccc33` : 'none', sm: `1px solid #cccccc33` }}
            pt={{ base: bondIndex > 0 ? '2' : '0', sm: '2' }}
            direction="row" w='full' justify="space-between" fontWeight="bold">
            <Flex w="200px" alignItems="center" position="relative">
                {/* <Link textTransform="uppercase" textDecoration="none" isExternal href={bond.howToGetLink}> */}
                <VStack alignItems="flex-start" textTransform="uppercase">
                    {/* <UnderlyingItem Container={HStack} label={bond.underlying.symbol} imgSize={18} image={bond.underlying.image} protocolImage={bond.underlying.protocolImage}
                        imgContainerProps={{ mr: '1' }}
                    /> */}
                    <Text>{bond.name}</Text>
                    <Text maxW={{ base: "80px", sm: '200px' }} fontSize={{ base: '10px', sm: "14px" }} color="secondaryTextColor">{bond.vestingDays} days vesting</Text>
                </VStack>
                {/* </Link> */}
            </Flex>
            <Flex w="170px" alignItems="center" fontSize="14px">
                <Timestamp timestamp={bond.purchaseDate} format='MMM Do, hh:mm a' />
            </Flex>
            <Flex w="150px" alignItems="center">
                <Flex w="150px" alignItems="center" fontSize="14px">
                    <Timestamp timestamp={bond.expiry} format='MMM Do, hh:mm a' />
                </Flex>
            </Flex>
            <Flex w="80px" alignItems="center">
                {bond.payout ? shortenNumber(bond.payout, 2) : '-'}
            </Flex>
            <HStack spacing="1" w='100px' position="relative" alignItems="center" justify="center">
                {
                    bond.supply > 0 ?
                        <Flex position="relative">
                            <SubmitButton disabled={bond.percentVestedFor < 100} w='full' onClick={() => handleDetails(bondIndex)} disabled={!account}>
                                Redeem
                            </SubmitButton>
                            <NotifBadge display="flex" alignItems="center" fontSize="10px">
                                <TimeIcon fontSize="12px" color="mainTextColor" mr="1" />
                                <Text>{shortenNumber(bond.percentVestedFor, 2)}%</Text>
                            </NotifBadge>
                        </Flex>
                        :
                        <>
                            <CheckCircleIcon fontSize="12px" color="secondary" />
                            <Text fontSize="16px">Redeemed</Text>
                        </>
                }
            </HStack>
        </Stack>
    )
}