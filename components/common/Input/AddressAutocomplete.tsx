import { getNetworkConfigConstants } from '@inverse/config/networks';
import { NetworkIds, AddressAutocompleteProps } from '@inverse/types';
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
}: AddressAutocompleteProps) => {
    const { PROPOSAL_AUTOCOMPLETE_ADDRESSES } = getNetworkConfigConstants(NetworkIds.mainnet)

    const addressesList = list || Object.entries(PROPOSAL_AUTOCOMPLETE_ADDRESSES)
        .map(([ad, name]) => ({ value: ad, label: name }));

    addressesList.sort((a, b) => a.label.toLowerCase() < b.label.toLowerCase() ? -1 : 1)

    return (
        <Autocomplete
            onItemSelect={onItemSelect}
            defaultValue={defaultValue}
            InputComp={(p) => <InputComp isInvalid={!!defaultValue && !isAddress(defaultValue)} {...p} />}
            list={addressesList}
            title={title}
            placeholder={placeholder}
        />
    )
}