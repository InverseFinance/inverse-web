import { Bond, UserBondV2 } from '@app/types'
import { shortenNumber } from '@app/util/markets'
import { Divider, Flex, HStack, Stack, Text } from '@chakra-ui/react'
import { SubmitButton } from '@app/components/common/Button'
import { useWeb3React } from '@web3-react/core';
import { Web3Provider } from '@ethersproject/providers';
import { TimeIcon } from '@chakra-ui/icons';
import { Timestamp } from '../common/BlockTimestamp/Timestamp';
import { bondV2Redeem } from '@app/util/bonds';

export const BondV2Redeem = ({ bond }: { bond: UserBondV2 }) => {
    const { library, account } = useWeb3React<Web3Provider>();

    const handleClaim = () => {
        if (!library?.getSigner() || !account) { return }
        return bondV2Redeem(bond, library?.getSigner())
    }

    return (
        <Stack spacing="4" w='full' opacity={bond.payout > 0 ? 1 : 0.5}>
            <HStack w='full' justify="space-between">
                <Text>Purchase Date:</Text>
                <Text>Vesting Date:</Text>
            </HStack>
            <HStack w='full' justify="space-between">
                <Timestamp text1Props={{ fontWeight: 'bold' }} text2Props={{ fontWeight: 'bold' }} timestamp={bond.purchaseDate} format='MMM Do, hh:mm a' />
                <Timestamp alignItems="flex-end" text1Props={{ fontWeight: 'bold' }} text2Props={{ fontWeight: 'bold' }} timestamp={bond.expiry} format='MMM Do, hh:mm a' />
            </HStack>
            <Divider />
            <HStack w='full' justify="space-between">
                <Flex>
                    <Text mr="1">INV to redeem:</Text>
                    <Text fontWeight="extrabold">{bond.payout > 0 ? shortenNumber(bond.payout, 4) : '-'}</Text>
                </Flex>
                <Flex fontWeight="extrabold" color={bond.percentVestedFor > 0 ? 'secondary' : 'mainTextColor'} alignItems="center">
                    <TimeIcon mr="1" />
                    <Text color={bond.percentVestedFor > 0 ? 'secondary' : 'mainTextColor'}>
                        Vesting progress: {bond.percentVestedFor > 0 ? shortenNumber(bond.percentVestedFor, 2) + "%" : '-'}
                    </Text>
                </Flex>
            </HStack>
            <HStack w='full' justify="center">
                {
                    bond.active ?
                        <SubmitButton isDisabled={bond.percentVestedFor < 100 || !bond.active} w="120px" onClick={handleClaim} refreshOnSuccess={true}>
                            Redeem
                        </SubmitButton>
                        : <Text>Redeemed!</Text>
                }
            </HStack>
        </Stack>
    )
}