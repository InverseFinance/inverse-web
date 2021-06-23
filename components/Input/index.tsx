import { Input as ChakraInput } from '@chakra-ui/react'

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
