import { Stack, Flex, useDisclosure, InputProps, FlexProps } from '@chakra-ui/react'
import { BalanceInput } from '@app/components/common/Input'
import { useState, useEffect } from 'react'
import { FromAssetDropdown } from '@app/components/common/Assets/FromAssetDropdown'
import { BigNumberList, Token, TokenList } from '@app/types';
import { getParsedBalance } from '@app/util/markets';
import { commify } from 'ethers/lib/utils';

const getMaxBalance = (balances: BigNumberList, token: Token, balanceKey: string) => {
    return getParsedBalance(balances, token[balanceKey] || 'CHAIN_COIN', token.decimals);
}

export const AssetInput = ({
    amount,
    balances,
    token,
    tokens,
    assetOptions,
    onAssetChange,
    onAmountChange,
    showBalance,
    maxValue,
    inputProps,
    showMax = true,
    orderByBalance = false,
    orderByWorth = false,
    balanceKey = 'address',
    dropdownSelectedProps,
    allowMobileMode = false,
    prices,
}: {
    amount: string,
    balances: BigNumberList,
    prices: { [key: string]: number },
    token: Token,
    tokens: TokenList,
    assetOptions: string[],
    onAssetChange: (newToken: Token) => void,
    onAmountChange: (newAmount: string) => void,
    showBalance?: boolean,
    maxValue?: string | number,
    inputProps?: InputProps,
    showMax?: boolean,
    orderByBalance?: boolean,
    orderByWorth?: boolean,
    allowMobileMode?: boolean,
    balanceKey?: string,
    dropdownSelectedProps?: FlexProps
}) => {
    const { isOpen, onOpen, onClose } = useDisclosure()
    const [justClosed, setJustClosed] = useState(isOpen)

    useEffect(() => {
        if (!isOpen) { setJustClosed(true) }
        setTimeout(() => setJustClosed(false), 200)
    }, [isOpen])

    const setAmountToMax = () => {
        onAmountChange(maxValue?.toString() || (Math.floor(getMaxBalance(balances, token, balanceKey) * 1e8) / 1e8).toString())
    }

    return (
        <BalanceInput
            value={amount}
            onChange={(e: React.MouseEvent<HTMLInputElement>) => onAmountChange(e.currentTarget.value.replace(',', '.').replace(/[^0-9.]/g, ''))}
            onMaxClick={setAmountToMax}
            inputProps={{
                fontSize: { base: '12px', sm: '20px' },
                minW: { base: 'full', sm: '280px' },
                ...inputProps,
            }}
            showBalance={showBalance}
            showMax={showMax}
            allowMobileMode={allowMobileMode}
            balance={commify(getMaxBalance(balances, token, balanceKey).toFixed(2))}
            label={
                <Stack direction="row" align="center" p={2} spacing={4} cursor="pointer">
                    {
                        allowMobileMode ? null : <Flex w={0.5} h={8}>
                            <Flex w="full" h="full" bgColor="primary.500" borderRadius={8} />
                        </Flex>
                    }
                    <FromAssetDropdown
                        tokens={tokens}
                        balances={balances}
                        prices={prices}
                        orderByBalance={orderByBalance}
                        orderByWorth={orderByWorth}
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
                </Stack>
            }
        />
    )
}