import { useState } from 'react';
import { FormControl, FormLabel } from '@chakra-ui/react';
import { ProposalInput } from './ProposalInput';
import { isAddress } from 'ethers/lib/utils';
import { AddressAutocomplete } from '@inverse/components/common/Input/AddressAutocomplete';

export const ProposalFormFuncArg = ({
    type,
    name,
    index,
    defaultValue,
    onChange,
}: {
    type: string,
    name: string,
    index: number,
    defaultValue: any,
    onChange: (e: any, index: number) => void,
}) => {
    const [value, setValue] = useState(defaultValue || '');

    const inputType = type.includes('int') ? 'number' : 'string';
    const min = type.includes('uint') ? '0' : undefined;
    const label = name || `Argument #${index + 1}`;

    const handleChange = (eventOrValue: any, index: number) => {
        onChange(eventOrValue, index);
        setValue(eventOrValue?.target?.value || eventOrValue);
    }

    return (
        <FormControl mt="2">
            <FormLabel fontSize="12">{label} ({type})</FormLabel>
            {
                type === 'address' ?
                    <AddressAutocomplete
                        defaultValue={value}
                        InputComp={(p) => <ProposalInput py="1" isInvalid={!!value && !isAddress(value)} {...p} />}
                        onItemSelect={(item) => handleChange(item?.value, index)}
                    />
                    :
                    <ProposalInput
                        py="1"
                        type={inputType}
                        min={min}
                        defaultValue={value}
                        placeholder="Argument data"
                        onChange={(e: any) => handleChange(e, index)}
                    />
            }
        </FormControl>
    )
}