import { Box, Flex, Text, VStack } from '@chakra-ui/react'
import Layout from '@app/components/common/Layout'
import { AppNav } from '@app/components/common/Navbar'
import Head from 'next/head';
import { Link } from '@app/components/common/Link';

export const Swap = () => {
  return (
    <Layout>
      <Head>
        <title>{process.env.NEXT_PUBLIC_TITLE} - INV</title>
      </Head>
      <AppNav active="Swap" />
      <Flex w={{ base: 'full', xl: '2xl' }}>
        <VStack pt="5" alignItems="flex-start">
          <Box w="full">
            <Text textAlign="center" fontSize="4xl">INV+ launch FAQ</Text>
          </Box>
          <Text fontWeight="bold" color="secondary">What’s going on?</Text>
          <Text><b>Inverse Finance</b> had a hard cap of 100.000 tokens upon launch which makes us very inflexible. As a year’s time has passed, Inverse has established a presence and now can be more easily evaluated by the market. This allows us to gently let go of the hard cap by minting new INV tokens. In order to keep stakers whole, we are opting for a simultaneous <b>distribution of INV to stakers</b>, <b>bonds</b> and to continue previous Anchor incentives.</Text>

          <Text fontWeight="bold" color="secondary">Why open up the token cap?</Text>
          <Text><b>Inverse Finance</b> needs to expand the INV supply in order to support operations and expansion of DOLA liquidity. INV has a fixed supply, so rather than to suddenly dilute current stakers by minting a large amount of INV at once, we are opting for minting smaller batches and distribute it per block which allows us to spread the effect out over time. This allows us to dynamically direct the new supply to operations and liquidity acquisition while at the same time keeping our stakers whole. <b>The majority of INV emissions will go to stakers, meaning they are protected from dilution while actually increasing ownership share</b>.</Text>

          <Text fontWeight="bold" color="secondary">What does this mean for INV?</Text>
          <Text><b>Inverse Finance</b> and INV is based in a working product suite which is our money market Anchor, and the DOLA Fed. Our revenue generating products provide confidence in our value base as we carefully open the cap and INV will reflect our advantages over time. Another value add for stakers is that once DOLA circulation reaches $1BN, <b>DOLA Interest Sharing Rewards</b> will begin.</Text>

          <Text fontWeight="bold" color="secondary">What does this mean for stakers?</Text>
          <Text>There will be little difference for a long term staker since we don’t have to migrate INV tokens to a new contract. As supply increases, stakers are less diluted because they get most of the emissions. Stakers decide on the details of the <b>DOLA Interest Sharing</b> in an upcoming proposal involving milestones. INV holders can rest assured that the success of DOLA and Anchor will bolster the value of INV.</Text>

          <Text fontWeight="bold" color="secondary">Is Interest Sharing the same as dividends?</Text>
          <Text>No but they can share some traits.</Text>

          <Text fontWeight="bold" color="secondary">What can I do with my INV?</Text>
          <Box color="white">
            As you stake INV you can borrow DOLA against it and you can explore the other borrowing options available on Anchor,
            <Link display="inline-block" href="/anchor" ml="1">here</Link>
            . Staking INV on Anchor also provides you with voting rights in the governance process used to alter the parameters of Anchor.
          </Box>
          <Text fontWeight="bold" color="secondary">Is <b>Inverse Finance</b> now an Olympus fork?</Text>
          <Text>No. Inverse is using Olympus Pro to acquire Liquidity and other assets. We have not forked any of Olympus’s code.</Text>

          <Text fontWeight="bold" color="secondary">Can <b>Inverse Finance</b> mint as much as they like and keep it for themselves?</Text>
          <Text>No. The Policy Committee handles day-to-day changes to the interest rates and refill <b>bonds</b>. The proposal will start with INV stakers being rewarded around 100% APY, and a hard cap equivalent to 500% APY. Inverse  DAO can vote to change the hard cap and set restrictions for intra day changes in interest rates.</Text>
        </VStack>
      </Flex>
    </Layout>
  )
}

export default Swap
