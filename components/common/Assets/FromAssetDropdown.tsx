import { Stack, Text, Flex, Image, FlexProps } from '@chakra-ui/react';
import { ChevronDownIcon } from '@chakra-ui/icons';
import { TokenList, Token, BigNumberList } from '@app/types';
import { AssetsDropdown } from './AssetsDropdown';
import { getBnToNumber, shortenNumber } from '@app/util/markets';

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
    dropdownSelectedProps?: FlexProps,
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
    dropdownSelectedProps,
}: FromAssetDropDownProps) => {
    const list = options.map(ad => {
        const optKey = ad||'CHAIN_COIN';
        const t = { ...tokens[optKey], optKey };
        const bal = balances && t && (balances[t.address||'CHAIN_COIN'] || balances[optKey]);
        return { ...t, balance: !!bal ? getBnToNumber(bal, t.decimals) : 0 }
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
                        <Image ignoreFallback={true} alt={asset.symbol} w={5} h={5} src={asset.image} />
                        {
                            !!asset.protocolImage && <Image borderRadius="20px" position="absolute" right="-5px" bottom="0" ignoreFallback={true} alt="protocol" w={3} h={3} src={asset.protocolImage} />
                        }
                    </Flex>
                    <Flex minW="80px" fontSize="lg" alignItems="center" fontWeight="semibold" color="secondaryTextColor" justify="space-between" {...dropdownSelectedProps}>
                        {asset.symbol} <ChevronDownIcon boxSize={6} mt={0.5} />
                    </Flex>
                </>
            }
        >
            {list.map((token: Token & { optKey: string, balance: number }) => {
                return (
                    <Flex
                        key={token.optKey}
                        p={2}
                        justify="space-between"
                        borderRadius={8}
                        _hover={{ bgColor: 'primary.850' }}
                        onClick={() => handleChange(token.optKey, 'CHAIN_COIN')}
                        cursor="pointer"
                    >
                        <Stack direction="row" align="center">
                            <Flex w={5} position="relative">
                                <Image w={5} h={5} src={token.image} alt={token.symbol} />
                                {
                                    !!token.protocolImage && <Image borderRadius="20px" position="absolute" right="-5px" bottom="0" ignoreFallback={true} alt="protocol" w={3} h={3} src={token.protocolImage} />
                                }
                            </Flex>
                            <Flex fontWeight="semibold" align="center" color="secondaryTextColor">
                                {token.symbol}
                            </Flex>
                        </Stack>
                        <Text fontWeight="semibold" color="secondaryTextColor">
                            {shortenNumber((token.balance||0), 2, false, true)}
                        </Text>
                    </Flex>
                )
            })}
        </AssetsDropdown>
    )
}