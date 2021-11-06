import { Modal } from '@inverse/components/common/Modal';
import { Stack, Text, UnorderedList, ListItem } from '@chakra-ui/react';
import { WarningIcon } from '@chakra-ui/icons'
import { getSupportedNetworks } from '@inverse/config/networks';
import { switchWalletNetwork } from '../../../util/web3';
import { NetworkButton } from '../Button';

export type WrongNetworkModalProps = {
    isOpen: boolean
    onClose: () => void
}

const WrongNetworkModal = ({ onClose, isOpen }: WrongNetworkModalProps) => {

    const networkListItems = getSupportedNetworks()
        .map((network) => {
            return <ListItem key={network.id}>
                <NetworkButton chainId={network.id} onClick={() => switchWalletNetwork(network.id, onClose)} />
            </ListItem>
        })

    return (
        <Modal
            onClose={onClose}
            isOpen={isOpen}
            header={
                <Stack minWidth={24} direction="row" align="center" >
                    <WarningIcon color="orange.100" mr="2" />
                    <Text>Unsupported Network</Text>
                </Stack>
            }
        >
            <Stack p={'5'} height={150} overflowY="auto">
                <Text>Please switch to a supported Network :</Text>
                <UnorderedList pl="10" pt="2" spacing="2">
                    {networkListItems}
                </UnorderedList>
            </Stack>
        </Modal>
    )
}

export default WrongNetworkModal;