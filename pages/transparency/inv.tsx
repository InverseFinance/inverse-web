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
import { RTOKEN_CG_ID, RTOKEN_SYMBOL } from '@app/variables/tokens'
import { useDBRMarkets } from '@app/hooks/useDBR'
import { preciseCommify } from '@app/util/misc'
import { SkeletonBlob } from '@app/components/common/Skeleton'

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
  const { markets, isLoading: isLoadingFrontier } = useMarkets()
  const { markets: dbrMarkets, isLoading: isLoadingFirm } = useDBRMarkets();
  const isLoadingStaking = isLoadingFrontier || isLoadingFirm;
  const { invTotalSupply, invSupplies, isLoading: isLoadingSupplies } = useDAO();

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

  // Frontier staking (includes staked via FiRM)
  const invFrontierMarket = markets?.find(market => market.token === XINV);
  const stakedOnFrontier = invFrontierMarket?.supplied || 0;
  const stakedViaFirm = dbrMarkets?.find(market => market.isInv)?.invStakedViaDistributor || 0;
  const stakedViaFrontier = stakedOnFrontier - stakedViaFirm;
  const notStaked = invTotalSupply ?
    invTotalSupply - stakedOnFrontier : 0

  const rewardsPerMonth = invFrontierMarket?.rewardsPerMonth || 0;

  return (
    <Layout>
      <Head>
        <title>Inverse Finance - Transparency Overview</title>
        <meta name="og:title" content="Inverse Finance - Transparency" />
        <meta name="og:description" content="INV Governance Token" />
        <meta name="og:image" content="https://inverse.finance/assets/social-previews/transparency-inv.png" />
        <meta name="description" content="INV Governance Token Details" />
        <meta name="keywords" content="Inverse Finance, dao, transparency, inv, supply, xinv" />
      </Head>
      <AppNav active="Transparency" activeSubmenu="INV" hideAnnouncement={true} />
      <TransparencyTabs active="inv" />
      <Flex w="full" justify="center" direction={{ base: 'column', xl: 'row' }}>
        <Flex direction="column" py="2">
          {/* <InvFlowChart {...invFlowChartData} /> */}
        </Flex>
        <VStack spacing={4} direction="column" pt="4" px={{ base: '4', xl: '0' }} w={{ base: 'full', xl: 'sm' }}>
          <SupplyInfos isLoading={isLoadingSupplies} token={TOKENS[INV]} supplies={invSupplies} />
          <ShrinkableInfoMessage
            description={
              isLoadingStaking ?
              <SkeletonBlob /> :
              <>
                <Text fontWeight="bold">{RTOKEN_SYMBOL} staking:</Text>
                <Funds noImage={true} showTotal={false} showPerc={true} funds={
                  [
                    {
                      label: 'Total staked',
                      balance: stakedOnFrontier,
                      usdPrice: geckoPrices[RTOKEN_CG_ID]?.usd!,
                    },
                    {
                      label: 'Not staked',
                      balance: notStaked,
                      usdPrice: geckoPrices[RTOKEN_CG_ID]?.usd!,
                    }
                  ]
                }
                />
                <Text fontWeight="bold">{RTOKEN_SYMBOL} staking repartition:</Text>
                <Funds noImage={true} showTotal={false} showPerc={true} funds={
                  [
                    {
                      label: 'Staked via FiRM',
                      balance: stakedViaFirm,
                      usdPrice: geckoPrices[RTOKEN_CG_ID]?.usd!,
                    },
                    {
                      label: 'Staked via Frontier',
                      balance: stakedViaFrontier,
                      usdPrice: geckoPrices[RTOKEN_CG_ID]?.usd!,
                    },
                  ]
                }
                />
                <Text fontWeight="bold">Monthly distribution to stakers:</Text>
                <Text>{preciseCommify(rewardsPerMonth, 0)} {RTOKEN_SYMBOL} (~{preciseCommify(rewardsPerMonth * geckoPrices[RTOKEN_CG_ID]?.usd, 0, true)})</Text>
              </>
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
