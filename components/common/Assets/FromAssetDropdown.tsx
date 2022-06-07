import { Stack, Text, Flex, Image } from '@chakra-ui/react';
import { ChevronDownIcon } from '@chakra-ui/icons';
import { TokenList, Token, BigNumberList } from '@app/types';
import { formatUnits } from 'ethers/lib/utils';
import { AssetsDropdown } from './AssetsDropdown';
import { getBnToNumber } from '@app/util/markets';

type FromAssetDropDownProps = {
    tokens: TokenList,
    balances: BigNumberList,
    isOpen: boolean,
    onClose: () => void,
    onOpen: () => void,
    asset: Token,
    options: string[],
    handleChange: (from: string, to: string) => void,
    orderByBalance?: boolean,
}

export const FromAssetDropdown = ({
    tokens,
    balances,
    isOpen,
    onClose,
    onOpen,
    asset,
    options,
    handleChange,
    orderByBalance = false,
}: FromAssetDropDownProps) => {

    const list = options.map(ad => {
        const t = tokens[ad||'CHAIN_COIN'];
        const bal = balances && t && balances[t.address||'CHAIN_COIN'];
        return { ...t, balance: !!bal ? getBnToNumber(balances[t.address||'CHAIN_COIN'], t.decimals) : 0 }
    }).filter(t => !!t.symbol)

    if(orderByBalance) {
        list.sort((a, b) => b.balance - a.balance);
    }

    return (
        <AssetsDropdown
            isOpen={isOpen}
            onClose={onClose}
            onOpen={onOpen}
            noPadding
            label={
                <>
                    <Flex w={5} position="relative">
                        <Image ignoreFallback={true} alt="" w={5} h={5} src={asset.image} />
                        {
                            !!asset.protocolImage && <Image borderRadius="20px" position="absolute" right="-5px" bottom="0" ignoreFallback={true} alt="" w={3} h={3} src={asset.protocolImage} />
                        }
                    </Flex>
                    <Flex minW="80px" fontSize="lg" fontWeight="semibold" color="primary.100" justify="space-between">
                        {asset.symbol} <ChevronDownIcon boxSize={6} mt={0.5} />
                    </Flex>
                </>
            }
        >
            {list.map((token: Token) => {
                const adKey = token.address || 'CHAIN_COIN'
                const { symbol } = token
                return (
                    <Flex
                        key={symbol}
                        p={2}
                        justify="space-between"
                        borderRadius={8}
                        _hover={{ bgColor: 'primary.850' }}
                        onClick={() => handleChange(adKey, 'CHAIN_COIN')}
                        cursor="pointer"
                    >
                        <Stack direction="row" align="center">
                            <Flex w={5} position="relative">
                                <Image w={5} h={5} src={token.image} />
                                {
                                    !!token.protocolImage && <Image borderRadius="20px" position="absolute" right="-5px" bottom="0" ignoreFallback={true} alt="" w={3} h={3} src={token.protocolImage} />
                                }
                            </Flex>
                            <Flex fontWeight="semibold" align="center" color="primary.100">
                                {token.symbol}
                            </Flex>
                        </Stack>
                        <Text fontWeight="semibold" color="primary.100">
                            {balances && balances[adKey] ? parseFloat(formatUnits(balances[adKey], token.decimals)).toFixed(2) : '0.00'}
                        </Text>
                    </Flex>
                )
            })}
        </AssetsDropdown>
    )
}