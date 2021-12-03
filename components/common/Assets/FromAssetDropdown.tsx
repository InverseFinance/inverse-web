import { Stack, Text, Flex, Image } from '@chakra-ui/react';
import { ChevronDownIcon } from '@chakra-ui/icons';
import { TokenList, Token, VaultTree, BigNumberList } from '@inverse/types';
import { formatUnits } from 'ethers/lib/utils';
import { AssetsDropdown } from './AssetsDropdown';

type FromAssetDropDownProps = {
    tokens: TokenList,
    balances: BigNumberList,
    vaultTree?: VaultTree,
    isOpen: boolean,
    onClose: () => void,
    onOpen: () => void,
    asset: Token,
    options: string[],
    handleChange: (from: string, to: string) => void,
}

export const FromAssetDropdown = ({
    tokens,
    balances,
    vaultTree,
    isOpen,
    onClose,
    onOpen,
    asset,
    options,
    handleChange,
}: FromAssetDropDownProps) => {
    return (
        <AssetsDropdown
            isOpen={isOpen}
            onClose={onClose}
            onOpen={onOpen}
            noPadding
            label={
                <>
                    <Flex w={5}>
                        <Image ignoreFallback={true} alt="" w={5} h={5} src={asset.image} />
                    </Flex>
                    <Flex minW="80px" fontSize="lg" fontWeight="semibold" color="purple.100" justify="space-between">
                        {asset.symbol} <ChevronDownIcon boxSize={6} mt={0.5} />
                    </Flex>
                </>
            }
        >
            {options.map((symbol: string) => {
                const token = tokens[symbol]
                const vaultYieldToken = vaultTree ? tokens[Object.keys(vaultTree[symbol])[0]] : { address: '' }

                return (
                    <Flex
                        key={symbol}
                        p={2}
                        justify="space-between"
                        borderRadius={8}
                        _hover={{ bgColor: 'purple.850' }}
                        onClick={() => handleChange(symbol, vaultYieldToken.address || 'ETH')}
                        cursor="pointer"
                    >
                        <Stack direction="row" align="center">
                            <Flex w={5}>
                                <Image w={5} h={5} src={token.image} />
                            </Flex>
                            <Flex fontWeight="semibold" align="center" color="purple.100">
                                {token.symbol}
                            </Flex>
                        </Stack>
                        <Text fontWeight="semibold" color="purple.100">
                            {balances ? parseFloat(formatUnits(balances[token.address], token.decimals)).toFixed(2) : '0.00'}
                        </Text>
                    </Flex>
                )
            })}
        </AssetsDropdown>
    )
}