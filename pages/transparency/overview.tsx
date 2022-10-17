import { Flex, Text, VStack } from '@chakra-ui/react'

import Layout from '@app/components/common/Layout'
import { AppNav } from '@app/components/common/Navbar'
import Head from 'next/head'
import { ShrinkableInfoMessage } from '@app/components/common/Messages'
import { GovernanceFlowChart } from '@app/components/Transparency/GovernanceFlowChart'
import { getNetworkConfigConstants } from '@app/util/networks';
import { NetworkIds } from '@app/types'
import useEtherSWR from '@app/hooks/useEtherSWR'
import { usePricesV2 } from '@app/hooks/usePrices'
import { useTVL } from '@app/hooks/useTVL'
import { TransparencyTabs } from '@app/components/Transparency/TransparencyTabs';
import Link from '@app/components/common/Link'
import { ExternalLinkIcon } from '@chakra-ui/icons';
import { useDAO } from '@app/hooks/useDAO'
import { SupplyInfos } from '@app/components/common/Dataviz/SupplyInfos'
import { Funds } from '@app/components/Transparency/Funds'
import { shortenNumber } from '@app/util/markets'
import { RTOKEN_SYMBOL } from '@app/variables/tokens'
import { GovernanceRules } from '@app/components/Governance/GovernanceRules'

const { INV, XINV, ESCROW, COMPTROLLER, TREASURY, GOVERNANCE, DOLA, TOKENS, DEPLOYER, XINV_MANAGER, POLICY_COMMITTEE, OP_BOND_MANAGER, MULTISIGS } = getNetworkConfigConstants(NetworkIds.mainnet);

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
  dolaOperator: TREASURY,
  opBondManager: OP_BOND_MANAGER,
}

export const Overview = () => {
  const { prices } = usePricesV2(true)
  const { data: tvlData } = useTVL()
  const { dolaTotalSupply, invTotalSupply, fantom, optimism, treasury, anchorReserves, bonds } = useDAO();

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
        <title>{process.env.NEXT_PUBLIC_TITLE} - Transparency Overview</title>
        <meta name="og:title" content="Inverse Finance - Transparency" />
        <meta name="og:description" content="Overview with Contracts Flowchart and key metrics" />
        <meta name="og:image" content="https://inverse.finance/assets/social-previews/transparency-overview.png" />
        <meta name="description" content="Overview with Contracts Flowchart and key metrics" />
        <meta name="keywords" content="Inverse Finance, dao, transparency, overview" />
      </Head>
      <AppNav active="Transparency" activeSubmenu="Overview" />
      <TransparencyTabs active="overview" />
      <Flex w="full" justify="center" direction={{ base: 'column', xl: 'row' }}>
        <Flex direction="column" py="2">
          <GovernanceFlowChart {...govFlowChartData} />
        </Flex>
        <VStack spacing={4} direction="column" pt="4" px={{ base: '4', xl: '0' }} w={{ base: 'full', xl: 'sm' }}>
          <GovernanceRules />
          {
            !!treasury &&
            <ShrinkableInfoMessage
              title="🏦 Treasury Funds"
              description={
                <>
                  <Text fontWeight="bold">In Treasury Contract:</Text>
                  <Funds
                    prices={prices}
                    funds={treasury}
                    boldTotal={false}
                  />
                  <Text mt="2" fontWeight="bold">Current Funds reserved for bonds:</Text>
                  <Funds
                    prices={prices}
                    showPerc={false}
                    funds={bonds?.balances.filter(({ token }) => token.symbol === RTOKEN_SYMBOL)}
                    boldTotal={false}
                    showTotal={false}
                  />
                  <Text mt="2" fontWeight="bold">Current Funds received via bonds:</Text>
                  <Funds
                    prices={prices}
                    funds={bonds?.balances.filter(({ token }) => token.symbol !== RTOKEN_SYMBOL)}
                    boldTotal={false}
                  />
                  <Text mt="2" fontWeight="bold">In Frontier Reserves:</Text>
                  <Funds
                    prices={prices}
                    funds={anchorReserves}
                    boldTotal={false}
                  />
                  <Flex mt="2" direction="row" w='full' justify="space-between">
                    <Text fontWeight="bold">COMBINED TOTAL:</Text>
                    <Text fontWeight="bold">
                      {
                        shortenNumber(treasury.concat(anchorReserves).concat(bonds?.balances).reduce((prev, curr) => {
                          const priceKey = curr.token.coingeckoId || curr.token.symbol;
                          const usdBalance = !!prices && !!priceKey && !!prices[priceKey] && curr.balance ? curr.balance * prices[priceKey].usd : 0;
                          return prev + usdBalance;
                        }, 0), 2, true)
                      }
                    </Text>
                  </Flex>
                </>
              }
            />
          }
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
          <SupplyInfos token={TOKENS[INV]} supplies={[
            { chainId: NetworkIds.mainnet, supply: invTotalSupply - fantom?.invTotalSupply - optimism?.invTotalSupply },
            { chainId: NetworkIds.ftm, supply: fantom?.invTotalSupply },
            { chainId: NetworkIds.optimism, supply: optimism?.invTotalSupply },
          ]}
          />

          <SupplyInfos token={TOKENS[DOLA]} supplies={[
            { chainId: NetworkIds.mainnet, supply: dolaTotalSupply - fantom?.dolaTotalSupply - optimism?.dolaTotalSupply },
            { chainId: NetworkIds.ftm, supply: fantom?.dolaTotalSupply },
            { chainId: NetworkIds.optimism, supply: optimism?.dolaTotalSupply },
          ]}
          />
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
