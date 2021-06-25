import { Flex, Image, Input as ChakraInput, Stack, Textarea as ChakraTextarea } from '@chakra-ui/react'
import { Token } from '@inverse/types'

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

type BalanceInputProps = {
  value: string
  label?: React.ReactNode
  asset?: Token
  onChange: (e: React.MouseEvent<HTMLInputElement>) => void
  onMaxClick: (e: any) => void
}

export const BalanceInput = ({ value, onChange, onMaxClick, label, asset }: BalanceInputProps) => (
  <Flex w="full" position="relative" align="center">
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
    <Flex w="full">
      <Input value={value} onChange={onChange} placeholder="0" />
    </Flex>
    {asset && (
      <>
        <Image ml={2} mr={2} w={6} h={6} src={asset.image} />
        <Flex fontSize="lg" fontWeight="semibold" color="purple.100">
          {asset.symbol}
        </Flex>
      </>
    )}
    {label && (
      <Flex whiteSpace="nowrap" fontSize="lg" fontWeight="semibold" color="purple.100" ml={2}>
        {label}
      </Flex>
    )}
  </Flex>
)
