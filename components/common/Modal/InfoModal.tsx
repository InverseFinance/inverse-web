import { Modal } from '@app/components/common/Modal';
import { HStack, Stack, Text } from '@chakra-ui/react';
import { SubmitButton } from '@app/components/common/Button';
import { ReactNode } from 'react';
import { InfoIcon } from '@chakra-ui/icons';

export type Props = {
    title?: string,
    okLabel?: string,
    isOpen: boolean
    onClose: () => void
    onOk?: () => void
    children?: ReactNode
    minW?: any
}

const InfoModal = ({
    title = 'Info',
    isOpen,
    okLabel = 'OK',
    onClose,
    onOk,
    children,
    minW,
}: Props) => {
    const handleOk = () => {
        return onOk ? onOk() : () => {};
    }

    return (
        <Modal
            onClose={onClose}
            isOpen={isOpen}
            scrollBehavior="inside"
            header={
                <Stack minWidth={24} direction="row" align="center" >
                    <InfoIcon mr="2" /><Text>{title}</Text>
                </Stack>
            }
            footer={
                <HStack>
                    <SubmitButton themeColor="blue.500" onClick={handleOk} >{okLabel}</SubmitButton>
                </HStack>
            }
            minW={minW}
            className="blurred-container infoLight-bg"
            bg="transparent"
        >
            {children ? children : <></>}
        </Modal>
    )
}

export default InfoModal;