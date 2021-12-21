import {
  Modal as ChakraModal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  useMediaQuery,
} from '@chakra-ui/react'

export type ModalProps = {
  isOpen: boolean
  onClose: () => void
  header?: React.ReactNode
  children?: React.ReactNode
  footer?: React.ReactNode
}

export const Modal = ({ isOpen, onClose, header, children, footer, ...props }: ModalProps) => {
  const [isLargerThan780] = useMediaQuery('(min-width: 780px)')
  const scrollBehavior = isLargerThan780 ? 'outside' : 'inside';
  return (
    <ChakraModal onClose={onClose} isOpen={isOpen} isCentered scrollBehavior={scrollBehavior}>
      <ModalOverlay />
      <ModalContent m={{ base: 4, sm: 32 }} backgroundColor="purple.800" color="#fff"  {...props}>
        <ModalHeader borderBottomWidth={2} borderBottomColor="purple.850">
          {header}
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody p={0}>{children}</ModalBody>
        {footer && <ModalFooter>{footer}</ModalFooter>}
      </ModalContent>
    </ChakraModal>
  )
}