import { Flex, Text } from '@chakra-ui/react'

import Layout from '@app/components/common/Layout'
import { AppNav } from '@app/components/common/Navbar'
import Head from 'next/head'
import { ShrinkableInfoMessage } from '@app/components/common/Messages'
import { GovernanceFlowChart } from '@app/components/Transparency/GovernanceFlowChart'
import { getNetworkConfigConstants } from '@app/util/networks';
import { NetworkIds } from '@app/types'
import useEtherSWR from '@app/hooks/useEtherSWR'
import { commify, parseEther } from '@ethersproject/units'
import { formatEther } from 'ethers/lib/utils';
import { usePrices } from '@app/hooks/usePrices'
import { useTVL } from '@app/hooks/useTVL'
import { TransparencyTabs } from '@app/components/Transparency/TransparencyTabs';
import Link from '@app/components/common/Link'
import { ExternalLinkIcon } from '@chakra-ui/icons';
import { useDAO } from '@app/hooks/useDAO'
import { SuppplyInfos } from '@app/components/common/Dataviz/SupplyInfos'
import { Funds } from '@app/components/Transparency/Funds'
import { shortenNumber } from '@app/util/markets'

const { INV, XINV, ESCROW, COMPTROLLER, TREASURY, GOVERNANCE, DOLA, TOKENS, DEPLOYER } = getNetworkConfigConstants(NetworkIds.mainnet);

const defaultValues = {
  comptroller: COMPTROLLER,
  compGuard: DEPLOYER,
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
  govGuard: DEPLOYER,
  govTreasury: TREASURY,
  govToken: INV,
  govStakedToken: XINV,
  dola: DOLA,
  dolaOperator: TREASURY,
}

export const Overview = () => {
  const { prices: geckoPrices } = usePrices()
  const { data: tvlData } = useTVL()
  const { dolaTotalSupply, invTotalSupply, fantom, treasury, anchorReserves } = useDAO();

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

  const [quorumVotes, proposalThreshold] =
    otherData || [parseEther('4000'), parseEther('1000')];

  const tvlprices = Object.fromEntries(new Map(tvlData?.anchor?.assets.map(assetWithBalance => {
    return [assetWithBalance.coingeckoId || assetWithBalance.symbol, { usd: assetWithBalance.usdPrice }]
  })));
  const prices = { ...geckoPrices, ...tvlprices };

  return (
    <Layout>
      <Head>
        <title>{process.env.NEXT_PUBLIC_TITLE} - Transparency Overview</title>
      </Head>
      <AppNav active="Transparency" />
      <TransparencyTabs active="overview" />
      <Flex w="full" justify="center" direction={{ base: 'column', xl: 'row' }}>
        <Flex direction="column" py="2">
          <GovernanceFlowChart {...govFlowChartData} />
        </Flex>
        <Flex direction="column" p={{ base: '4', xl: '0' }} ml="2">
          <Flex w={{ base: 'full', xl: 'sm' }} justify="center">
            <ShrinkableInfoMessage
              title="🏛️ Governance Rules"
              description={
                <>
                  <Flex direction="row" w='full' justify="space-between">
                    <Text>- Min. Quorum required for a vote to pass:</Text>
                    <Text>{commify(parseFloat(formatEther(quorumVotes)))}</Text>
                  </Flex>
                  <Flex direction="row" w='full' justify="space-between">
                    <Text>- Min. Voting Power required to create proposals:</Text>
                    <Text>{commify(parseFloat(formatEther(proposalThreshold)))}</Text>
                  </Flex>
                </>
              }
            />
          </Flex>
          {
            !!treasury && <Flex w={{ base: 'full', xl: 'sm' }} mt="5" justify="center">
              <ShrinkableInfoMessage
                title="🏦 Treasury Funds"
                description={
                  <>
                    <Text>In Treasury Contract:</Text>
                    <Funds
                      prices={prices}
                      funds={treasury}
                      boldTotal={false}
                    />
                    <Text mt="2">In Anchor Reserves:</Text>
                    <Funds
                      prices={prices}
                      funds={anchorReserves}
                      boldTotal={false}
                    />
                    <Flex mt="2" direction="row" w='full' justify="space-between">
                      <Text fontWeight="bold">COMBINED TOTAL:</Text>
                      <Text fontWeight="bold">
                        {
                          shortenNumber(treasury.concat(anchorReserves).reduce((prev, curr) => {
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
            </Flex>
          }
          <Flex w={{ base: 'full', xl: 'sm' }} mt="5" justify="center">
            {!!tvlData && <ShrinkableInfoMessage
              title={<Flex alignItems="center">
                ⚓ Anchor Total Value Locked (
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
          </Flex>
          <Flex w={{ base: 'full', xl: 'sm' }} mt="5" justify="center">
            <SuppplyInfos token={TOKENS[INV]} supplies={[
              { chainId: NetworkIds.mainnet, supply: invTotalSupply - fantom?.invTotalSupply },
              { chainId: NetworkIds.ftm, supply: fantom?.invTotalSupply },
            ]}
            />
          </Flex>
          <Flex w={{ base: 'full', xl: 'sm' }} mt="5" justify="center">
            <SuppplyInfos token={TOKENS[DOLA]} supplies={[
              { chainId: NetworkIds.mainnet, supply: dolaTotalSupply - fantom?.dolaTotalSupply },
              { chainId: NetworkIds.ftm, supply: fantom?.dolaTotalSupply },
            ]}
            />
          </Flex>
          <Flex w={{ base: 'full', xl: 'sm' }} mt="5" justify="center">
            <ShrinkableInfoMessage
              title="⚡ Roles & Powers"
              description={
                <>
                  <Flex direction="row" w='full' justify="space-between">
                    <Text fontWeight="bold">- Pause Guardian:</Text>
                    <Text>Pause (but not unpause) a Market</Text>
                  </Flex>
                  <Flex direction="row" w='full' justify="space-between">
                    <Text fontWeight="bold">- Anchor Admin:</Text>
                    <Text>All rights on Anchor</Text>
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
                </>
              }
            />
          </Flex>
        </Flex>
      </Flex>
    </Layout>
  )
}

export default Overview
