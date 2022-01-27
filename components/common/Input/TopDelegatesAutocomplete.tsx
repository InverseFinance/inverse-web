import { AddressAutocompleteProps, AutocompleteItem } from '@app/types';
import { isAddress } from 'ethers/lib/utils';
import { AddressAutocomplete } from './AddressAutocomplete';
import { useEffect, useState } from 'react';
import { useTopDelegates } from '@app/hooks/useDelegates';
import { namedAddress } from '@app/util';
import { Text, Flex } from '@chakra-ui/react';
import { Avatar } from '@app/components/common/Avatar';

export const TopDelegatesAutocomplete = ({
    onItemSelect,
    defaultValue = '',
    title = 'Top Delegates',
    placeholder = 'Paste an Address or Choose an example from the list',
    limit = 50,
}: AddressAutocompleteProps) => {
    const [address, setAddress] = useState<string>(defaultValue);
    const [addressList, setAddressList] = useState<AutocompleteItem[]>([]);
    const { delegates } = useTopDelegates();

    useEffect(() => {
        if (!delegates || !delegates.length || addressList.length) { return }

        setAddressList(
            delegates
                .slice(0, limit)
                .map((d, i) => ({
                    value: d.address,
                    label: `#${(i + 1).toString().padStart(2, '0')} ${namedAddress(d.address)}`,
                }))
        )
    }, [delegates, addressList])

    return (
        <AddressAutocomplete
            title={!addressList.length ? 'Loading...' : title}
            autoSort={false}
            defaultValue={address}
            placeholder={placeholder}
            list={addressList}
            inputProps={{ isInvalid: !!address && !isAddress(address) }}
            onItemSelect={(item?: AutocompleteItem) => {
                setAddress(item?.value || '')
                onItemSelect(item);
            }}
            itemRenderer={(value, label) => (
                <Flex alignItems="center">
                    <Avatar address={value} sizePx={20} />
                    <Text ml="2">
                        {label}
                    </Text>
                </Flex>
            )}
        />
    )
}