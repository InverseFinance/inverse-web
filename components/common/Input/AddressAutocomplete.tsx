import { getNetworkConfigConstants } from '@app/util/networks';
import { NetworkIds, AddressAutocompleteProps } from '@app/types';
import { isAddress } from 'ethers/lib/utils';
import { Input } from '.';
import { Autocomplete } from './Autocomplete';

const defaultInputComp = Input;

export const AddressAutocomplete = ({
    onItemSelect,
    defaultValue,
    InputComp = defaultInputComp,
    title = 'Known Addresses :',
    placeholder = '0x... or select an item from the list',
    list,
    ...props
}: AddressAutocompleteProps) => {
    const { NAMED_ADDRESSES } = getNetworkConfigConstants(NetworkIds.mainnet)

    const addressesList = list || Object.entries(NAMED_ADDRESSES)
        .map(([ad, name]) => ({ value: ad, label: name }));

    return (
        <Autocomplete
            onItemSelect={onItemSelect}
            defaultValue={defaultValue}
            InputComp={(p) => <InputComp isInvalid={!!defaultValue && !isAddress(defaultValue)} {...p} />}
            list={addressesList}
            title={title}
            placeholder={placeholder}
            {...props}
        />
    )
}