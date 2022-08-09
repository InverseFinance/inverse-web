import { Modal } from '@app/components/common/Modal';
import { HStack, Stack, Text, TextareaProps } from '@chakra-ui/react';
import { SubmitButton } from '@app/components/common/Button';
import { ReactNode } from 'react';

export type Props = {
    title?: string,
    label?: string,
    placeholder?: string,
    defaultText?: string,
    okLabel?: string,
    cancelLabel?: string,
    isOpen: boolean
    textAreaProps?: TextareaProps,
    onClose: () => void
    onCancel?: () => void
    onOk?: () => void
    onSuccess?: (t?: any) => any
    children?: ReactNode
}

const ConfirmModal = ({
    title = 'Confirm',
    isOpen,
    okLabel = 'OK',
    cancelLabel = 'Cancel',
    onCancel,
    onClose,
    onSuccess,
    onOk,
    children,
}: Props) => {
    const handleOk = () => {
        return onOk ? onOk() : () => {};
    }

    const handleCancel = () => {
        return onCancel ? onCancel() : () => {};
    }

    const handleSuccess = (result: any) => {
        if(onSuccess) { onSuccess(result) }
        onClose();
    }

    return (
        <Modal
            onClose={onClose}
            isOpen={isOpen}
            header={
                <Stack minWidth={24} direction="row" align="center" >
                    <Text>{title}</Text>
                </Stack>
            }
            footer={
                <HStack>
                    <SubmitButton onClick={handleCancel}>{cancelLabel}</SubmitButton>
                    <SubmitButton refreshOnSuccess={true} onClick={handleOk} onSuccess={handleSuccess}>{okLabel}</SubmitButton>
                </HStack>
            }
        >
            {children ? children : <></>}
        </Modal>
    )
}

export default ConfirmModal;