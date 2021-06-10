import { Flex, Text } from '@chakra-ui/react'

export const Button = ({ children }) => (
  <Flex
    w="full"
    justify="center"
    bgColor="purple.600"
    cursor="pointer"
    borderRadius={32}
    p={2}
    _hover={{ bgColor: 'purple.500' }}>
    <Text fontSize="md" fontWeight="semibold">
      {children}
    </Text>
  </Flex>
)

export default Button
