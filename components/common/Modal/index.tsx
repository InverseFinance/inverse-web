import {
  Modal as ChakraModal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  ModalProps as ChakraModalProps,
  useMediaQuery,
} from '@chakra-ui/react'

export type ModalProps = {
  isOpen: boolean
  onClose: () => void
  header?: React.ReactNode
  children?: React.ReactNode
  footer?: React.ReactNode
  size?: ChakraModalProps["size"]
} & Partial<ChakraModalProps>

export const Modal = ({ isOpen, onClose, header, children, footer, scrollBehavior, size, ...props }: ModalProps) => {
  const [isLargerThan] = useMediaQuery('(min-width: 1200px)')
  const _scrollBehavior = scrollBehavior || (isLargerThan ? 'outside' : 'inside');
  const footerBorderProps = _scrollBehavior === 'outside' ? {} : { borderTopWidth: 2, borderTopColor: 'primary.850' }
  return (
    <ChakraModal size={size} onClose={onClose} isOpen={isOpen} isCentered scrollBehavior={_scrollBehavior}>
      <ModalOverlay />
      <ModalContent m={{ base: 4, sm: 32 }} bg="modalContentBg" color="mainTextColor"  {...props}>
        {
          !!header && <ModalHeader className="heading-font" borderBottomWidth={2} borderBottomColor="primary.850">
            {header}
          </ModalHeader>
        }
        <ModalCloseButton />
        <ModalBody p={0}>{children}</ModalBody>
        {footer && <ModalFooter {...footerBorderProps}>
          {footer}
        </ModalFooter>}
      </ModalContent>
    </ChakraModal>
  )
}