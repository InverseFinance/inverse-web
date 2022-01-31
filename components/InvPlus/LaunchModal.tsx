import { Modal } from '@app/components/common/Modal';
import { Stack, Text } from '@chakra-ui/react';
import { SubmitButton } from '@app/components/common/Button';
import { LaunchAnim } from '@app/components/common/Animation';
import { useRouter } from 'next/router';

export type ModalProps = {
    isOpen: boolean
    onClose: () => void
}

const InvPlusLaunchModal = ({ onClose, isOpen }: ModalProps) => {
    const router = useRouter()
    
    const handleLearnMore = () => {
        onClose();
        router.push('/inv');
    }

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
                <SubmitButton onClick={handleLearnMore}>
                    Learn More about INV+
                </SubmitButton>
            }
        >
            <Stack p={'5'} minH={150} overflowY="auto">
                <Text>Content Here, will show once, in preview site shows each time</Text>
            </Stack>
        </Modal>
    )
}

export default InvPlusLaunchModal;