import {
  Modal as ChakraModal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
} from '@chakra-ui/react'

export const Modal = ({ isOpen, onClose, header, children, footer }: any) => (
  <ChakraModal onClose={onClose} isOpen={isOpen}>
    <ModalOverlay />
    <ModalContent m={{ base: 4, sm: 32 }} backgroundColor="#211e36" color="#fff">
      <ModalHeader borderBottomWidth={2} borderBottomColor="purple.900">
        {header}
      </ModalHeader>
      <ModalCloseButton />
      <ModalBody p={0}>{children}</ModalBody>
      {footer && <ModalFooter>{footer}</ModalFooter>}
    </ModalContent>
  </ChakraModal>
)
