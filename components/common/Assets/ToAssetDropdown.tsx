import { Stack, Flex, Image, Text } from '@chakra-ui/react';
import { ChevronDownIcon } from '@chakra-ui/icons';
import { useVaultRates } from '@app/hooks/useVaults';
import { TokenList, Token } from '@app/types';
import { AssetsDropdown } from './AssetsDropdown';

type ToAssetDropDownProps = {
    tokens: TokenList,
    isOpen: boolean,
    onClose: () => void,
    onOpen: () => void,
    asset: Token,
    options: [string, string][],
    handleChange: (to: string) => void,
}

export const ToAssetDropdown = ({ tokens, isOpen, onClose, onOpen, asset, options, handleChange }: ToAssetDropDownProps) => {
    const { rates } = useVaultRates()

    return (
        <AssetsDropdown
            isOpen={isOpen}
            onClose={onClose}
            onOpen={onOpen}
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
            {options.map(([to, vault]: [string, string]) => {
                const toToken = tokens[to]

                return (
                    <Flex
                        key={to}
                        p={2}
                        justify="space-between"
                        borderRadius={8}
                        _hover={{ bgColor: 'purple.850' }}
                        onClick={() => handleChange(to)}
                        cursor="pointer"
                    >
                        <Stack direction="row" align="center">
                            <Flex w={5}>
                                <Image w={5} h={5} src={toToken.image} />
                            </Flex>
                            <Flex fontWeight="semibold" align="center" color="purple.100">
                                {toToken.symbol}
                            </Flex>
                        </Stack>
                        <Text fontWeight="semibold" color="purple.100">
                            {`${(rates ? rates[vault] : 0).toFixed(2)}% APY`}
                        </Text>
                    </Flex>
                )
            })}
        </AssetsDropdown>
    )
}