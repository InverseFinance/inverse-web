import { Flex, Text, VStack } from '@chakra-ui/react'

import Layout from '@app/components/common/Layout'
import { AppNav } from '@app/components/common/Navbar'
import Head from 'next/head'
import { ShrinkableInfoMessage } from '@app/components/common/Messages'
import { GovernanceFlowChart } from '@app/components/Transparency/GovernanceFlowChart'
import { getNetworkConfigConstants } from '@app/util/networks';
import { NetworkIds } from '@app/types'
import useEtherSWR from '@app/hooks/useEtherSWR'
import { TransparencyTabs } from '@app/components/Transparency/TransparencyTabs';
import { useDAO } from '@app/hooks/useDAO'
import { SupplyInfos } from '@app/components/common/Dataviz/SupplyInfos'
import { GovernanceRules } from '@app/components/Governance/GovernanceRules'
import { DolaSupplies } from '@app/components/common/Dataviz/DolaSupplies'

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
  const { dolaSupplies, invSupplies } = useDAO();

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
        <meta name="og:image" content="https://inverse.finance/assets/social-previews/transparency-overview.png" />
        <meta name="description" content="Overview with Contracts Flowchart and key metrics" />
        <meta name="keywords" content="Inverse Finance, dao, transparency, overview" />
      </Head>
      <AppNav active="Transparency" activeSubmenu="Overview" hideAnnouncement={true} />
      <TransparencyTabs active="overview" />
      <Flex w="full" justify="center" direction={{ base: 'column', xl: 'row' }}>
        <Flex direction="column" py="2">
          <GovernanceFlowChart {...govFlowChartData} />
        </Flex>
        <VStack spacing={4} direction="column" pt="4" px={{ base: '4', xl: '0' }} w={{ base: 'full', xl: 'sm' }}>
          <GovernanceRules />                
          <SupplyInfos token={TOKENS[INV]} supplies={invSupplies} />          
          <DolaSupplies supplies={dolaSupplies.filter(chain => chain.supply > 0)} />
          <ShrinkableInfoMessage
            title="⚡ Roles & Powers"
            description={
              <>
                <Flex direction="row" w='full' justify="space-between">
                  <Text fontWeight="bold">- Pause Guardian:</Text>
                  <Text>Pause (but not unpause) a Market</Text>
                </Flex>
                <Flex direction="row" w='full' justify="space-between">
                  <Text fontWeight="bold">- Frontier Admin:</Text>
                  <Text>All rights on Frontier</Text>
                </Flex>
                <Flex direction="row" w='full' justify="space-between">
                  <Text fontWeight="bold">- x{process.env.NEXT_PUBLIC_REWARD_TOKEN_SYMBOL} Admin:</Text>
                  <Text>Change {process.env.NEXT_PUBLIC_REWARD_TOKEN_SYMBOL} APY</Text>
                </Flex>
                <Flex direction="row" w='full' justify="space-between">
                  <Text fontWeight="bold">- Escrow Admin:</Text>
                  <Text>Change x{process.env.NEXT_PUBLIC_REWARD_TOKEN_SYMBOL} escrow duration</Text>
                </Flex>
                <Flex direction="row" w='full' justify="space-between">
                  <Text fontWeight="bold">- Dola operator:</Text>
                  <Text>Add/remove DOLA minters</Text>
                </Flex>
                <Flex direction="row" w='full' justify="space-between">
                  <Text fontWeight="bold" whiteSpace="nowrap">- Gov Guardian:</Text>
                  <Text>Update Gov. rules, cancel a proposal</Text>
                </Flex>
                <Flex direction="row" w='full' justify="space-between">
                  <Text fontWeight="bold" whiteSpace="nowrap">- Treasury Admin:</Text>
                  <Text>Use treasury funds</Text>
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

export default Overview
