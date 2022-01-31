import { Modal } from '@app/components/common/Modal';
import { Stack, Text } from '@chakra-ui/react';
import LinkButton from '@app/components/common/Button';
import { LaunchAnim } from '@app/components/common/Animation';

export type WrongNetworkModalProps = {
    isOpen: boolean
    onClose: () => void
}

const InvPlusLaunchModal = ({ onClose, isOpen }: WrongNetworkModalProps) => {
    return (
        <Modal
            onClose={onClose}
            isOpen={isOpen}
            header={
                <Stack minWidth={24} direction="row" align="center" >
                    <LaunchAnim loop={true} width={50} height={50} />
                    <Text>INV+ is Launched !</Text>
                </Stack>
            }
            footer={
                <LinkButton href="/inv">
                    Learn More about INV+
                </LinkButton>
            }
        >
            <Stack p={'5'} minH={150} overflowY="auto">
                <Text>Content Here</Text>
            </Stack>
        </Modal>
    )
}

export default InvPlusLaunchModal;