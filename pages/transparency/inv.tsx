import { Flex, Text, VStack } from '@chakra-ui/react'

import Layout from '@app/components/common/Layout'
import { AppNav } from '@app/components/common/Navbar'
import Head from 'next/head'
import { ShrinkableInfoMessage } from '@app/components/common/Messages'
import { getNetworkConfigConstants } from '@app/util/networks';
import { NetworkIds } from '@app/types'
import useEtherSWR from '@app/hooks/useEtherSWR'
import { usePrices } from '@app/hooks/usePrices'
import { TransparencyTabs } from '@app/components/Transparency/TransparencyTabs';
import { useDAO } from '@app/hooks/useDAO'
import { SupplyInfos } from '@app/components/common/Dataviz/SupplyInfos'
import { Funds } from '@app/components/Transparency/Funds'
import { useMarkets } from '@app/hooks/useMarkets'
import { InvFlowChart } from '@app/components/Transparency/InvFlowChart'
import { REWARD_TOKEN, RTOKEN_CG_ID, RTOKEN_SYMBOL } from '@app/variables/tokens'
import { shortenNumber } from '@app/util/markets'

const { INV, XINV, XINV_V1, ESCROW, COMPTROLLER, TREASURY, XINV_MANAGER, POLICY_COMMITTEE, GOVERNANCE, TOKENS } = getNetworkConfigConstants(NetworkIds.mainnet);

const defaultValues = {
  escrow: ESCROW,
  treasury: TREASURY,
  treasuryAdmin: GOVERNANCE,
  xinv: XINV,
  xinvOld: XINV_V1!,
  xinvComptroller: COMPTROLLER,
  xinvAdmin: XINV_MANAGER,
  xinvManagerPC: POLICY_COMMITTEE,
  xinvUnderlying: INV,
  xinvEscrow: ESCROW,
  govTreasury: TREASURY,
}

export const InvPage = () => {
  const { prices: geckoPrices } = usePrices()
  const { markets } = useMarkets()
  const { invTotalSupply, invSupplies } = useDAO();

  const { data: xinvData } = useEtherSWR([
    [XINV, 'admin'],
    [XINV, 'escrow'],
    [XINV, 'comptroller'],
    [XINV, 'underlying'],
  ])

  const [xinvAdmin, xinvEscrow, comptroller, xinvUnderlying] = xinvData || [XINV_MANAGER, ESCROW, COMPTROLLER, INV]

  const { data: daoData } = useEtherSWR([
    [xinvEscrow?.toLowerCase(), 'governance'],
    [comptroller, 'admin'],
    [comptroller, 'pauseGuardian'],
    [TREASURY, 'admin'],
    [GOVERNANCE, 'guardian'],
    [GOVERNANCE, 'inv'],
    [GOVERNANCE, 'xinv'],
    [GOVERNANCE, 'timelock'],
  ])

  const [escrowGov, govTreasury] = daoData
    || [TREASURY, TREASURY];

  const fetchedValues = { xinvAdmin, xinvEscrow, xinvUnderlying, escrowGov, govTreasury }
  const invFlowChartData = { ...defaultValues, ...fetchedValues };

  // (xinv old excluded)
  const invSupplied = markets.find(m => m.token === XINV)?.supplied || 0;
  const percentageInvSupplied = invTotalSupply ? invSupplied / invTotalSupply * 100 : 0;
  const notStakedOnFrontier = invTotalSupply ?
    invTotalSupply - markets.filter(market => [XINV, XINV_V1].includes(market.token)).reduce((prev, curr) => prev + curr.supplied, 0) : 0

  return (
    <Layout>
      <Head>
        <title>{process.env.NEXT_PUBLIC_TITLE} - Transparency Overview</title>
        <meta name="og:title" content="Inverse Finance - Transparency" />
        <meta name="og:description" content="INV Governance Token" />
        <meta name="og:image" content="https://inverse.finance/assets/social-previews/transparency-inv.png" />
        <meta name="description" content="INV Governance Token Details" />
        <meta name="keywords" content="Inverse Finance, dao, transparency, inv, supply, xinv" />
      </Head>
      <AppNav active="Verify" activeSubmenu="INV" hideAnnouncement={true} />
      <TransparencyTabs active="inv" />
      <Flex w="full" justify="center" direction={{ base: 'column', xl: 'row' }}>
        <Flex direction="column" py="2">
          <InvFlowChart {...invFlowChartData} />
        </Flex>
        <VStack spacing={4} direction="column" pt="4" px={{ base: '4', xl: '0' }} w={{ base: 'full', xl: 'sm' }}>
          <SupplyInfos token={TOKENS[INV]} supplies={invSupplies}
          />
          <ShrinkableInfoMessage
            title={`🔒 ${RTOKEN_SYMBOL} Staked on Frontier`}
            description={
              <>
                <Funds showTotal={true} showPerc={true} funds={
                  markets
                    .filter(market => [XINV, XINV_V1].includes(market.token))
                    .map(market => {
                      return {
                        token: { ...market.underlying, address: market.token },
                        balance: market.supplied,
                        usdPrice: geckoPrices[RTOKEN_CG_ID]?.usd!,
                      }
                    }).concat([
                      {
                        token: { ...REWARD_TOKEN, symbol: 'Not on Frontier' },
                        balance: notStakedOnFrontier,
                        usdPrice: geckoPrices[RTOKEN_CG_ID]?.usd!,
                      }
                    ])
                }
                />
                <Flex direction="row" w='full' justify="space-between">
                  <Text>- % of {RTOKEN_SYMBOL} Supply staked (old excluded):</Text>
                  <Text>{shortenNumber(percentageInvSupplied, 2)}%</Text>
                </Flex>
              </>
            }
          />
          <ShrinkableInfoMessage
            title="✨ Monthly INV rewards for each Frontier Market"
            description={
              <Funds funds={markets.map(market => {
                return { token: market.underlying, balance: market.rewardsPerMonth, usdPrice: geckoPrices[RTOKEN_CG_ID]?.usd! }
              })}
              />
            }
          />
          <ShrinkableInfoMessage
            title="⚡ Roles & Powers"
            description={
              <>
                <Flex direction="row" w='full' justify="space-between">
                  <Text fontWeight="bold">- x{RTOKEN_SYMBOL} Admin:</Text>
                  <Text>Change {RTOKEN_SYMBOL} APY</Text>
                </Flex>
                <Flex direction="row" w='full' justify="space-between">
                  <Text fontWeight="bold">- Escrow Admin:</Text>
                  <Text>Change x{RTOKEN_SYMBOL} escrow duration</Text>
                </Flex>
                <Flex direction="row" w='full' justify="space-between">
                  <Text fontWeight="bold">- Policy Committee:</Text>
                  <Text>Handle Reward Rates Policies</Text>
                </Flex>
              </>
            }
          />
        </VStack>
      </Flex>
    </Layout>
  )
}

export default InvPage
