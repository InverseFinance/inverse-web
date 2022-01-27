import { useState } from 'react';
import { Modal } from '@app/components/common/Modal';
import { Stack, Text } from '@chakra-ui/react';
import { SubmitButton } from '@app/components/common/Button';
import { useRouter } from 'next/dist/client/router';
import { useEffect } from 'react';
import { isAddress } from 'ethers/lib/utils';
import { InfoMessage } from '@app/components/common/Messages';
import { AddressAutocomplete } from '@app/components/common/Input/AddressAutocomplete';
import { AutocompleteItem } from '@app/types';
import { useTopDelegates } from '@app/hooks/useDelegates';
import { namedAddress } from '@app/util';
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