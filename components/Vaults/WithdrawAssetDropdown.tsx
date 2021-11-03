import { Stack, Text, Flex, Image } from '@chakra-ui/react';
import { Vaults } from '@inverse/types';
import { ChevronRightIcon, ChevronDownIcon } from '@chakra-ui/icons';
import { formatUnits } from 'ethers/lib/utils';
import { useVaultBalances } from '@inverse/hooks/useBalances';
import { AssetsDropdown } from './AssetsDropdown';

type WithdrawAssetDropdownProps = {
    vaults: Vaults,
    isOpen: boolean,
    onClose: () => void,
    onOpen: () => void,
    vault: string,
    handleChange: (vault: string) => void,
}

export const WithdrawAssetDropdown = ({ vaults, isOpen, onClose, onOpen, vault, handleChange }: WithdrawAssetDropdownProps) => {
    const { balances } = useVaultBalances()

    return (
        <AssetsDropdown
            isOpen={isOpen}
            onClose={onClose}
            onOpen={onOpen}
            label={
                <Stack direction="row" align="center" spacing={1}>
                    <Stack direction="row" align="center" justify="flex-end">
                        <Flex w={5}>
                            <Image w={5} h={5} src={vaults[vault].from.image} />
                        </Flex>
                    </Stack>
                    <ChevronRightIcon boxSize={6} />
                    <Stack direction="row" align="center">
                        <Flex w={5}>
                            <Image w={5} h={5} src={vaults[vault].to.image} />
                        </Flex>
                    </Stack>
                    <ChevronDownIcon boxSize={6} mt={0.5} />
                </Stack>
            }
            noPadding
        >
            {Object.entries(balances).map(([vault, balance]: any) => {
                const from = vaults[vault].from
                const to = vaults[vault].to

                return (
                    <Flex
                        key={vault}
                        p={2}
                        justify="space-between"
                        borderRadius={8}
                        _hover={{ bgColor: 'purple.850' }}
                        onClick={() => handleChange(vault)}
                        cursor="pointer"
                    >
                        <Stack direction="row" align="center">
                            <Stack direction="row" align="center" w={20} justify="flex-end">
                                <Flex w={5}>
                                    <Image w={5} h={5} src={from.image} />
                                </Flex>
                                <Text fontWeight="semibold" color="purple.100">
                                    {from.symbol}
                                </Text>
                            </Stack>
                            <ChevronRightIcon boxSize={6} />
                            <Stack direction="row" align="center" w={20}>
                                <Flex w={5}>
                                    <Image w={5} h={5} src={to.image} />
                                </Flex>
                                <Text fontWeight="semibold" color="purple.100">
                                    {to.symbol}
                                </Text>
                            </Stack>
                        </Stack>
                        <Text fontWeight="semibold" color="purple.100">
                            {parseFloat(formatUnits(balance, from.decimals)).toFixed(2)}
                        </Text>
                    </Flex>
                )
            })}
        </AssetsDropdown>
    )
}