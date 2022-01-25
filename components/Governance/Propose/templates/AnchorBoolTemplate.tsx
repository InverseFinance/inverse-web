import { useState } from 'react'
import { FormControl, FormLabel } from '@chakra-ui/react'
import { isAddress } from 'ethers/lib/utils'
import { useEffect } from 'react';
import { NetworkIds, TemplateProposalFormActionFields, ProposalTemplates } from '@app/types'
import { getNetworkConfigConstants } from '@app/util/networks';
import { RadioCardGroup } from '@app/components/common/Input/RadioCardGroup'
import { AnchorTemplate } from './AnchorTemplate';

const { COMPTROLLER } = getNetworkConfigConstants(NetworkIds.mainnet)

const FUNCTIONS = {
    [ProposalTemplates.anchorLending]: '_setMintPaused',
    [ProposalTemplates.anchorBorrowing]: '_setBorrowPaused',
}

const LABELS = {
    [ProposalTemplates.anchorLending]: 'Pause supplying',
    [ProposalTemplates.anchorBorrowing]: 'Pause borrowing',
}

export const AnchorBoolTemplate = ({
    defaultAddress = '',
    defaultValue = '',
    type,
    onDisabledChange,
    onActionChange,
}: {
    defaultAddress?: string,
    defaultValue?: string,
    type: ProposalTemplates.anchorLending | ProposalTemplates.anchorBorrowing,
    onDisabledChange: (v: boolean) => void
    onActionChange: (action: TemplateProposalFormActionFields | undefined) => void
}) => {
    const [address, setAddress] = useState(defaultAddress);
    const [value, setValue] = useState(defaultValue);

    const functionName = FUNCTIONS[type]

    useEffect(() => {
        const disabled = !['true', 'false'].includes(value) || !address || !isAddress(address)
        onDisabledChange(disabled)
        if (disabled) { return }

        const action: TemplateProposalFormActionFields = {
            contractAddress: COMPTROLLER,
            func: `${functionName}(address cToken,bool state)`,
            args: [
                { type: 'address', value: address, name: 'cToken' },
                { type: 'bool', value: value, name: 'state' },
            ],
            value: '0',
        }
        onActionChange(action)
    }, [value, address])

    const handleValueChange = (val: string) => {
        setValue(val)
    }

    const onMarketChange = (newAddress: string) => {
        setAddress(newAddress)
    }

    return (
        <AnchorTemplate onMarketChange={onMarketChange}>
            <FormControl>
                <FormLabel>
                    {LABELS[type]} for this market ? :
                </FormLabel>
                <RadioCardGroup
                    wrapperProps={{ w: 'full', justify: 'center', mt: '4' }}
                    group={{
                        name: 'bool',
                        defaultValue,
                        onChange: handleValueChange,
                    }}
                    radioCardProps={{ w: '80px', textAlign: 'center', p: '1' }}
                    options={[{ label: 'Yes', value: 'true' }, { label: 'No', value: 'false' }]}
                />
            </FormControl>
        </AnchorTemplate>
    )
}