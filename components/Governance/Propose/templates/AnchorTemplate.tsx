import { ReactNode } from 'react'
import { FormControl, FormLabel, VStack } from '@chakra-ui/react'
import { AddressAutocomplete } from '@inverse/components/common/Input/AddressAutocomplete'
import ScannerLink from '@inverse/components/common/ScannerLink'
import { isAddress } from 'ethers/lib/utils'
import { AutocompleteItem, NetworkIds  } from '@inverse/types'
import { getNetworkConfigConstants } from '@inverse/config/networks';
import { namedAddress } from '@inverse/util'

const { ANCHOR_TOKENS, XINV, XINV_V1 } = getNetworkConfigConstants(NetworkIds.mainnet)

const anchorContractsList = Object.values(ANCHOR_TOKENS)
    .map(address => ({ value: address, label: namedAddress(address) }))
    .concat([{ value: XINV, label: 'xINV' }, { value: XINV_V1, label: 'xINV-v1'  }])

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