import { Box, Flex, HStack, Stack, Text, VStack } from '@chakra-ui/react'

import Layout from '@app/components/common/Layout'
import { AppNav } from '@app/components/common/Navbar'
import Head from 'next/head'
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
import Link from '@app/components/common/Link'
import { ExternalLinkIcon } from '@chakra-ui/icons'
import { RadioCardGroup } from '@app/components/common/Input/RadioCardGroup'
import { useState } from 'react'
import { FedPolicyTable } from '@app/components/Transparency/fed/FedPolicyTable'
import { FedRevenueTable } from '@app/components/Transparency/fed/FedRevenueTable'
import { useCustomSWR } from '@app/hooks/useCustomSWR'

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

const reportsColumn = [
  {
    field: 'timestamp',
    label: 'Time',
    header: ({ ...props }) => <Flex minW="100px" {...props} />,
    value: ({ timestamp }) => {
      return (
        <Flex minW="100px">
          <VStack spacing="0">
            <Text fontSize="12px">{moment(timestamp * 1000).fromNow()}</Text>
            <Text fontSize="10px">{moment(timestamp * 1000).format('MMM Do YYYY')}</Text>
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
    field: 'want_gain_usd',
    label: 'Profit',
    header: ({ ...props }) => <Flex minW="120px" {...props} />,
    value: ({ want_gain_usd }) => <Flex minW="120px">
      {shortenNumber(parseFloat(want_gain_usd), 2, true)}
    </Flex>,
  },
  {
    field: 'rough_apr_pre_fee',
    label: 'APR',
    header: ({ ...props }) => <Flex justify="flex-end" minW="60px" {...props} />,
    value: ({ rough_apr_pre_fee }) => <Flex justify="flex-end" minW="60px">
      {shortenNumber(parseFloat(rough_apr_pre_fee) * 100, 2)}%
    </Flex>,
  },
  {
    field: 'net_debt_added',
    label: 'Net Debt Added',
    header: ({ ...props }) => <Flex justify="flex-end" minW="100px" {...props} />,
    value: ({ net_debt_added }) => <Flex justify="flex-end" minW="100px">
      {shortenNumber(net_debt_added, 2, true)}
    </Flex>,
  },
]

export interface YearnFedData {
  last_update_str: string;
  last_update: number;
  yearn: Yearn;
  curve: Curve;
  inverse: Inverse;
}

export interface Curve {
  pool: Pool;
  gauge_votes: GaugeVote[];
}

export interface GaugeVote {
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
  gauge_name: null | string;
}

export interface Pool {
  coins: Coin[];
  dominance: number
  tvl: number;
}

export interface Coin {
  token_address: string;
  name: string;
  symbol: string;
  decimals: number;
  balance: number;
  slippage_deposit_1M: number;
  slippage_withdraw_1M: number;
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
  actions: Action[];
}

export interface Action {
  txn_hash: string;
  fed_address: string;
  fed_name: string;
  action: string;
  amount: string;
  current_timestamp: number;
  date_string: string;
  block: number;
}

export interface Yearn {
  vaults: Vault[];
  strategies: Strategy[];
}

export interface Strategy {
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
  reports: Report[];
}

export interface Report {
  id: number;
  chain_id: number;
  block: number;
  txn_hash: string;
  vault_address: string;
  strategy_address: string;
  gain: string;
  loss: string;
  debt_paid: string;
  total_gain: string;
  total_loss: string;
  total_debt: string;
  debt_added: string;
  debt_ratio: number;
  want_token: string;
  token_symbol: string;
  want_price_at_block: string;
  want_gain_usd: string;
  gov_fee_in_want: string;
  strategist_fee_in_want: string;
  gain_post_fees: string;
  rough_apr_pre_fee: number | null;
  rough_apr_post_fee: number | null;
  vault_api: string;
  vault_name: string;
  vault_symbol: string;
  vault_decimals: number;
  strategy_name: string;
  strategy_api: string;
  strategist: string;
  previous_report_id: number | null;
  multi_harvest: boolean;
  date_string: string;
  timestamp: number;
  updated_timestamp: Date;
}

export interface Vault {
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


export const YearnFed = ({ cachedYearnFedData }: { cachedYearnFedData: YearnFedData }) => {
  const { data: fresherYearnFedData } = useCustomSWR('/api/transparency/yearn-fed');
  const yearnFedData = fresherYearnFedData || cachedYearnFedData;
  const { feds } = useDAO();
  const { totalEvents: policyEvents, isLoading: isPolicyLoading } = useFedHistory();
  const { totalEvents: profitsEvents, isLoading: isProfitsLoading } = useFedRevenues();
  const [detailsType, setDetailsType] = useState('gauges');

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
                <Box>
                  <Text mt="5" fontSize="30px" fontWeight="extrabold">
                    Yearn Fed Dashboard
                  </Text>
                  <Text color="secondaryTextColor" mt="0" fontSize="16px">
                    Last Update: {moment(yearnFedData.last_update * 1000).fromNow()}
                  </Text>
                </Box>
                <Container
                  label="Curve Pool Assets"
                  description={
                    <Box color="secondaryTextColor" display="inline-block">
                      <Link style={{ textDecoration: 'underline' }} href="https://curve.fi/factory/27" isExternal>
                        See Pool on Curve <ExternalLinkIcon />
                      </Link> | <ScannerLink
                        color="secondaryTextColor"
                        value={"0xAA5A67c256e27A5d80712c51971408db3370927D"}
                        label={<>See Contract <ExternalLinkIcon /></>} />
                    </Box>
                  }
                  m="0"
                  p="0"
                  contentProps={{ px: { lg: '8' } }}
                >
                  <Stack direction={{ base: 'column-reverse', lg: 'row' }} alignItems="center" justifyContent="space-between" w='full'>
                    <VStack w={{ base: '100%', lg: '500px' }} alignItems="flex-start">
                      <Funds
                        showTotal={true}
                        showAsAmountOnly={true}
                        totalLabel="DOLA + 3CRV Total:"
                        funds={yearnFedData.curve.pool.coins.map(c => ({ ...c, token: getToken(TOKENS, c.token_address) }))}
                        type='balance'
                      />
                      <HStack justifyContent="space-between" w='full'>
                        <Text fontWeight="bold">Pool Dominance:</Text>
                        <Text fontWeight="bold">{shortenNumber(yearnFedData.curve.pool.dominance * 100, 2)}%</Text>
                      </HStack>
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
                      <Funds showAsAmountOnly={true} labelWithPercInChart={true} showTotal={false} showChartTotal={true} chartMode={true} funds={yearnFedData.curve.pool.coins.map(c => ({ ...c, token: getToken(TOKENS, c.token_address) }))} type='balance' />
                    </VStack>
                  </Stack>
                </Container>

                <Container label="Strategies" m="0" p="0">
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

                <Box color="mainTextColor" pt="5">
                  <Text fontSize="xl" fontWeight="extrabold">
                    View Details About:
                  </Text>
                  <RadioCardGroup
                    wrapperProps={{
                      overflow: 'auto',
                      position: 'relative',
                      mt: '2',
                      mb: '2',
                      maxW: { base: '90vw', sm: '100%' },
                    }}
                    group={{
                      name: 'detailsType',
                      defaultValue: 'gauges',
                      onChange: (v: string) => setDetailsType(v),
                    }}
                    radioCardProps={{ w: '150px', fontSize: '14px', textAlign: 'center', p: '2', position: 'relative' }}
                    options={[
                      { label: 'Gauges Votes', value: 'gauges' },
                      { label: 'Harvests', value: 'harvests' },
                      { label: 'Fed Policy', value: 'policy' },
                      { label: 'Fed Revenue', value: 'revenue' },
                    ]}
                  />
                </Box>

                {
                  detailsType === 'gauges' && <>
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
                  </>
                }

                {
                  detailsType === 'harvests' &&
                  <>
                    <Container
                      label={`Curve DOLA Pool yVault's Harvests`}
                      description="Contract"
                      href={`${getScanner('1')}/address/0x7928becDda70755B9ABD5eE7c7D5E267F1412042`}
                      noPadding
                      p="0"
                      m="0"
                    >
                      <Table
                        keyName="txn_hash"
                        defaultSort="timestamp"
                        defaultSortDir="desc"
                        columns={reportsColumn}
                        items={
                          yearnFedData.yearn.strategies.find(s => s.address === '0x7928becDda70755B9ABD5eE7c7D5E267F1412042').reports
                            .map((r) => ({
                              ...r,
                              net_debt_added: (parseFloat(r.debt_added) - parseFloat(r.debt_paid)) * parseFloat(r.want_price_at_block),
                            }))
                        } />
                    </Container>
                  </>
                }

                {
                  detailsType === 'policy' && <>
                    <Container p="0" m="0" label="Yearn Fed Supply Evolution Chart" noPadding
                      description="Fed Contract"
                      href={`${getScanner('1')}/address/${yearnFed.address}`}
                    >
                      <FedAreaChart
                        title={`Current supply: ${chartDataPolicies.length ? shortenNumber(chartDataPolicies[chartDataPolicies.length - 1].y, 1) : 0}`}
                        chartData={chartDataPolicies}
                        domainYpadding={5000000}
                        fed={yearnFed}
                        onlyChart={true}
                        maxChartWidth={1200}
                      />
                    </Container>
                    <Container p="0" m="0" label="Yearn Fed Expansions and Contractions Events" noPadding
                      description="Fed Contract"
                      href={`${getScanner('1')}/address/${yearnFed.address}`}
                    >
                      <FedPolicyTable showTotalCol={false} fedHistoricalEvents={fedHistoricalEvents} isLoading={isPolicyLoading} />
                    </Container>
                  </>
                }

                {
                  detailsType === 'revenue' && <>
                    <Container p="0" m="0" label="Yearn Fed Accumulated Revenue Chart" noPadding
                      description="Fed Contract"
                      href={`${getScanner('1')}/address/${yearnFed.address}`}>
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

                    <Container p="0" m="0" label="Yearn Fed Monthly Revenue"
                      description="Fed Contract"
                      href={`${getScanner('1')}/address/${yearnFed.address}`}>
                      <FedBarChart chartData={chartDataRevenues} maxChartWidth={1200} />
                    </Container>

                    <Container p="0" m="0" label="Yearn Fed Take Profits Events" noPadding
                      description="Fed Contract"
                      href={`${getScanner('1')}/address/${yearnFed.address}`}>
                      <FedRevenueTable showTotalCol={false} fedHistoricalEvents={fedProfitsEvents} isLoading={isProfitsLoading} />
                    </Container>
                  </>
                }

              </Stack>
            </Flex>
          </Flex>
      }
    </Layout>
  )
}

export default YearnFed

export async function getStaticProps() {
  try {
    const cachedYearnFedData = await fetchJson('http://34.205.72.180:4444/api');
    return {
      props: { cachedYearnFedData }
    }
  } catch (e) {
    console.log(e)
    return {
      props: { cachedYearnFedData: undefined },
      revalidate: 600,
    }
  }
}
