import { useState } from 'react'
import { FormControl, FormLabel, VStack } from '@chakra-ui/react'
import { Input } from '@inverse/components/common/Input'
import { AddressAutocomplete } from '@inverse/components/common/Input/AddressAutocomplete'
import ScannerLink from '@inverse/components/common/ScannerLink'
import { isAddress } from 'ethers/lib/utils'
import { useEffect } from 'react';
import { AutocompleteItem, NetworkIds, TemplateProposalFormActionFields } from '@inverse/types'
import { parseUnits } from '@ethersproject/units';
import { getNetworkConfigConstants } from '@inverse/config/networks';
import { shortenAddress } from '@inverse/util'
import { shortenNumber } from '@inverse/util/markets'

const { DOLA, TOKENS, DOLA_PAYROLL } = getNetworkConfigConstants(NetworkIds.mainnet);
const dolaToken = TOKENS[DOLA];

export const DolaPayrollTemplate = ({
    type,
    defaultAddress = '',
    defaultAmount = '',
    onDisabledChange,
    onActionChange,
}: {
    type: 'add' | 'remove',
    defaultAddress?: string,
    defaultAmount?: string,
    onDisabledChange: (v: boolean) => void
    onActionChange: (action: TemplateProposalFormActionFields | undefined) => void
}) => {
    const [destination, setDestination] = useState(defaultAddress);
    const [amount, setAmount] = useState(defaultAmount);
    const [action, setAction] = useState<TemplateProposalFormActionFields | undefined>(undefined);
    const [isDisabled, setIsDisabled] = useState(true);
    const isAddCase = type === 'add';

    useEffect(() => {
        onDisabledChange(isDisabled)
    }, [isDisabled])

    useEffect(() => {
        onActionChange(action)
    }, [action])

    useEffect(() => {
        const disabled = ((!amount || amount === '0') && isAddCase) || !destination || !isAddress(destination)
        setIsDisabled(disabled)
        if (disabled) { return }
        const args: any[] = [{ type: 'address', value: destination, name: 'recipient' }]
        if (isAddCase) {
            args.push({ type: 'uint256', value: parseUnits(amount, dolaToken.decimals), name: '_yearlyAmount' });
        }
        const action: TemplateProposalFormActionFields = {
            contractAddress: DOLA_PAYROLL,
            func: `${type}Recipient(address recipient${isAddCase && ',uint256 _yearlyAmount'})`,
            args,
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
                    Recipient Address :
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
            {
                isAddCase && <FormControl>
                    <FormLabel>
                        Yearly Amount in <b>{dolaToken.symbol}</b> : {amount && shortenNumber(parseFloat(amount), 2, true)}
                    </FormLabel>
                    <Input type="number" min="0" defaultValue={defaultAmount} onChange={handleAmountChange} />
                </FormControl>
            }
        </VStack>
    )
}