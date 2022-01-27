import { useState } from 'react'
import { FormControl, FormLabel } from '@chakra-ui/react'
import { isAddress } from 'ethers/lib/utils'
import { useEffect } from 'react';
import { NetworkIds, TemplateProposalFormActionFields, ProposalTemplates } from '@app/types'
import { getNetworkConfigConstants } from '@app/util/networks';
import { AnchorTemplate } from './AnchorTemplate';
import { Input } from '@app/components/common/Input';
import { parseUnits } from '@ethersproject/units';

const { COMPTROLLER } = getNetworkConfigConstants(NetworkIds.mainnet)

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

    const functionName = FUNCTIONS[type]

    useEffect(() => {
        const disabled = !value || !address || !isAddress(address)
        onDisabledChange(disabled)
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
        onActionChange(action)
    }, [value, address])

    const handleValueChange = (e: any) => {
        setValue(e.target.value.replace(',', '.').replace(/[^0-9.]/g, ''))
    }

    const onMarketChange = (newAddress: string) => {
        setAddress(newAddress)
    }

    return (
        <AnchorTemplate onMarketChange={onMarketChange}>
            <FormControl>
                <FormLabel>
                    {LABELS[type]} % for this market ? :
                </FormLabel>
                <Input placeholder="Example: 60" type="number" min="0" max="100" value={value} onChange={handleValueChange} />
            </FormControl>
        </AnchorTemplate>
    )
}