import { Flex, Text } from '@chakra-ui/react'

export const Button = ({ children }) => (
  <Flex
    bgColor="darkSlateBlue"
    p={2}
    pl={6}
    pr={6}
    borderRadius={32}
    cursor="pointer"
    transition="color 500ms ease-out"
    _hover={{ bgColor: 'darkerSlateBlue' }}>
    <Text fontSize="sm" fontWeight={600}>
      {children}
    </Text>
  </Flex>
)

export default Button
