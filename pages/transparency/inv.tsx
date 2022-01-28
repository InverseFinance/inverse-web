import { Flex, Text } from '@chakra-ui/react'

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
import { SuppplyInfos } from '@app/components/common/Dataviz/SupplyInfos'
import { Funds } from '@app/components/Transparency/Funds'
import { useMarkets } from '@app/hooks/useMarkets'
import { InvFlowChart } from '@app/components/Transparency/InvFlowChart'
import { RTOKEN_CG_ID, RTOKEN_SYMBOL } from '@app/variables/tokens'
import { shortenNumber } from '@app/util/markets'

const { INV, XINV, XINV_V1, ESCROW, COMPTROLLER, TREASURY, GOVERNANCE, TOKENS, DEPLOYER } = getNetworkConfigConstants(NetworkIds.mainnet);

const defaultValues = {
  escrow: ESCROW,
  treasury: TREASURY,
  treasuryAdmin: GOVERNANCE,
  xinv: XINV,
  xinvOld: XINV_V1!,
  xinvComptroller: COMPTROLLER,
  xinvAdmin: TREASURY,
  xinvUnderlying: INV,
  xinvEscrow: ESCROW,
  govTreasury: TREASURY,
}

export const InvPage = () => {
  const { prices: geckoPrices } = usePrices()
  const { markets } = useMarkets()
  const { invTotalSupply, fantom } = useDAO();

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
  ])

  const [escrowGov, govTreasury] = daoData
    || [TREASURY, TREASURY];

  const fetchedValues = { xinvAdmin, xinvEscrow, xinvUnderlying, escrowGov, govTreasury }
  const invFlowChartData = { ...defaultValues, ...fetchedValues };

  // (xinv old excluded)
  const invSupplied = markets.find(m => m.token === XINV)?.supplied || 0;
  const percentageInvSupplied = invTotalSupply ? invSupplied / invTotalSupply * 100 : 0;

  return (
    <Layout>
      <Head>
        <title>{process.env.NEXT_PUBLIC_TITLE} - Transparency Overview</title>
      </Head>
      <AppNav active="Transparency" />
      <TransparencyTabs active="inv" />
      <Flex w="full" justify="center" direction={{ base: 'column', xl: 'row' }}>
        <Flex direction="column" py="2">
          <InvFlowChart {...invFlowChartData} />
        </Flex>
        <Flex direction="column" p={{ base: '4', xl: '0' }}>
          <Flex w={{ base: 'full', xl: 'sm' }} mt="5" justify="center">
            <SuppplyInfos token={TOKENS[INV]} supplies={[
              { chainId: NetworkIds.mainnet, supply: invTotalSupply - fantom?.invTotalSupply },
              { chainId: NetworkIds.ftm, supply: fantom?.invTotalSupply },
            ]}
            />
          </Flex>
          <Flex w={{ base: 'full', xl: 'sm' }} mt="5" justify="center">
            <ShrinkableInfoMessage
              title={`🔒 ${RTOKEN_SYMBOL} Staked on Anchor`}
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
                      })
                  }
                  />
                  <Flex direction="row" w='full' justify="space-between">
                    <Text>- % of {RTOKEN_SYMBOL} Supply staked (old excluded):</Text>
                    <Text>{shortenNumber(percentageInvSupplied, 2)}%</Text>
                  </Flex>
                </>
              }
            />
          </Flex>
          <Flex w={{ base: 'full', xl: 'sm' }} mt="5" justify="center">
            <ShrinkableInfoMessage
              title="✨ Monthly INV rewards for each Anchor Market"
              description={
                <Funds funds={markets.map(market => {
                  return { token: market.underlying, balance: market.rewardsPerMonth, usdPrice: geckoPrices[RTOKEN_CG_ID]?.usd! }
                })}
                />
              }
            />
          </Flex>
          <Flex w={{ base: 'full', xl: 'sm' }} mt="5" justify="center">
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
                </>
              }
            />
          </Flex>
        </Flex>
      </Flex>
    </Layout>
  )
}

export default InvPage
