import { Stack, Text, Flex, Image } from '@chakra-ui/react';
import { ChevronDownIcon } from '@chakra-ui/icons';
import { TokenList, Token, VaultTree } from '@inverse/types';
import { useAccountBalances } from '@inverse/hooks/useBalances';
import { formatUnits } from 'ethers/lib/utils';
import { AssetsDropdown } from './AssetsDropdown';

type FromAssetDropDownProps = {
    tokens: TokenList,
    vaultTree: VaultTree,
    isOpen: boolean,
    onClose: () => void,
    onOpen: () => void,
    asset: Token,
    options: string[],
    handleChange: (from: string, to: string) => void,
}

export const FromAssetDropdown = ({ tokens, vaultTree, isOpen, onClose, onOpen, asset, options, handleChange }: FromAssetDropDownProps) => {
    const { balances } = useAccountBalances()

    return (
        <AssetsDropdown
            isOpen={isOpen}
            onClose={onClose}
            onOpen={onOpen}
            noPadding
            label={
                <>
                    <Flex w={5}>
                        <Image w={5} h={5} src={asset.image} />
                    </Flex>
                    <Flex fontSize="lg" fontWeight="semibold" color="purple.100" align="center">
                        {asset.symbol} <ChevronDownIcon boxSize={6} mt={0.5} />
                    </Flex>
                </>
            }
        >
            {options.map((from: string) => {
                const fromToken = tokens[from]
                const toToken = tokens[Object.keys(vaultTree[from])[0]]

                return (
                    <Flex
                        key={from}
                        p={2}
                        justify="space-between"
                        borderRadius={8}
                        _hover={{ bgColor: 'purple.850' }}
                        onClick={() => handleChange(from, toToken.address || 'ETH')}
                        cursor="pointer"
                    >
                        <Stack direction="row" align="center">
                            <Flex w={5}>
                                <Image w={5} h={5} src={fromToken.image} />
                            </Flex>
                            <Flex fontWeight="semibold" align="center" color="purple.100">
                                {fromToken.symbol}
                            </Flex>
                        </Stack>
                        <Text fontWeight="semibold" color="purple.100">
                            {balances ? parseFloat(formatUnits(balances[fromToken.address], fromToken.decimals)).toFixed(2) : '0.00'}
                        </Text>
                    </Flex>
                )
            })}
        </AssetsDropdown>
    )
}