import { useState } from 'react';
import { Modal } from '@inverse/components/common/Modal';
import { Stack, Text } from '@chakra-ui/react';
import { SubmitButton } from '@inverse/components/common/Button';
import { useRouter } from 'next/dist/client/router';
import { useEffect } from 'react';
import { isAddress } from 'ethers/lib/utils';
import { InfoMessage } from '@inverse/components/common/Messages';
import { AddressAutocomplete } from '@inverse/components/common/Input/AddressAutocomplete';
import { AutocompleteItem } from '@inverse/types';
import { useTopDelegates } from '@inverse/hooks/useDelegates';
import { namedAddress } from '@inverse/util';
import { ViewIcon } from '@chakra-ui/icons';
import { TopDelegatesAutocomplete } from '../Input/TopDelegatesAutocomplete';

type Props = {
    isOpen: boolean
    onClose: () => void
}

export const ViewAsModal = ({
    isOpen,
    onClose,
}: Props) => {
    const { query } = useRouter()
    const [address, setAddress] = useState<string>('');

    useEffect(() => {
        if (query?.viewAddress) { setAddress(query?.viewAddress as string) }
    }, [query])

    const handleViewAs = () => {
        window.location.search = '?viewAddress=' + address
    }

    return (
        <Modal
            onClose={onClose}
            isOpen={isOpen}
            scrollBehavior={'outside'}
            header={
                <Stack minWidth={24} direction="row" align="center">
                    <ViewIcon color="blue.600" />
                    <Text>View Address</Text>
                </Stack>
            }
            footer={
                <SubmitButton disabled={!address || !isAddress(address)} onClick={handleViewAs}>
                    VIEW ADDRESS
                </SubmitButton>
            }
        >
            <Stack p={'5'}>
                <TopDelegatesAutocomplete
                    onItemSelect={(item?: AutocompleteItem) => setAddress(item?.value || '')}
                />
                <InfoMessage alertProps={{ fontSize: '14px', w: 'full' }} description="You will be able to view live data for this address" />
            </Stack>
        </Modal>
    )
}