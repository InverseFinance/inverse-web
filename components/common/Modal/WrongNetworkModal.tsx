import { Modal } from '@app/components/common/Modal';
import { Stack, Text, UnorderedList, ListItem } from '@chakra-ui/react';
import { WarningIcon } from '@chakra-ui/icons'
import { getSupportedNetworks } from '@app/util/networks';
import { switchWalletNetwork } from '@app/util/web3';
import { NetworkButton } from '@app/components/common/Button';
import { CHAIN_ID } from '@app/config/constants';

export type WrongNetworkModalProps = {
    isOpen: boolean
    onClose: () => void
}

const WrongNetworkModal = ({ onClose, isOpen }: WrongNetworkModalProps) => {

    const networkListItems = getSupportedNetworks()
        .filter(n => !n.isTestnet || CHAIN_ID === '5')
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
                    <WarningIcon color="warning" mr="2" />
                    <Text>Unsupported Network</Text>
                </Stack>
            }
        >
            <Stack p={'5'} minH={150} overflowY="auto">
                <Text>Please switch to a supported Network :</Text>
                <UnorderedList pl="10" pt="2" spacing="2">
                    {networkListItems}
                </UnorderedList>
            </Stack>
        </Modal>
    )
}

export default WrongNetworkModal;