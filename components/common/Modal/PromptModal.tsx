import { Modal } from '@app/components/common/Modal';
import { Stack, Text, TextareaProps } from '@chakra-ui/react';
import { SubmitButton } from '@app/components/common/Button';
import { Textarea } from '../Input';
import { useEffect, useState } from 'react';

export type Props = {
    title?: string,
    label?: string,
    placeholder?: string,
    defaultText?: string,
    btnLabel?: string,
    isOpen: boolean
    textAreaProps?: TextareaProps,
    onClose: () => void
    onSubmit: (value: string) => void
    onSuccess?: (t?: any) => any
}

const PromptModal = ({
    title = 'Prompt',
    label = 'Value',
    placeholder = '',
    isOpen,
    defaultText = '',
    btnLabel = 'OK',
    textAreaProps,
    onClose,
    onSubmit,
    onSuccess,
}: Props) => {
    const [text, setText] = useState(defaultText);

    useEffect(() => {
        setText(defaultText);
    }, [defaultText]);

    const handleOk = () => {
        return onSubmit(text);
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
            footer={<SubmitButton onClick={handleOk} onSuccess={handleSuccess}>{btnLabel}</SubmitButton>}
        >
            <Stack p={'5'} minH={150} overflowY="auto">
                <Text>{label}:</Text>
                <Textarea value={text} fontSize="12px" placeholder={placeholder} onChange={(e) => setText(e.target.value)} {...textAreaProps} />
            </Stack>
        </Modal>
    )
}

export default PromptModal;