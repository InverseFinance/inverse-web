import { Box, Flex, Text, VStack } from '@chakra-ui/react'
import Layout from '@app/components/common/Layout'
import { AppNav } from '@app/components/common/Navbar'
import Head from 'next/head';
import { Link } from '@app/components/common/Link';
import { AnimatedInfoTooltip } from '@app/components/common/Tooltip';
import { ReactNode } from 'react';

const Step = ({
  label,
  tooltip,
  href,
}: {
  label: string,
  tooltip?: ReactNode,
  href?: string,
}) => {
  return (
    <Flex fontSize="20px" color="white" direction="row" alignItems="center">
      <Text mr="1">-</Text>
      {
        !!href ?
          <Link color="white" isExternal href={href}>{label}</Link>
          :
          <Text>{label}</Text>
      }
      {
        !!tooltip && <AnimatedInfoTooltip iconProps={{ ml: "1" }} message={tooltip} />
      }
    </Flex>
  )
}

export const InvPlus = () => {
  return (
    <Layout>
      <Head>
        <title>{process.env.NEXT_PUBLIC_TITLE} - INV</title>
      </Head>
      <AppNav active="INV" />
      <Flex w={{ base: 'full' }} justify="space-around" direction={{ base: 'column', md: 'row' }}>
        <Flex w={{ base: 'full', md:'40%' }} px="5">
          <VStack pt="5" alignItems="flex-start">
            <Text fontWeight="bold" textAlign="center" fontSize="20px">First Positive Sum Rewards Token</Text>
            <Text textAlign="center" fontSize="14px">
              Inverse Plus brings revenue sharing and accelerated rewards to INV stakers
            </Text>
            <VStack pt="5" spacing="10" alignItems="left">
              <Step label="Swap Into INV"
                tooltip={
                  <>
                    <Text mb="2">- The best <b>DEXs</b> to buy <b>INV</b> are <b>SushiSwap</b>, <b>1Inch</b> and <b>ParaSwap</b></Text>
                    <Text>- You can also buy <b>INV</b> on several <b>CEXs</b> like <b>Coinbase</b>, <b>MEXC Global</b> and <b>Huobi Global</b></Text>
                  </>
                }
                href={process.env.NEXT_PUBLIC_BUY_RTOKEN_URL} />
              <Step label="Stake INV and Earn Staking Rewards" tooltip="message" href="/anchor?market=inv&marketType=supply" />
              <Step label="Earn Revenue Sharing rewards" tooltip="message" />
              <Step label="Borrow DOLA using INV as collateral" tooltip="message"  href="/anchor?market=dola&marketType=borrow" />
              <Step label="Vote in the Inverse DAO" tooltip="message" href="/governance" />
            </VStack>
          </VStack>
        </Flex>
        <Flex w={{ base: 'full', md:'40%' }} px="5">
          <VStack pt="5" alignItems="flex-start">
            <Box w="full">
              <Text fontWeight="bold" textAlign="center" fontSize="4xl">INV+ launch FAQ</Text>
            </Box>
            <Text fontSize="18px" fontWeight="bold" color="secondary">What’s going on?</Text>
            <Text><b>Inverse Finance</b> had a hard cap of 100.000 tokens upon launch which makes us very inflexible. As a year’s time has passed, Inverse has established a presence and now can be more easily evaluated by the market. This allows us to gently let go of the hard cap by minting new INV tokens. In order to keep stakers whole, we are opting for a simultaneous <b>distribution of INV to stakers</b>, <b>bonds</b> and to continue previous Anchor incentives.</Text>

            <Text fontSize="18px" fontWeight="bold" color="secondary">Why open up the token cap?</Text>
            <Text><b>Inverse Finance</b> needs to expand the INV supply in order to support operations and expansion of DOLA liquidity. INV has a fixed supply, so rather than to suddenly dilute current stakers by minting a large amount of INV at once, we are opting for minting smaller batches and distribute it per block which allows us to spread the effect out over time. This allows us to dynamically direct the new supply to operations and liquidity acquisition while at the same time keeping our stakers whole. <b>The majority of INV emissions will go to stakers, meaning they are protected from dilution while actually increasing ownership share</b>.</Text>

            <Text fontSize="18px" fontWeight="bold" color="secondary">What does this mean for INV?</Text>
            <Text><b>Inverse Finance</b> and INV is based in a working product suite which is our money market Anchor, and the DOLA Fed. Our revenue generating products provide confidence in our value base as we carefully open the cap and INV will reflect our advantages over time. Another value add for stakers is that once DOLA circulation reaches $1BN, <b>DOLA Interest Sharing Rewards</b> will begin.</Text>

            <Text fontSize="18px" fontWeight="bold" color="secondary">What does this mean for stakers?</Text>
            <Text>There will be little difference for a long term staker since we don’t have to migrate INV tokens to a new contract. As supply increases, stakers are less diluted because they get most of the emissions. Stakers decide on the details of the <b>DOLA Interest Sharing</b> in an upcoming proposal involving milestones. INV holders can rest assured that the success of DOLA and Anchor will bolster the value of INV.</Text>

            <Text fontSize="18px" fontWeight="bold" color="secondary">Is Interest Sharing the same as dividends?</Text>
            <Text>No but they can share some traits.</Text>

            <Text fontSize="18px" fontWeight="bold" color="secondary">What can I do with my INV?</Text>
            <Box color="white">
              As you stake INV you can borrow DOLA against it and you can explore the other borrowing options available on Anchor,
              <Link color="secondary" display="inline-block" href="/anchor" ml="1">here</Link>
              . Staking INV on Anchor also provides you with voting rights in the governance process used to alter the parameters of Anchor.
            </Box>
            <Text fontSize="18px" fontWeight="bold" color="secondary">Is <b>Inverse Finance</b> now an Olympus fork?</Text>
            <Text>No. Inverse is using Olympus Pro to acquire Liquidity and other assets. We have not forked any of Olympus’s code.</Text>

            <Text fontSize="18px" fontWeight="bold" color="secondary">Can <b>Inverse Finance</b> mint as much as they like and keep it for themselves?</Text>
            <Text>No. The Policy Committee handles day-to-day changes to the interest rates and refill <b>bonds</b>. The proposal will start with INV stakers being rewarded around 100% APY, and a hard cap equivalent to 500% APY. Inverse  DAO can vote to change the hard cap and set restrictions for intra day changes in interest rates.</Text>

            <Text fontSize="18px" fontWeight="bold" color="secondary">Where do I go to find more answers?</Text>
            <Box color="white">
              <Link color="secondary" display="block" href="https://www.inverse.finance/governance/proposals/mills/6" mb="2">
                Read the proposal!
              </Link>
              Join our
              <Link color="secondary" display="inline-block" href="https://discord.gg/YpYJC7R5nv" mx="1">
                Discord Server
              </Link>
              and ask us, read our
              <Link color="secondary" display="inline-block" href="https://medium.com/inverse-finance" ml="1">
                Medium Articles
              </Link>
              , explore the
              <Link color="secondary" display="inline-block" href="https://docs.inverse.finance/" ml="1">
                Docs
              </Link>
              , check out the
              <Link color="secondary" display="inline-block" href="https://t.me/InverseFinance" mx="1">
                Telegram
              </Link>
              channel or the
              <Link color="secondary" display="inline-block" href="https://forum.inverse.finance/t/revised-inverse-plus-proposal-v1-5/52" mx="1">
                Forum
              </Link>
              !
            </Box>
          </VStack>
        </Flex>
      </Flex>
    </Layout>
  )
}

export default InvPlus
