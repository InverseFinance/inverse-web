import { Modal } from '@app/components/common/Modal';
import { ModalProps, Stack, Text } from '@chakra-ui/react';
import { ReactNode } from 'react';
import { useAppTheme } from '@app/hooks/useAppTheme';

export type Props = {
    title?: string,
    isOpen: boolean
    onClose: () => void
    children?: ReactNode
    minW?: any
    modalProps?: ModalProps
}

const SimpleModal = ({
    title = '',
    isOpen,
    onClose,
    children,
    minW,
    modalProps,
}: Props) => {
    const { themeName } = useAppTheme();

    return (
        <Modal
            onClose={onClose}
            isOpen={isOpen}
            scrollBehavior="inside"
            header={
                title ?
                    <Stack minWidth={24} direction="row" align="center" >
                        <Text >{title}</Text>
                    </Stack>
                    : undefined
            }
            minW={minW}
            className={`blurred-container ${themeName}-bg`}
            bg="transparent"
            {...modalProps}
        >
            {children ? children : <></>}
        </Modal>
    )
}

export default SimpleModal;