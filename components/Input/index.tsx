import { Input as ChakraInput, Textarea as ChakraTextarea } from '@chakra-ui/react'

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
