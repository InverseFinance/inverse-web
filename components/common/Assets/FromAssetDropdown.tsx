import { Stack, Text, Flex, Image, FlexProps, useDisclosure } from '@chakra-ui/react';
import { ChevronDownIcon } from '@chakra-ui/icons';
import { TokenList, Token, BigNumberList } from '@app/types';
import { AssetsDropdown } from './AssetsDropdown';
import { getBnToNumber, shortenNumber } from '@app/util/markets';
import { ETH_AD } from '@app/components/Base/BaseBridge';
import { useEffect, useMemo, useState } from 'react';
import { STABLE_SYMBOLS_LOWER } from '@app/variables/stables';

type FromAssetDropDownProps = {
    tokens: TokenList,
    balances: BigNumberList,
    prices: { [key: string]: number },
    isOpen: boolean,
    onClose: () => void,
    onOpen: () => void,
    asset: Token,
    options: string[],
    handleChange: (from: string, to: string) => void,
    orderByBalance?: boolean,
    orderByWorth?: boolean,
    orderByStable?: boolean,
    dropdownSelectedProps?: FlexProps,
    withSearch?: boolean,
    noPadding?: boolean,
}

export const FromAssetDropdown = ({
    tokens,
    balances,
    prices,
    isOpen,
    onClose,
    onOpen,
    asset,
    options,
    handleChange,
    orderByStable = false,
    orderByBalance = false,
    orderByWorth = false,
    dropdownSelectedProps,
    withSearch = false,
    noPadding = true,
}: FromAssetDropDownProps) => {
    const [search, setSearch] = useState('');
    const list = useMemo(() => {
        const items = options.map(ad => {
            const optKey = ad || 'CHAIN_COIN';
            const t = { ...tokens[optKey], optKey };
            const bal = balances && t && (balances[t.address || 'CHAIN_COIN'] || balances[optKey]);
            const balanceFloat = !!bal ? getBnToNumber(bal, t.decimals) : 0;
            const priceKey = t.address || 'CHAIN_COIN' || ETH_AD || ETH_AD.toLowerCase();
            const price = prices && (prices[priceKey] || prices[ETH_AD.toLowerCase()]) ? prices[priceKey] || prices[ETH_AD.toLowerCase()] : 0;
            const worth = price * balanceFloat;
            return { ...t, balance: balanceFloat, worth }
        }).filter(t => !!t.symbol && (!search || t.symbol.toLowerCase().includes(search)));

        if (orderByStable) {
            items.sort((a, b) => {
                const aIsStable = STABLE_SYMBOLS_LOWER.includes(a.symbol.toLowerCase());
                const bIsStable = STABLE_SYMBOLS_LOWER.includes(b.symbol.toLowerCase());

                // Sort stablecoins first
                if (aIsStable && !bIsStable) return -1;
                if (!aIsStable && bIsStable) return 1;

                // If both are stable or both are non-stable, sort by worth
                if (a.worth !== b.worth) {
                    return b.worth - a.worth;
                }

                // If worth is the same, sort alphabetically by symbol
                return a.symbol.localeCompare(b.symbol);
            });
        }
        else if (orderByBalance) {
            items.sort((a, b) => b.balance - a.balance || a.symbol.localeCompare(b.symbol));
        } else if (orderByWorth) {
            items.sort((a, b) => b.worth - a.worth || a.symbol.localeCompare(b.symbol));
        }
        return items;
    }, [options, orderByBalance, orderByWorth, orderByStable, tokens, balances, prices, search]);

    return (
        <AssetsDropdown
            isOpen={isOpen}
            onClose={onClose}
            onOpen={onOpen}
            noPadding={noPadding}
            withSearch={withSearch}
            onSearchChange={(e) => {
                const search = e.target.value.toLowerCase();
                setSearch(search);
            }}
            label={
                <>
                    <Flex w={5} position="relative">
                        <Image ignoreFallback={false} alt={asset.symbol} w={5} h={5} src={asset.image} />
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
            {list.map((token: Token & { optKey: string, balance: number, worth: number }) => {
                return (
                    <Flex
                        key={token.optKey}
                        p={2}
                        justify="space-between"
                        borderRadius={8}
                        _hover={{ bgColor: 'primary.850' }}
                        onClick={() => {
                            handleChange(token.optKey, 'CHAIN_COIN')
                            setSearch('');
                        }}
                        cursor="pointer"
                        w='full'
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
                            {shortenNumber((token.balance || 0), 2, false, true)}{token.worth ? ` (${shortenNumber(token.worth, 2, true)})` : ''}
                        </Text>
                    </Flex>
                )
            })}
        </AssetsDropdown>
    )
}


export const AssetDropdown = ({
    balances,
    token,
    tokens,
    assetOptions,
    onAssetChange,
    orderByBalance = false,
    orderByWorth = false,
    dropdownSelectedProps,
    prices,
    orderByStable,
    withSearch = false,
    noPadding,
}: {
    balances: BigNumberList,
    prices: { [key: string]: number },
    token: Token,
    tokens: TokenList,
    assetOptions: string[],
    onAssetChange: (newToken: Token) => void,
    orderByBalance?: boolean,
    orderByWorth?: boolean,
    dropdownSelectedProps?: FlexProps,
    orderByStable?: boolean,
    withSearch?: boolean,
    noPadding?: boolean,
}) => {
    const { isOpen, onOpen, onClose } = useDisclosure()
    const [justClosed, setJustClosed] = useState(isOpen)

    useEffect(() => {
        if (!isOpen) { setJustClosed(true) }
        setTimeout(() => setJustClosed(false), 200)
    }, [isOpen])

    return (
        <FromAssetDropdown
            noPadding={noPadding}
            tokens={tokens}
            balances={balances}
            prices={prices}
            orderByBalance={orderByBalance}
            orderByWorth={orderByWorth}
            orderByStable={orderByStable}
            withSearch={withSearch}
            isOpen={isOpen}
            onClose={onClose}
            onOpen={() => {
                if (!isOpen && !justClosed) { onOpen() }
            }}
            asset={token}
            options={assetOptions}
            dropdownSelectedProps={dropdownSelectedProps}
            handleChange={(selected: string) => {
                onClose()
                onAssetChange(tokens[selected])
            }}
        />
    )
}