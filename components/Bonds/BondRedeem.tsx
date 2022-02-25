import { Bond } from '@app/types'
import { shortenNumber } from '@app/util/markets'
import { Flex, HStack, Stack, Text } from '@chakra-ui/react'
import { SubmitButton } from '@app/components/common/Button'
import { useWeb3React } from '@web3-react/core';
import { Web3Provider } from '@ethersproject/providers';
import { bondRedeem } from '@app/util/contracts';
import { TimeIcon } from '@chakra-ui/icons';

export const BondRedeem = ({ bond }: { bond: Bond }) => {
    const { library, account } = useWeb3React<Web3Provider>();

    const handleClaim = () => {
        if(!library?.getSigner() || !account) { return }
        return bondRedeem(bond, library?.getSigner(), account)
    }

    return (
        <Stack w='full'>
            <HStack w='full' justify="space-between">
                <Text>
                    Remaining to claim: {shortenNumber(bond.userInfos.payout, 4)}
                </Text>
                <Flex color="secondary" alignItems="center">
                    <TimeIcon  mr="1" />
                    <Text color="secondary">Vesting progress: {shortenNumber(bond.userInfos.percentVestedFor, 2)}%</Text>
                </Flex>
            </HStack>
            <HStack w='full' justify="space-between">
                <Text>
                    Claimable now: {shortenNumber(bond.userInfos.pendingPayoutFor, 4)}
                </Text>
                <SubmitButton w="120px" onClick={handleClaim} refreshOnSuccess={true}>
                    Claim
                </SubmitButton>
            </HStack>
        </Stack>
    )
}