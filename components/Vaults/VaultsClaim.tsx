import { Stack, Text, Flex, Image } from '@chakra-ui/react';
import { Token, Vaults } from '@inverse/types';
import { useWeb3React } from '@web3-react/core';
import { useVaultRates, useVaultRewards } from '@inverse/hooks/useVaults';
import { timeSince } from '@inverse/util/time';
import { ChevronRightIcon } from '@chakra-ui/icons';
import { getVaultContract } from '@inverse/util/contracts';
import { Web3Provider } from '@ethersproject/providers';
import { StyledButton } from '@inverse/components/common/Button';
import { formatBalance } from '@inverse/util/web3';

export const VaultsClaim = ({ vaults }: { vaults: Vaults }) => {
    const { library } = useWeb3React<Web3Provider>()
    const { lastDistribution } = useVaultRates()
    const { rewards } = useVaultRewards()

    return (
        <Stack>
            <Stack direction="row" justify="center" spacing={1}>
                <Text fontSize="xs" color="purple.200" fontWeight="semibold">
                    Last Distribution
                </Text>
                <Text fontSize="xs" fontWeight="semibold">
                    {timeSince(lastDistribution)}
                </Text>
            </Stack>
            {Object.entries(vaults).map(([address, vault]: [string, { from: Token; to: Token }]) => (
                <Stack key={address} direction="row" align="center" justify="space-between" p={2}>
                    <Stack direction="row" align="center" display={{ base: 'none', sm: 'flex' }}>
                        <Stack direction="row" align="center" w={20} justify="flex-start">
                            <Flex w={5}>
                                <Image w={5} h={5} src={vault.from.image} />
                            </Flex>
                            <Text fontWeight="semibold" color="purple.100">
                                {vault.from.symbol}
                            </Text>
                        </Stack>
                        <ChevronRightIcon boxSize={6} />
                        <Stack direction="row" align="center" w={20}>
                            <Flex w={5}>
                                <Image w={5} h={5} src={vault.to.image} />
                            </Flex>
                            <Text fontWeight="semibold" color="purple.100">
                                {vault.to.symbol}
                            </Text>
                        </Stack>
                    </Stack>
                    <Stack
                        w="full"
                        direction="row"
                        align="center"
                        justify={{ base: 'space-between', sm: 'flex-end' }}
                        spacing={4}
                    >
                        <Flex fontWeight="semibold">
                            {
                                rewards ?
                                    formatBalance(rewards[address], vault.to.decimals, vault.to.symbol)
                                    : 0
                            }
                        </Flex>
                        <StyledButton
                            onClick={() =>
                                vault.to.address
                                    ? getVaultContract(address, library?.getSigner()).claim()
                                    : getVaultContract(address, library?.getSigner()).claimETH()
                            }
                        >
                            Claim
                        </StyledButton>
                    </Stack>
                </Stack>
            ))}
        </Stack>
    )
}