import { useState } from 'react'
import { FormControl, FormLabel, VStack } from '@chakra-ui/react'
import { AddressAutocomplete } from '@inverse/components/common/Input/AddressAutocomplete'
import ScannerLink from '@inverse/components/common/ScannerLink'
import { isAddress, parseUnits } from 'ethers/lib/utils'
import { useEffect } from 'react';
import { AutocompleteItem, NetworkIds, TemplateProposalFormActionFields, ProposalTemplates } from '@inverse/types'
import { getNetworkConfigConstants } from '@inverse/config/networks';
import { Input } from '@inverse/components/common/Input'

const { COMPTROLLER, CONTRACTS } = getNetworkConfigConstants(NetworkIds.mainnet)

const anchorContractsList = Object.entries(CONTRACTS)
    .filter(([address, label]) => label.startsWith('an'))
    .map(([address, label]) => {
        return { value: address, label }
    })

const FUNCTIONS = {
    [ProposalTemplates.anchorCollateralFactor]: '_setCollateralFactor',
}

const LABELS = {
    [ProposalTemplates.anchorCollateralFactor]: 'Set Collateral Factor',
}

export const AnchorPercTemplate = ({
    defaultAddress = '',
    defaultValue = '',
    type,
    onDisabledChange,
    onActionChange,
}: {
    defaultAddress?: string,
    defaultValue?: string,
    type: ProposalTemplates.anchorCollateralFactor,
    onDisabledChange: (v: boolean) => void
    onActionChange: (action: TemplateProposalFormActionFields | undefined) => void
}) => {
    const [address, setAddress] = useState(defaultAddress);
    const [value, setValue] = useState(defaultValue);
    const [action, setAction] = useState<TemplateProposalFormActionFields | undefined>(undefined);
    const [isDisabled, setIsDisabled] = useState(true);

    const functionName = FUNCTIONS[type]

    useEffect(() => {
        onDisabledChange(isDisabled)
    }, [isDisabled])

    useEffect(() => {
        onActionChange(action)
    }, [action])

    useEffect(() => {
        const disabled = !value || !address || !isAddress(address)
        setIsDisabled(disabled)
        if (disabled) { return }

        const percentage = parseFloat(value) / 100
        const bnFactor = parseUnits(percentage.toString()).toString()

        const action: TemplateProposalFormActionFields = {
            contractAddress: COMPTROLLER,
            func: `${functionName}(address cToken,uint256 value)`,
            args: [
                { type: 'address', value: address, name: 'cToken' },
                { type: 'uint256', value: bnFactor, name: 'value' },
            ],
            value: '0',
        }
        setAction(action)
    }, [value, address])

    const handleValueChange = (e: any) => {
        setValue(e.target.value.replace(',', '.').replace(/[^0-9.]/g, ''))
    }

    const handleAddressChange = (item: AutocompleteItem | undefined) => {
        setAddress(item?.value || '')
    }

    return (
        <VStack spacing="4">
            <FormControl>
                <FormLabel>
                    Anchor Market :
                    {
                        defaultAddress && isAddress(defaultAddress) ?
                            <ScannerLink value={defaultAddress} shorten={true} /> : null
                    }
                </FormLabel>
                <AddressAutocomplete
                    title="Available Anchor Markets : "
                    list={anchorContractsList}
                    defaultValue={defaultAddress}
                    onItemSelect={handleAddressChange}
                />
            </FormControl>
            <FormControl>
                <FormLabel>
                    {LABELS[type]} % for this market ? :
                </FormLabel>
                <Input placeholder="Example: 60" type="number" min="0" max="100" defaultValue={defaultValue} onChange={handleValueChange} />
            </FormControl>
        </VStack>
    )
}