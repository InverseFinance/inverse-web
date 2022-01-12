import { Flex, Image, Text } from '@chakra-ui/react'

import Layout from '@inverse/components/common/Layout'
import { AppNav } from '@inverse/components/common/Navbar'
import Head from 'next/head'
import { Breadcrumbs } from '@inverse/components/common/Breadcrumbs'
import { InfoMessage } from '@inverse/components/common/Messages'
import { GovernanceFlowChart } from '@inverse/components/common/Dataviz/GovernanceFlowChart'
import { getNetworkConfigConstants } from '@inverse/config/networks';
import { NetworkIds, TokenList, TokenWithBalance } from '@inverse/types'
import useEtherSWR from '@inverse/hooks/useEtherSWR'
import { commify, formatUnits, parseEther } from '@ethersproject/units'
import { formatEther } from 'ethers/lib/utils';
import { BigNumber } from 'ethers';
import { usePrices } from '@inverse/hooks/usePrices'
import { shortenNumber } from '@inverse/util/markets'
import { useTVL } from '@inverse/hooks/useTVL'
import { OLD_XINV } from '@inverse/config/constants'

const { INV, XINV, ESCROW, COMPTROLLER, TREASURY, GOVERNANCE, DOLA, DAI, TOKENS } = getNetworkConfigConstants(NetworkIds.mainnet);

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

const getBalanceInfos = (bn: BigNumber, decimals: number, usdPrice = 0): {
  qty: number, usdValue: number, formatted: string
} => {
  const qty = parseFloat(formatUnits(bn, decimals));
  const usdValue = qty * usdPrice;
  return { qty, usdValue, formatted: `${shortenNumber(qty, 2)} (${shortenNumber(usdValue, 2, true)})` };
}

const AnchorFunds = ({ tvlData }: { tvlData: { tvl: number, anchor: { tvl: number, assets: TokenWithBalance[] } } }) => {
  const content = tvlData?.anchor?.assets
    .sort((a, b) => b.usdBalance - a.usdBalance)
    .map(asset => {
      return <Flex key={asset.address} direction="row" w='full' justify="space-between">
        <Text>- <Image display="inline-block" src={asset.image} ignoreFallback={true} w='15px' h='15px' mr="2" ml="1" />
          {asset.symbol}{asset.address === OLD_XINV && ' (old)'}:
        </Text>
        <Text>{shortenNumber(asset.balance, 2)} ({shortenNumber(asset.usdBalance, 2, true)})</Text>
      </Flex>
    })
  return (
    <>
      {content}
      <Flex fontWeight="bold" direction="row" w='full' justify="space-between">
        <Text>- TOTAL worth in USD:</Text>
        {!!tvlData && <Text>{shortenNumber(tvlData?.anchor?.tvl, 2, true)}</Text>}
      </Flex>
    </>
  )
}

const TreasuryFunds = ({
  addresses,
  values,
  tokens,
  prices,
}: {
  addresses: string[],
  values: BigNumber[],
  tokens: TokenList,
  prices: { [key: string]: { usd: number } },
}) => {
  let totalUsd = 0;
  const content = addresses.map((address, i) => {
    const token = tokens[address];
    const price = ['DOLA', 'DAI'].includes(token.symbol) ? 1 : (prices[token.coingeckoId!] || { usd: 0 }).usd
    const balanceInfos = getBalanceInfos(values[i], token.decimals, price);
    totalUsd += balanceInfos.usdValue;

    return <Flex key={address} direction="row" w='full' justify="space-between">
      <Text>- {token.symbol}s:</Text>
      {!!token && <Text>{balanceInfos.formatted}</Text>}
    </Flex>
  })
  return (
    <>
      {content}
      <Flex fontWeight="bold" direction="row" w='full' justify="space-between">
        <Text>- TOTAL worth in USD:</Text>
        {!!totalUsd && <Text>{shortenNumber(totalUsd, 2, true)}</Text>}
      </Flex>
    </>
  )
}

export const Overview = () => {
  const { prices } = usePrices()
  const { data: tvlData } = useTVL()

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
    [INV, 'balanceOf', TREASURY],
    [XINV, 'balanceOf', TREASURY],
    [DOLA, 'balanceOf', TREASURY],
    [DAI, 'balanceOf', TREASURY],
  ])

  const [quorumVotes, proposalThreshold, invBal, xinvBal, dolaBal, daiBal] =
    otherData || [parseEther('4000'), parseEther('1000'), BigNumber.from('0'), BigNumber.from('0'), BigNumber.from('0'), BigNumber.from('0')];

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
          { label: 'Diagrams', href: '/governance/diagrams' },
          { label: 'Overview', href: '#' },
        ]}
      />
      <Flex w="full" justify="center" direction={{ base: 'column', xl: 'row' }}>
        <Flex direction="column">
          <GovernanceFlowChart {...govFlowChartData} />
        </Flex>
        <Flex direction="column" p={{ base: '4', xl: '0' }}>
          <Flex w={{ base: 'full', xl: 'sm' }} justify="center">
            <InfoMessage
              alertProps={{ fontSize: '12px', w: 'full' }}
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
          <Flex w={{ base: 'full', xl: 'sm' }} mt="5" justify="center">
            {!!otherData && <InfoMessage
              alertProps={{ fontSize: '12px', w: 'full' }}
              title="🏦 Treasury Funds"
              description={
                <>
                  <TreasuryFunds addresses={[INV, DOLA, DAI]} values={[invBal, dolaBal, daiBal]} prices={prices} tokens={TOKENS} />
                </>
              }
            />}
          </Flex>
          <Flex w={{ base: 'full', xl: 'sm' }} mt="5" justify="center">
            {!!tvlData && <InfoMessage
              alertProps={{ fontSize: '12px', w: 'full' }}
              title="⚓ Anchor Total Value Locked"
              description={
                <>
                  <AnchorFunds tvlData={tvlData} />
                </>
              }
            />}
          </Flex>
          <Flex w={{ base: 'full', xl: 'sm' }} mt="5" justify="center">
            <InfoMessage
              title="⚡ Roles & Powers"
              alertProps={{ fontSize: '12px', w: 'full' }}
              description={
                <>
                  <Flex direction="row" w='full' justify="space-between">
                    <Text>- Pause Guardian:</Text>
                    <Text>pause (but not unpause) an Anchor Market</Text>
                  </Flex>
                  <Flex direction="row" w='full' justify="space-between">
                    <Text>- Anchor Admin:</Text>
                    <Text>all rights on Anchor</Text>
                  </Flex>
                  <Flex direction="row" w='full' justify="space-between">
                    <Text>- xINV Admin:</Text>
                    <Text>change INV APY</Text>
                  </Flex>
                  <Flex direction="row" w='full' justify="space-between">
                    <Text>- Escrow Admin:</Text>
                    <Text>change xINV escrow duration</Text>
                  </Flex>
                  <Flex direction="row" w='full' justify="space-between">
                    <Text>- Dola operator:</Text>
                    <Text>add/remove DOLA minters</Text>
                  </Flex>
                  <Flex direction="row" w='full' justify="space-between">
                    <Text whiteSpace="nowrap">- Gov Guardian:</Text>
                    <Text>update Gov. rules, cancel a proposal</Text>
                  </Flex>
                  <Flex direction="row" w='full' justify="space-between">
                    <Text whiteSpace="nowrap">- Treasury Admin:</Text>
                    <Text>use treasury funds</Text>
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
