import { Modal } from '@inverse/components/common/Modal';
import { Stack, Text, UnorderedList, ListItem } from '@chakra-ui/react';
import { WarningIcon } from '@chakra-ui/icons'
import { getSupportedNetworks } from '@inverse/config/networks';

export type WrongNetworkModalProps = {
    isOpen: boolean
    onClose: () => void
}

const WrongNetworkModal = ({ onClose, isOpen }: WrongNetworkModalProps) => {

    const networkListItems = getSupportedNetworks()
        .map((network) => {
            return <ListItem key={network.id}>{network.label}</ListItem>
        })

    return (
        <Modal
            onClose={onClose}
            isOpen={isOpen}
            header={
                <Stack minWidth={24} direction="row" align="center" >
                    <WarningIcon mr="2" />
                    <Text>Unsupported Network</Text>
                </Stack>
            }
        >
            <Stack p={'5'} height={150} overflowY="auto">
                <Text>Please switch to a supported Network :</Text>
                <UnorderedList pl="10">
                    {networkListItems}
                </UnorderedList>
            </Stack>
        </Modal>
    )
}

export default WrongNetworkModal;