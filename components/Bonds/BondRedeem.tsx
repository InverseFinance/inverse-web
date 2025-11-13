import { Bond } from '@app/types'
import { shortenNumber } from '@app/util/markets'
import { Flex, HStack, Stack, Text } from '@chakra-ui/react'
import { SubmitButton } from '@app/components/common/Button'
import { useWeb3React } from '@app/util/wallet';
import { Web3Provider } from '@ethersproject/providers';
import { bondRedeem } from '@app/util/contracts';
import { TimeIcon } from '@chakra-ui/icons';

export const BondRedeem = ({ bond }: { bond: Bond }) => {
    const { provider, account } = useWeb3React<Web3Provider>();

    const handleClaim = () => {
        if (!provider?.getSigner() || !account) { return }
        return bondRedeem(bond, provider?.getSigner(), account)
    }

    return (
        <Stack w='full' opacity={bond.userInfos.payout > 0 ? 1 : 0.5}>
            <HStack w='full' justify="space-between">
                <Flex>
                    <Text mr="1">Remaining to claim:</Text> 
                    <Text fontWeight="extrabold">{bond.userInfos.payout > 0 ? shortenNumber(bond.userInfos.payout, 4) : '-'}</Text>
                </Flex>
                <Flex fontWeight="extrabold" color={bond.userInfos.percentVestedFor > 0 ? 'secondary' : 'mainTextColor'} alignItems="center">
                    <TimeIcon mr="1" />
                    <Text color={bond.userInfos.percentVestedFor > 0 ? 'secondary' : 'mainTextColor'}>
                        Vesting progress: {bond.userInfos.percentVestedFor > 0 ? shortenNumber(bond.userInfos.percentVestedFor, 2)+"%" : '-'}
                    </Text>
                </Flex>
            </HStack>
            <HStack w='full' justify="space-between">
                <Flex>
                    <Text mr="1">Claimable now:</Text> 
                    <Text fontWeight="extrabold">{bond.userInfos.pendingPayoutFor ? shortenNumber(bond.userInfos.pendingPayoutFor, 4) : '-'}</Text>
                </Flex>
                <SubmitButton isDisabled={bond.userInfos.pendingPayoutFor <= 0} w="120px" onClick={handleClaim} refreshOnSuccess={true}>
                    Claim
                </SubmitButton>
            </HStack>
        </Stack>
    )
}