import {
  Flex,
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

export const ModalTabs = ({ tabs, active, onChange }: any) => (
  <Flex w="full" cursor="pointer" borderBottomColor="purple.900" borderBottomWidth={2}>
    {tabs.map((tab: string, i: number) => (
      <Flex
        key={i}
        w="full"
        justify="center"
        borderBottomColor="#fff"
        borderBottomWidth={tab === active ? 3 : 0}
        color={tab === active ? '#fff' : 'purple.100'}
        pb={2}
        pt={2}
        mt={1}
        fontSize="13px"
        fontWeight="bold"
        textTransform="uppercase"
        onClick={() => onChange(tab)}
      >
        {tab}
      </Flex>
    ))}
  </Flex>
)
