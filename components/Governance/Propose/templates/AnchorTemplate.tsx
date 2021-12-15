import { ReactNode } from 'react'
import { FormControl, FormLabel, VStack } from '@chakra-ui/react'
import { AddressAutocomplete } from '@inverse/components/common/Input/AddressAutocomplete'
import ScannerLink from '@inverse/components/common/ScannerLink'
import { isAddress } from 'ethers/lib/utils'
import { AutocompleteItem, NetworkIds  } from '@inverse/types'
import { getNetworkConfigConstants } from '@inverse/config/networks';

const { CONTRACTS } = getNetworkConfigConstants(NetworkIds.mainnet)

const anchorContractsList = Object.entries(CONTRACTS)
    .filter(([address, label]) => label.startsWith('an'))
    .map(([address, label]) => {
        return { value: address, label }
    })

export const AnchorTemplate = ({
    defaultAddress = '',
    children,
    onMarketChange,
}: {
    defaultAddress?: string,
    children: ReactNode,
    onMarketChange: (v: string) => void,
}) => {
    const handleAddressChange = (item: AutocompleteItem | undefined) => {
        const newAddress = item?.value || ''
        onMarketChange(newAddress)
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
            {children}
        </VStack>
    )
}