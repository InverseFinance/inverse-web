import { Box, Flex, HStack, Stack, Text, VStack } from '@chakra-ui/react'

import Layout from '@app/components/common/Layout'
import { AppNav } from '@app/components/common/Navbar'
import Head from 'next/head'
import { usePricesV2 } from '@app/hooks/usePrices'
import { useDAO, useFedHistory, useFedPolicyChartData, useFedRevenues, useFedRevenuesChartData } from '@app/hooks/useDAO'
import { Funds } from '@app/components/Transparency/Funds'
import { TOKENS, getToken } from '@app/variables/tokens'
import Table from '@app/components/common/Table'
import moment from 'moment'
import ScannerLink from '@app/components/common/ScannerLink'
import { shortenNumber } from '@app/util/markets'
import Container from '@app/components/common/Container'
import { getScanner } from '@app/util/web3'
import { InfoMessage, WarningMessage } from '@app/components/common/Messages'
import { fetchJson } from 'ethers/lib/utils'
import { FedAreaChart } from '@app/components/Transparency/fed/FedAreaChart'
import { FedBarChart } from '@app/components/Transparency/fed/FedBarChart'

const columns = [
  {
    field: 'current_timestamp',
    label: 'Time',
    header: ({ ...props }) => <Flex minW="100px" {...props} />,
    value: ({ current_timestamp }) => {
      return (
        <Flex minW="100px">
          <VStack spacing="0">
            <Text fontSize="12px">{moment(current_timestamp * 1000).fromNow()}</Text>
            <Text fontSize="10px">{moment(current_timestamp * 1000).format('MMM Do YYYY')}</Text>
          </VStack>
        </Flex>
      )
    },
  },
  {
    field: 'txn_hash',
    label: 'Transaction',
    header: ({ ...props }) => <Flex minW="120px" {...props} />,
    value: ({ txn_hash }) => <Flex minW="120px">
      <ScannerLink value={txn_hash} type="tx" />
    </Flex>,
  },
  {
    field: 'user',
    label: 'From',
    header: ({ ...props }) => <Flex minW="120px" {...props} />,
    value: ({ user }) => <Flex minW="120px">
      <ScannerLink value={user} type="address" />
    </Flex>,
  },
  {
    field: 'weight',
    label: 'Weight',
    header: ({ ...props }) => <Flex justify="flex-end" minW="60px" {...props} />,
    value: ({ weight }) => <Flex justify="flex-end" minW="60px">
      {shortenNumber(weight / 100, 2)}%
    </Flex>,
  },
  {
    field: 'user_vecrv_balance',
    label: 'veCrv',
    header: ({ ...props }) => <Flex justify="flex-end" minW="60px" {...props} />,
    value: ({ user_vecrv_balance }) => <Flex justify="flex-end" minW="60px">
      {shortenNumber(parseFloat(user_vecrv_balance), 2)}
    </Flex>,
  },
  {
    field: 'user_lock_expire',
    label: 'Lock Expire',
    header: ({ ...props }) => <Flex minW="100px" {...props} />,
    value: ({ user_lock_expire }) => {
      return (
        <Flex minW="100px">
          <VStack spacing="0">
            <Text fontSize="12px">{moment(user_lock_expire * 1000).fromNow()}</Text>
            <Text fontSize="10px">{moment(user_lock_expire * 1000).format('MMM Do YYYY')}</Text>
          </VStack>
        </Flex>
      )
    },
  },
]

export interface YearnFedData {
  last_update_str: string;
  last_update: number;
  yearn: Yearn;
  curve: Curve;
  inverse: Inverse;
}
export interface Yearn {
  vaults: (VaultsEntity)[];
  strategies: (StrategiesEntity)[];
}
export interface VaultsEntity {
  symbol: string;
  name: string;
  want_symbol: string;
  want_address: string;
  decimals: number;
  type: string;
  address: string;
  price_per_share: number;
  deposit_limit: number;
  vault_performance_fee: number;
  management_fee: number;
}
export interface StrategiesEntity {
  type: string;
  address: string;
  vault_address: string;
  name: string;
  want_symbol: string;
  want_address: string;
  decimals: number;
  total_gain: number;
  total_gain_usd: number;
  total_loss: number;
  total_loss_usd: number;
  last_report: number;
  total_assets: number;
  strat_performance_fee: number;
  max_slippage_in: number;
  max_slippage_out: number;
  estimated_total_assets: number;
  reports?: (null)[] | null;
}
export interface Curve {
  pool: Pool;
  gauge_votes: (GaugeVotesEntity)[];
}
export interface Pool {
  coins: (CoinsEntity)[];
  tvl: number;
}
export interface CoinsEntity {
  token_address: string;
  name: string;
  symbol: string;
  decimals: number;
  balance: number;
  slippage_deposit_1M: number;
  slippage_withdraw_1M: number;
}
export interface GaugeVotesEntity {
  block: number;
  txn_hash: string;
  weight: number;
  user_vecrv_balance: string;
  user: string;
  user_lock_time_remaining: number;
  user_lock_expire: number;
  current_timestamp: number;
  date_string: string;
  gauge: string;
  gauge_name?: string | null;
}
export interface Inverse {
  yearn_fed: YearnFed;
}
export interface YearnFed {
  address: string;
  chair: string;
  gov: string;
  supply: number;
  vault_address: string;
  yvtoken_balance: number;
  pending_profit: number;
  actions: (any)[];
}

export const YearnFed = ({ yearnFedData }: { yearnFedData: YearnFedData }) => {
  const { prices } = usePricesV2(true)
  const { feds } = useDAO();
  const { totalEvents: policyEvents } = useFedHistory();
  const { totalEvents: profitsEvents } = useFedRevenues();

  const chosenFedIndex = feds.findIndex(f => f.address === '0xcc180262347F84544c3a4854b87C34117ACADf94');
  const yearnFed = feds[chosenFedIndex];

  const fedHistoricalEvents = policyEvents.filter(e => e.fedIndex === (chosenFedIndex));
  const fedProfitsEvents = profitsEvents.filter(e => e.fedIndex === (chosenFedIndex));

  const { chartData: chartDataPolicies } = useFedPolicyChartData(fedHistoricalEvents, false);
  const { chartData: chartDataRevenues } = useFedRevenuesChartData(fedProfitsEvents, false);

  return (
    <Layout>
      <Head>
        <title>{process.env.NEXT_PUBLIC_TITLE} - Transparency Yearn Fed</title>
        <meta name="og:title" content="Inverse Finance - Yearn Fed" />
        <meta name="og:description" content="Yearn Fed" />
        <meta name="description" content="Inverse Finance Yearn Fed" />
      </Head>
      <AppNav active="Transparency" activeSubmenu="Treasury" />
      {
        !yearnFedData ?
          <WarningMessage alertProps={{ mt: "8" }} description="Could not fetch data form API" />
          :
          <Flex w="full" justify="center" justifyContent="center" direction={{ base: 'column', xl: 'row' }}>
            <Flex direction="column" py="2" px="5" maxWidth="1200px" w='full'>
              <Stack spacing="5" direction={{ base: 'column', lg: 'column' }} w="full" justify="space-around">

                <Container label="Curve Pool Assets" m="0" p="0" contentProps={{ px: { lg: '8' } }}>
                  <Stack direction={{ base: 'column-reverse', lg: 'row' }} alignItems="center" justifyContent="space-between" w='full'>
                    <VStack w={{ base: '100%', lg: '500px' }}>
                      <Funds showTotal={true} funds={yearnFedData.curve.pool.coins.map(c => ({ ...c, token: getToken(TOKENS, c.token_address) }))} prices={prices} type='balance' />
                      <Stack direction={{ base: 'column', md: 'row' }} pt="4" borderTop="1px solid #ccc" w="full">
                        {yearnFedData.curve.pool.coins.map(({ symbol, slippage_deposit_1M, slippage_withdraw_1M }) => {
                          return <InfoMessage
                            key={symbol}
                            title={`${symbol.toUpperCase()} Slippages`}
                            alertProps={{ w: { base: '100%', md: '50%' } }}
                            description={
                              <VStack spacing="0" fontSize="12px" key={symbol}>
                                <HStack w='full' justifyContent="space-between">
                                  <Text>1M Deposit:</Text>
                                  <Text>{shortenNumber(slippage_deposit_1M * 100, 4)}%</Text>
                                </HStack>
                                <HStack w='full' justifyContent="space-between">
                                  <Text>1M Withdraw:</Text>
                                  <Text>{shortenNumber(slippage_withdraw_1M * 100, 4)}%</Text>
                                </HStack>
                              </VStack>
                            }
                          />
                        })}
                      </Stack>
                    </VStack>
                    <VStack fontWeight="bold" pr={{ base: '0', lg: '100px' }}>
                      <Funds labelWithPercInChart={true} showTotal={false} showChartTotal={true} chartMode={true} funds={yearnFedData.curve.pool.coins.map(c => ({ ...c, token: getToken(TOKENS, c.token_address) }))} prices={prices} type='balance' />
                    </VStack>
                  </Stack>
                </Container>

                <Container label="Strategies, Vaults and Pools Infos" m="0" p="0">
                  <Stack direction={{ base: 'column', lg: 'row' }} w='full'>
                    {yearnFedData.yearn.strategies.map((s, i) => {
                      const { management_fee, deposit_limit, vault_performance_fee } = yearnFedData.yearn.vaults[i];
                      return <InfoMessage
                        alertProps={{ w: { base: '100%', lg: '50%' }, textAlign: 'left', fontSize: '14px' }}
                        title={<Text fontWeight="extrabold" fontSize="16px">{s.name}</Text>}
                        description={
                          <VStack pt="2" spacing="1" w='full' alignItems="flex-start">
                            <HStack w='full' justifyContent="space-between">
                              <Text>Last Report:</Text>
                              <Text textAlign='right'>{moment(s.last_report * 1000).format('MMM Do YYYY')}, {moment(s.last_report * 1000).fromNow()}</Text>
                            </HStack>
                            <HStack w='full' justifyContent="space-between">
                              <Text>Strategy:</Text>
                              <ScannerLink value={s.address} />
                            </HStack>
                            <HStack w='full' justifyContent="space-between">
                              <Text>Vault:</Text>
                              <ScannerLink value={s.vault_address} />
                            </HStack>
                            <HStack w='full' justifyContent="space-between">
                              <Text>Underlying:</Text>
                              <ScannerLink value={s.want_address} />
                            </HStack>
                            <HStack w='full' justifyContent="space-between">
                              <Text>Total Gain:</Text>
                              <Text>{shortenNumber(s.total_gain, 2)} ({shortenNumber(s.total_gain_usd, 2, true)})</Text>
                            </HStack>
                            <HStack w='full' justifyContent="space-between">
                              <Text>Total Loss:</Text>
                              <Text>{shortenNumber(s.total_loss, 2)}  ({shortenNumber(s.total_loss_usd, 2, true)})</Text>
                            </HStack>
                            <HStack w='full' justifyContent="space-between">
                              <Text>Total Assets:</Text>
                              <Text>{shortenNumber(s.total_assets, 2)}</Text>
                            </HStack>
                            <HStack w='full' justifyContent="space-between">
                              <Text>Deposit Limit:</Text>
                              <Text>{shortenNumber(deposit_limit, 2)}</Text>
                            </HStack>
                            <HStack w='full' justifyContent="space-between">
                              <Text>Max Slippage In / Out:</Text>
                              <Text>{shortenNumber(s.max_slippage_in / 100, 2)}% / {shortenNumber(s.max_slippage_out / 100, 2)}%</Text>
                            </HStack>
                            <HStack w='full' justifyContent="space-between">
                              <Text>Performance Fee / Management Fee:</Text>
                              <Text>{(s.strat_performance_fee + vault_performance_fee) / 100}% / {management_fee / 100}%</Text>
                            </HStack>
                          </VStack>
                        } />
                    })}
                  </Stack>
                </Container>

                <Container
                  label="Gauge Votes"
                  description="Gauge Contract"
                  href={`${getScanner('1')}/address/0x8Fa728F393588E8D8dD1ca397E9a710E53fA553a`}
                  noPadding
                  p="0"
                  m="0"
                >
                  <Table
                    keyName="txn_hash"
                    defaultSort="current_timestamp"
                    defaultSortDir="desc"
                    columns={columns}
                    items={yearnFedData.curve.gauge_votes} />
                </Container>

                <Container p="0" m="0" label="Yearn Fed Supply">
                  <FedAreaChart
                    title={`Current supply: ${chartDataPolicies.length ? shortenNumber(chartDataPolicies[chartDataPolicies.length - 1].y, 1) : 0}`}
                    chartData={chartDataPolicies}
                    domainYpadding={5000000}
                    fed={yearnFed}
                    onlyChart={true}
                    maxChartWidth={1200}
                  />
                </Container>
                <Container p="0" m="0" label="Yearn Fed Accumulated Revenue">
                  <FedAreaChart
                    title={`Current Accumulated Revenue: ${chartDataRevenues.length ? shortenNumber(chartDataRevenues[chartDataRevenues.length - 1].y, 2) : 0}`}
                    chartData={chartDataRevenues}
                    domainYpadding={50000}
                    fed={yearnFed}
                    onlyChart={true}
                    maxChartWidth={1200}
                    mainColor="secondary"
                  />
                </Container>
                <Container p="0" m="0" label="Yearn Fed Monthly Revenue">
                  <FedBarChart chartData={chartDataRevenues} maxChartWidth={1200} />
                </Container>
              </Stack>
            </Flex>
          </Flex>
      }
    </Layout>
  )
}

export default YearnFed

export async function getServerSideProps() {
  try {
    const yearnFedData = await fetchJson('http://34.205.72.180:4444/api');
    return {
      props: { yearnFedData }
    }
  } catch (e) {
    console.log(e)
    return {
      props: { yearnFedData: undefined }
    }
  }
}
