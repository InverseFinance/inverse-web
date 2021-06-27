import { Flex, Stack, Text } from '@chakra-ui/react'
import LinkButton from '@inverse/components/Button'

export const Banner = () => (
  <Flex
    w="full"
    h={{ base: 800, md: 900 }}
    direction="column"
    align="center"
    bgImage="/assets/landing/space.png"
    bgRepeat="no-repeat"
    bgPosition="center top"
  >
    <Stack
      p={{ base: 4, xl: 0 }}
      mt={{ base: 4, xl: 32 }}
      ml={{ base: 0, xl: '28rem' }}
      textAlign={{ base: 'center', xl: 'start' }}
      maxWidth="xl"
      spacing={4}
    >
      <Text lineHeight={1} fontSize={{ base: '5xl', md: '6xl' }} fontWeight="extrabold">
        Invert The System
      </Text>
      <Text fontSize={{ base: 'lg', md: 'xl' }}>
        Inverse is building a suite of DeFi tools, governed by one of the most active DAO in the space. From a
        capital-efficient money market, to tokenized synthetic assets, traditional finance is about to be invaded.
      </Text>
      <Stack direction="row" spacing={4}>
        <Flex width={{ base: 'full', xl: 32 }}>
          <LinkButton href="/anchor">Enter App</LinkButton>
        </Flex>
        <Flex width={{ base: 'full', xl: 32 }}>
          <LinkButton href="https://docs.inverse.finance/">Learn More</LinkButton>
        </Flex>
      </Stack>
    </Stack>
  </Flex>
)

export default Banner
