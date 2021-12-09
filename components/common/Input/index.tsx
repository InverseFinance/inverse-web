import { Flex, Input as ChakraInput, Text, Textarea as ChakraTextarea, InputProps } from '@chakra-ui/react'

export const Input = (props: any) => (
  <ChakraInput
    textAlign="end"
    fontSize="xl"
    fontWeight="medium"
    borderWidth={0}
    bgColor="purple.850"
    p={6}
    pr={2}
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
    bgColor="purple.850"
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
  onChange: (e: React.MouseEvent<HTMLInputElement>) => void
  onMaxClick: (e: any) => void
  inputProps?: InputProps
  showBalance?: boolean
  balance?: string
}

export const BalanceInput = ({ value, label, onChange, onMaxClick, inputProps, showBalance, balance }: BalanceInputProps) => (
  <Flex w="full" bgColor="purple.850" borderRadius={8} align="center">
    <Flex w="full" position="relative" align="center">
      <Flex
        cursor="pointer"
        position="absolute"
        left={0}
        fontWeight={ showBalance ? 'normal' : 'extrabold' }
        fontSize={ showBalance ? 'xs' : 'sm' }
        ml={4}
        color="purple.200"
        zIndex="docked"
        onClick={onMaxClick}
        _hover={{ color: '#fff' }}
      >
        {
          showBalance ? `Bal ${balance}` : 'MAX'
        }
      </Flex>
      <Input value={value} onChange={onChange} placeholder="0" {...inputProps} />
    </Flex>
    {typeof label === 'string' ? (
      <Text whiteSpace="nowrap" fontSize="lg" fontWeight="semibold" color="purple.100" align="center" pl={2} pr={4}>
        {label}
      </Text>
    ) : (
      label
    )}
  </Flex>
)
