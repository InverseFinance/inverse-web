import { Flex, Image, Stack, Text } from '@chakra-ui/react'
import Button from '@inverse/components/landing/Button'

export const Navbar = () => (
  <Flex
    width="full"
    justify="space-between"
    align="center"
    color="white"
    mt={6}
    mb={6}
    pl={6}
    pr={6}>
    <Stack direction="row" align="center">
      <Image src="/assets/inverse.png" width={10} height={10} filter="brightness(0) invert(1)" />
      <Text fontWeight={800} fontSize="lg">
        Inverse
      </Text>
    </Stack>
    <Stack direction="row" spacing={12} fontWeight={500} align="center">
      <Text>Docs</Text>
      <Text>Analytics</Text>
      <Button>Enter App</Button>
    </Stack>
  </Flex>
)

export default Navbar
