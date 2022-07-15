import { useState } from 'react'
import { FormControl, FormLabel, VStack } from '@chakra-ui/react'
import { Input } from '@app/components/common/Input'
import { AddressAutocomplete } from '@app/components/common/Input/AddressAutocomplete'
import ScannerLink from '@app/components/common/ScannerLink'
import { isAddress } from 'ethers/lib/utils'
import { useEffect } from 'react';
import { AutocompleteItem, TemplateProposalFormActionFields, Token } from '@app/types'
import { parseUnits } from '@ethersproject/units';
import { shortenAddress } from '@app/util'

export const TokenTemplate = ({
    defaultAddress = '',
    defaultAmount = '',
    token,
    type,
    onDisabledChange,
    onActionChange,
}: {
    defaultAddress?: string,
    defaultAmount?: string,
    token: Token,
    type: 'approve' | 'transfer',
    onDisabledChange: (v: boolean) => void
    onActionChange: (action: TemplateProposalFormActionFields | undefined) => void
}) => {
    const [destination, setDestination] = useState(defaultAddress);
    const [amount, setAmount] = useState(defaultAmount);
    const [action, setAction] = useState<TemplateProposalFormActionFields | undefined>(undefined);
    const [isDisabled, setIsDisabled] = useState(true);

    useEffect(() => {
        onDisabledChange(isDisabled)
    }, [isDisabled])

    useEffect(() => {
        onActionChange(action)
    }, [action])

    useEffect(() => {
        const disabled = !amount || amount === '0' || !destination || !isAddress(destination)
        setIsDisabled(disabled)
        if (disabled) { return }
        const addressVarName = type === 'transfer' ? 'destination' : 'spender'
        const action: TemplateProposalFormActionFields = {
            contractAddress: token.address,
            func: `${type}(address ${addressVarName},uint256 rawAmount)`,
            args: [
                { type: 'address', value: destination, name: addressVarName },
                { type: 'uint256', value: parseUnits(amount, token.decimals), name: 'rawAmount' },
            ],
            value: '0',
        }
        setAction(action)
    }, [amount, destination])

    const handleAmountChange = (e: any) => {
        setAmount(e.target.value.replace(',', '.').replace(/[^0-9.]/g, ''))
    }

    const handleAddressChange = (item: AutocompleteItem | undefined) => {
        setDestination(item?.value || '')
    }

    return (
        <VStack spacing="4">
            <FormControl>
                <FormLabel>
                    Destination Address :
                    {
                        destination && isAddress(destination) ?
                            <ScannerLink ml="2" value={destination} label={shortenAddress(destination)} /> : null
                    }
                </FormLabel>
                <AddressAutocomplete
                    defaultValue={defaultAddress}
                    onItemSelect={handleAddressChange}
                />
            </FormControl>
            <FormControl>
                <FormLabel>
                    Amount in <b>{token.symbol} to {type}</b>:
                </FormLabel>
                <Input type="number" min="0" defaultValue={defaultAmount} onChange={handleAmountChange} />
            </FormControl>
        </VStack>
    )
}