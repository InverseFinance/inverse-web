import { Flex, Stack, Text } from '@chakra-ui/react'
import Button from '@inverse/components/landing/Button'

export const Banner = () => (
  <Flex
    bgImage="/assets/home/main1.png"
    bgRepeat="no-repeat"
    bgPosition="center center"
    direction="column"
    height={1000}
    align="center"
    justify="space-between"
    color="white"
    width="full">
    <Stack mt={40} ml="42rem" w="3xl" spacing={4}>
      <Text lineHeight={1} fontSize="7xl" fontWeight="extrabold">
        Invading the Traditional Financial System
      </Text>
      <Text fontSize="xl">
        Inverse is building a suite of DeFi tools, governed by one of the most active DAO in the
        space. From a capital-efficient money market, to tokenized synthetic assets, traditional
        finance is about to be invaded.
      </Text>
      <Stack direction="row" spacing={4}>
        <Button>Enter App</Button>
        <Button>Learn More</Button>
      </Stack>
    </Stack>
  </Flex>
)

export default Banner
