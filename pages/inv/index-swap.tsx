import { Box, Flex, Text, VStack } from '@chakra-ui/react'
import Layout from '@app/components/common/Layout'
import { AppNav } from '@app/components/common/Navbar'
import Head from 'next/head';
import { Link } from '@app/components/common/Link';
import { AnimatedInfoTooltip } from '@app/components/common/Tooltip';
import { ReactNode } from 'react';
import { useMarkets } from '@app/hooks/useMarkets';
import { InvSwap } from '@app/components/Swap/InvSwap';

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
    <Flex fontWeight="bold" fontSize="20px" color="mainTextColor" direction="row" alignItems="center">
      <Text mr="5">•</Text>
      {
        !!href ?
          <Link textDecoration="underline" color="mainTextColor" isExternal href={href}>{label}</Link>
          :
          <Text>{label}</Text>
      }
      {
        !!tooltip && <AnimatedInfoTooltip iconProps={{ ml: "2", fontSize: '14px' }} message={tooltip} />
      }
    </Flex>
  )
}

export const InvPlus = () => {
  const { markets } = useMarkets();

  const rewardTokenMarket = markets?.find((v) => v.token === process.env.NEXT_PUBLIC_REWARD_STAKED_TOKEN);
  const apy = rewardTokenMarket?.supplyApy.toFixed(2) || 100;

  return (
    <Layout>
      <Head>
        <title>{process.env.NEXT_PUBLIC_TITLE} - INV</title>
      </Head>
      <AppNav active="INV" />
      <Flex direction="column" w={{ base: 'full' }} p={{ base: '4' }} maxWidth="1300px">
        <Flex direction={{ base: 'column', sm: 'row' }} pt="4" fontSize={{ base: '24px', md: '46px' }} fontWeight="bold" w={{ base: 'full' }} justify="center">
          <Text textAlign="center" display="inline-block">
            The First
          </Text>
          <Text textAlign="center" ml="3" color="secondary" display="inline-block">
            Positive Sum Rewards Token
          </Text>
        </Flex>

        <Flex fontSize="23px" w={{ base: 'full' }} justify="center" mb="40px">
          <Text as="i" textAlign="center" fontSize="18px">
            Inverse Plus will bring revenue sharing and accelerated rewards to INV stakers
          </Text>
        </Flex>

        <Flex w={{ base: 'full' }} justify="space-around" direction={{ base: 'column', md: 'row' }}>
          <Flex w="50%" direction="column">
            <VStack pt="10" alignItems="flex-start">
              <VStack spacing="2" alignItems="left">
                <Step label="Earn Continuous Staking Rewards" href="/frontier?market=inv&marketType=supply" />
                <Step label="Earn Revenue Sharing Rewards" href="https://docs.inverse.finance/inverse-finance/basics/inv-token#revenue-sharing-rewards-rsr" />
                <Step label="Borrow DOLA using INV as Collateral" href="/frontier?market=dola&marketType=borrow" />
                <Step label="Vote in the Inverse Finance DAO" href="/governance" />
              </VStack>
            </VStack>
            <VStack textAlign="left" maxW="80%" spacing="2" pt="10" alignItems="flex-start">
              <Text fontSize="16px" fontWeight="bold" color="secondary">What is Inverse Plus?</Text>
              <Text><b>Inverse Plus</b> adds new features to the INV governance token with new revenue sharing and higher staking rewards.</Text>

              <Text fontSize="16px" fontWeight="bold" color="secondary">How do continuous Rewards work?</Text>
              <Text>
                Staking INV on Frontier delivers additional INV rewards with each new mined Ethereum block, approximately 6,400 times per day with a <b>current APY of {apy}% and max of 500%</b>.
              </Text>

              <Text fontSize="16px" fontWeight="bold" color="secondary">How do Revenue Sharing Rewards work?</Text>
              <Text>
                Revenue Sharing Rewards are designed to encourage long-term staking of INV and as the DOLA stablecoin reaches certain circulation milestones, a share of DOLA lending revenue is shared with all INV stakers according to the length of staking time.
              </Text>

              <Text fontSize="16px" fontWeight="bold" color="secondary">Where can I learn more about Inverse Plus?</Text>
              <Box>
                <Text display="inline-block" mr="1">
                  Check out our FAQ
                </Text>
                <Link mr="1" textDecoration="underline" display="inline-block" href="https://docs.google.com/document/d/12RzGlLOSM76bhy1WLRZLeRmaOuHlQ-bPwROQRZjKTXk">
                  here
                </Link>
                <Text display="inline-block" mr="1">
                  and our on-chain proposal
                </Text>
                <Link textDecoration="underline" display="inline-block" href="/governance/mills/6">
                  here
                </Link>
              </Box>
            </VStack>
          </Flex>
          <Flex w="50%" justify="flex-start" maxW="600px">
            <Flex w='full' minW='300px' maxW="600px">
              <InvSwap
                label="Get INV Now"
                description="Or Get INV at a discount in seven days thanks to Bonds"
                href="/bonds"
              />
            </Flex>
          </Flex>
        </Flex>
      </Flex>
    </Layout>
  )
}

export default InvPlus
