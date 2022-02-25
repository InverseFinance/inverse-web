import { Bond } from '@app/types'
import { shortenNumber } from '@app/util/markets'
import { HStack, Stack, Text } from '@chakra-ui/react'
import { SubmitButton } from '@app/components/common/Button'
import { useWeb3React } from '@web3-react/core';
import { Web3Provider } from '@ethersproject/providers';
import { bondRedeem } from '@app/util/contracts';

export const BondRedeem = ({ bond }: { bond: Bond }) => {
    const { library, account } = useWeb3React<Web3Provider>();

    const handleClaim = () => {
        if(!library?.getSigner() || !account) { return }
        return bondRedeem(bond, library?.getSigner(), account)
    }

    return (
        <Stack>
            <HStack>
                <Text>
                    Remaining to claim:
                </Text>
                <Text>
                    {shortenNumber(bond.userInfos.payout, 2)}
                </Text>
            </HStack>
            <HStack>
                <SubmitButton onClick={handleClaim} refreshOnSuccess={true}>
                    Claim
                </SubmitButton>
            </HStack>
        </Stack>
    )
}