import {
  Modal as ChakraModal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
} from '@chakra-ui/react'

export type ModalProps = {
  isOpen: boolean
  onClose: () => void
  header?: React.ReactNode
  children?: React.ReactNode
  footer?: React.ReactNode
}

export const Modal = ({ isOpen, onClose, header, children, footer }: ModalProps) => (
  <ChakraModal onClose={onClose} isOpen={isOpen} isCentered>
    <ModalOverlay />
    <ModalContent m={{ base: 4, sm: 32 }} backgroundColor="purple.800" color="#fff">
      <ModalHeader borderBottomWidth={2} borderBottomColor="purple.850">
        {header}
      </ModalHeader>
      <ModalCloseButton />
      <ModalBody p={0}>{children}</ModalBody>
      {footer && <ModalFooter>{footer}</ModalFooter>}
    </ModalContent>
  </ChakraModal>
)
