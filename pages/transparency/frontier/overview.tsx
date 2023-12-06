import { Flex, Text, VStack } from '@chakra-ui/react'

import Layout from '@app/components/common/Layout'
import { AppNav } from '@app/components/common/Navbar'
import Head from 'next/head'
import { ShrinkableInfoMessage } from '@app/components/common/Messages'
import { getNetworkConfigConstants } from '@app/util/networks';
import { NetworkIds } from '@app/types'
import useEtherSWR from '@app/hooks/useEtherSWR'
import { usePricesV2 } from '@app/hooks/usePrices'
import { useTVL } from '@app/hooks/useTVL'
import { TransparencyOtherTabs } from '@app/components/Transparency/TransparencyTabs';
import Link from '@app/components/common/Link'
import { ExternalLinkIcon } from '@chakra-ui/icons';
import { useDAO } from '@app/hooks/useDAO'
import { Funds } from '@app/components/Transparency/Funds'
import { FrontierFlowChart } from '@app/components/Transparency/FrontierFlowChart'

const { INV, XINV, ESCROW, COMPTROLLER, TREASURY, GOVERNANCE, DOLA, DBR, TOKENS, DEPLOYER, XINV_MANAGER, POLICY_COMMITTEE, OP_BOND_MANAGER, MULTISIGS } = getNetworkConfigConstants(NetworkIds.mainnet);

const RWG = MULTISIGS.find(m => m.shortName === 'RWG')?.address;

const defaultValues = {
  comptroller: COMPTROLLER,
  compGuard: RWG,
  compAdmin: TREASURY,
  escrow: ESCROW,
  escrowGov: TREASURY,
  treasury: TREASURY,
  treasuryAdmin: GOVERNANCE,
  xinv: XINV,
  xinvComptroller: COMPTROLLER,
  xinvAdmin: XINV_MANAGER,
  xinvManagerPC: POLICY_COMMITTEE,
  xinvUnderlying: INV,
  xinvEscrow: ESCROW,
  governance: GOVERNANCE,
  govGuard: DEPLOYER,
  govTreasury: TREASURY,
  govToken: INV,
  govStakedToken: XINV,
  dola: DOLA,
  dbr: DBR,
  dolaOperator: TREASURY,
  opBondManager: OP_BOND_MANAGER,
}

export const Overview = () => {
  const { prices } = usePricesV2(true)
  const { data: tvlData } = useTVL()
  const { anchorReserves } = useDAO();

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
    [DOLA, 'operator'],
  ])

  const [escrowGov, compAdmin, compGuard, treasuryAdmin, govGuard, govToken, govStakedToken, govTreasury, dolaOperator] = daoData
    || [TREASURY, TREASURY, RWG, GOVERNANCE, DEPLOYER, INV, XINV, TREASURY, TREASURY];

  const fetchedValues = { xinvAdmin, xinvEscrow, comptroller, xinvUnderlying, escrowGov, compAdmin, compGuard, treasuryAdmin, govGuard, govToken, govStakedToken, govTreasury, dolaOperator }
  const govFlowChartData = { ...defaultValues, ...fetchedValues };

  return (
    <Layout>
      <Head>
        <title>Inverse Finance - Transparency Overview</title>
        <meta name="og:title" content="Inverse Finance - Transparency" />
        <meta name="og:description" content="Overview with Contracts Flowchart and key metrics" />
        <meta name="og:image" content="https://inverse.finance/assets/social-previews/transparency-portal.png" />
        <meta name="description" content="Overview with Contracts Flowchart and key metrics" />
        <meta name="keywords" content="Inverse Finance, dao, transparency, overview" />
      </Head>
      <AppNav active="Transparency" activeSubmenu="Frontier & Other" hideAnnouncement={true} />
      <TransparencyOtherTabs active="frontier-overview" />
      <Flex w="full" justify="center" direction={{ base: 'column', xl: 'row' }}>
        <Flex direction="column" py="2">
          <FrontierFlowChart {...govFlowChartData} />
        </Flex>
        <VStack spacing={4} direction="column" pt="4" px={{ base: '4', xl: '0' }} w={{ base: 'full', xl: 'sm' }}>
          {!!tvlData && <ShrinkableInfoMessage
            title={<Flex alignItems="center">
              Frontier Total Value Locked (
              <Link isExternal href="https://dune.xyz/naoufel/anchor-metrics">
                Analytics <ExternalLinkIcon mb="1px" fontSize="10px" />
              </Link>
              )
            </Flex>
            }
            description={
              <Funds prices={prices}
                funds={
                  tvlData?.anchor?.assets.map(assetWithBalance => {
                    return { balance: assetWithBalance.balance, token: assetWithBalance }
                  })
                } />
            }
          />}
          <ShrinkableInfoMessage
            title={<Text mt="2" fontWeight="bold">In Frontier Reserves:</Text>}
            description={
              <Funds
                prices={prices}
                funds={anchorReserves}
                boldTotal={false}
              />
            }
          />
        </VStack>
      </Flex>
    </Layout>
  )
}

export default Overview
