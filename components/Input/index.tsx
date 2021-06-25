import { Flex, Image, Input as ChakraInput, Stack, Textarea as ChakraTextarea } from '@chakra-ui/react'

export const Input = (props: any) => (
  <ChakraInput
    textAlign="end"
    fontSize="xl"
    fontWeight="medium"
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

export const BalanceInput = ({ value, onChange, onMaxClick, label, asset }: any) => (
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
    {asset && (
      <Stack direction="row" ml={2} mr={2}>
        <Image w={6} h={6} src={asset.image} />
        <Flex whiteSpace="nowrap" fontSize="lg" fontWeight="semibold" color="purple.100">
          {asset.symbol}
        </Flex>
      </Stack>
    )}
    {label && (
      <Flex whiteSpace="nowrap" fontSize="lg" fontWeight="semibold" color="purple.100" ml={2}>
        {label}
      </Flex>
    )}
  </Flex>
)
