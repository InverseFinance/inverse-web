import { useAppTheme } from '@app/hooks/useAppTheme'
import { shortenNumber } from '@app/util/markets'
import { Flex, Input as ChakraInput, Text, Textarea as ChakraTextarea, InputProps, FlexProps, TextProps } from '@chakra-ui/react'

export const Input = (props: any) => (
  <ChakraInput
    textAlign="end"
    fontSize="xl"
    fontWeight="medium"
    borderWidth={0}
    bgColor="primary.850"
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
    bgColor="primary.850"
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
  balance?: string | number
  showMax?: boolean
  isError?: boolean
  inputRightProps?: TextProps
  inputLeftProps?: FlexProps
}

export const BalanceInput = ({ allowMobileMode = false, isError, value, label, onChange, onMaxClick, inputProps, showBalance, balance, showMax = true, inputRightProps, inputLeftProps, ...props }: BalanceInputProps & Partial<FlexProps>) => {
  const { themeStyles, themeParams } = useAppTheme();
  return <Flex
    w="full"
    bgColor='primary.850'
    borderRadius={8}
    align="center"
    {...props}
    direction={{ base: allowMobileMode ? 'column-reverse' : 'row', sm: 'row' }}
    border={isError ? `1px solid ${themeStyles.colors.error}` : themeParams.INPUT_BORDER}
  >
    <Flex w="full" position="relative" align="center">
      <Flex
        cursor="pointer"
        position="absolute"
        left={0}
        fontWeight={showBalance ? 'normal' : 'extrabold'}
        fontSize={showBalance ? 'xs' : 'sm'}
        ml={4}
        color="secondaryTextColor"
        zIndex="1"
        onClick={onMaxClick}
        _hover={{ color: 'mainTextColor' }}
        visibility={showMax ? 'visible' : 'hidden'}
        {...inputLeftProps}
      >
        {
          showBalance ? `Bal ${shortenNumber(parseFloat(balance?.toString()?.replace(/,/g, '')), 2, false, true)}` : 'MAX'
        }        
      </Flex>
      <Input _focusVisible={false} value={value} onChange={onChange} placeholder="0" {...inputProps} />
    </Flex>
    {typeof label === 'string' ? (
      <Text whiteSpace="nowrap" fontSize="lg" fontWeight="semibold" color="lightAccentTextColor" align="center" pl={2} pr={4} {...inputRightProps}>
        {label}
      </Text>
    ) : (
      label
    )}
  </Flex>
}
