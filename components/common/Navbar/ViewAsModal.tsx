import { useState } from 'react';
import { Modal } from '@inverse/components/common/Modal';
import { Stack, Text } from '@chakra-ui/react';
import { SubmitButton } from '@inverse/components/common/Button';
import { useRouter } from 'next/dist/client/router';
import { useEffect } from 'react';
import { isAddress } from 'ethers/lib/utils';
import { Input } from '../Input';
import { InfoMessage } from '../Messages';

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
        if (query?.simAddress) { setAddress(query?.simAddress as string) }
    }, [query])

    const handleViewAs = () => {
        window.location.search = '?simAddress='+address
    }

    return (
        <Modal
            onClose={onClose}
            isOpen={isOpen}
            header={
                <Stack minWidth={24} direction="row" align="center" >
                    <Text>View as another Address</Text>
                </Stack>
            }
            footer={
                <SubmitButton disabled={!address || !isAddress(address)} onClick={handleViewAs}>
                    VIEW AS
                </SubmitButton>
            }
        >
            <Stack p={'5'} overflowY="auto">
                <Input fontSize="14px" textAlign="left" placeholder="0x..." value={address} onChange={(e: any) => setAddress(e.target.value)} />
                <InfoMessage description="Consult Inverse Finance through the eyes of another account" />
            </Stack>
        </Modal>
    )
}