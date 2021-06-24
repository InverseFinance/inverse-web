import { Flex, Input as ChakraInput, Textarea as ChakraTextarea } from '@chakra-ui/react'

export const Input = (props: any) => (
  <ChakraInput
    textAlign="end"
    fontSize="xl"
    fontWeight="semibold"
    borderWidth={0}
    bgColor="purple.900"
    p={6}
    pr={3}
    borderRadius={8}
    _focus={{}}
    {...props}
  />
)

export const Textarea = (props: any) => (
  <ChakraTextarea
    fontSize="xl"
    fontWeight="semibold"
    borderWidth={0}
    bgColor="purple.900"
    p={6}
    pr={3}
    height={28}
    borderRadius={8}
    resize="none"
    _focus={{}}
    {...props}
  />
)

export const BalanceInput = ({ value, onChange, onMaxClick, label }: any) => (
  <Flex position="relative" w="full" align="center">
    <Flex
      cursor="pointer"
      position="absolute"
      left={0}
      fontWeight="extrabold"
      fontSize="sm"
      ml={4}
      color="purple.100"
      zIndex="docked"
      onClick={onMaxClick}
      _hover={{ color: '#fff' }}
    >
      MAX
    </Flex>
    <Input value={value} onChange={onChange} placeholder="0" />
    {label && (
      <Flex whiteSpace="nowrap" fontSize="lg" fontWeight="semibold" ml={2} color="purple.100">
        {label}
      </Flex>
    )}
  </Flex>
)
