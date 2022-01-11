import { Flex, Text } from '@chakra-ui/react'

import Layout from '@inverse/components/common/Layout'
import { AppNav } from '@inverse/components/common/Navbar'
import Head from 'next/head'
import { Breadcrumbs } from '@inverse/components/common/Breadcrumbs'
import { InfoMessage } from '@inverse/components/common/Messages'
import { GovernanceFlowChart } from '@inverse/components/common/Dataviz/GovernanceFlowChart'
import { getNetworkConfigConstants } from '@inverse/config/networks';
import { NetworkIds } from '@inverse/types'
import useEtherSWR from '@inverse/hooks/useEtherSWR'
import { parseEther } from '@ethersproject/units'
import { formatEther } from 'ethers/lib/utils';

const { INV, XINV, ESCROW, COMPTROLLER, TREASURY, GOVERNANCE, DOLA } = getNetworkConfigConstants(NetworkIds.mainnet);

const defaultValues = {
  comptroller: COMPTROLLER,
  compGuard: '0x3FcB35a1CbFB6007f9BC638D388958Bc4550cB28',
  compAdmin: TREASURY,
  escrow: ESCROW,
  escrowGov: TREASURY,
  treasury: TREASURY,
  treasuryAdmin: GOVERNANCE,
  xinv: XINV,
  xinvComptroller: COMPTROLLER,
  xinvAdmin: TREASURY,
  xinvUnderlying: INV,
  xinvEscrow: ESCROW,
  governance: GOVERNANCE,
  govGuard: '0x3FcB35a1CbFB6007f9BC638D388958Bc4550cB28',
  govTreasury: TREASURY,
  govToken: INV,
  govStakedToken: XINV,
  dola: DOLA,
  dolaOperator: TREASURY,
}

const DEPLOYER = '0x3FcB35a1CbFB6007f9BC638D388958Bc4550cB28'

export const Governance = () => {
  const { data: xinvData } = useEtherSWR([
    [XINV, 'admin'],
    [XINV, 'escrow'],
    [XINV, 'comptroller'],
    [XINV, 'underlying'],
  ])

  const [xinvAdmin, xinvEscrow, comptroller, xinvUnderlying] = xinvData || [TREASURY, ESCROW, COMPTROLLER, INV]

  const { data: daoData } = useEtherSWR([
    [xinvEscrow.toLowerCase(), 'governance'],
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
    || [TREASURY, TREASURY, DEPLOYER, GOVERNANCE, DEPLOYER, INV, XINV, TREASURY, TREASURY];

  const fetchedValues = { xinvAdmin, xinvEscrow, comptroller, xinvUnderlying, escrowGov, compAdmin, compGuard, treasuryAdmin, govGuard, govToken, govStakedToken, govTreasury, dolaOperator }
  const govFlowChartData = { ...defaultValues, ...fetchedValues };

  const { data: otherData } = useEtherSWR([
    [GOVERNANCE, 'quorumVotes'],
    [GOVERNANCE, 'proposalThreshold'],
  ])

  const [quorumVotes, proposalThreshold] = otherData || [parseEther('4000'), parseEther('1000')];

  return (
    <Layout>
      <Head>
        <title>Inverse Finance - Governance FlowChart</title>
      </Head>
      <AppNav active="Governance" />
      <Breadcrumbs
        w="7xl"
        breadcrumbs={[
          { label: 'Governance', href: '/governance' },
          { label: 'Diagrams', href: '#' },
        ]}
      />
      <Flex w="full" justify="center" direction={{ base: 'column', xl: 'row' }}>
        <Flex direction="column">
          <GovernanceFlowChart {...govFlowChartData} />
        </Flex>
        <Flex direction="column">
          <Flex w={{ base: 'full', xl: 'sm' }} justify="center">
            <InfoMessage
              alertProps={{ fontSize: '12px', w: 'full' }}
              title="Governance Data"
              description={
                <>
                  <Flex direction="row" w='full' justify="space-between">
                    <Text>- Quorum required for a vote to pass:</Text>
                    <Text>{formatEther(quorumVotes)}</Text>
                  </Flex>
                  <Flex direction="row" w='full' justify="space-between">
                    <Text>- Voting Power required to create proposals:</Text>
                    <Text>{formatEther(proposalThreshold)}</Text>
                  </Flex>
                </>
              }
            />
          </Flex>
        </Flex>
      </Flex>
    </Layout>
  )
}

export default Governance
