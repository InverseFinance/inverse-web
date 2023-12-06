import { Flex, Text, VStack, useMediaQuery, HStack } from '@chakra-ui/react'
import Layout from '@app/components/common/Layout'
import { AppNav } from '@app/components/common/Navbar'
import Head from 'next/head';
import { SubmitButton } from '@app/components/common/Button';
import { useWeb3React } from '@web3-react/core';
import { Web3Provider } from '@ethersproject/providers';
import { useRouter } from 'next/router';
import useEtherSWR from '@app/hooks/useEtherSWR';
import { getNetworkConfigConstants } from '@app/util/networks';
import { NetworkIds } from '@app/types';
import { formatUnits, commify } from 'ethers/lib/utils';
import Container from '@app/components/common/Container';
import { getScanner } from '@app/util/web3';
import { payrollWithdraw } from '@app/util/payroll';
import { getBnToNumber, shortenNumber } from '@app/util/markets';
import moment from 'moment';
import { InfoMessage } from '@app/components/common/Messages';
import { Event } from 'ethers';
import { useContractEvents } from '@app/hooks/useContractEvents';
import { DOLA_PAYROLL_ABI } from '@app/config/abis';
import { useBlockTimestamp } from '@app/hooks/useBlockTimestamp';

const { DOLA_PAYROLL, TOKENS, DOLA, TREASURY } = getNetworkConfigConstants(NetworkIds.mainnet);

const EventInfos = ({ event }: { event: Event }) => {
  const { timestamp } = useBlockTimestamp(event.blockNumber);
  return <Flex w='full' justify="space-between">
    <Text textAlign="left">
      Withdraw {shortenNumber(getBnToNumber(event.args[1]), 2)}
    </Text>
    {
      timestamp > 0 &&
      <Text textAlign="right">
        {moment(timestamp).fromNow()} - {moment(timestamp).format('MMM Do YYYY')}
      </Text>
    }
  </Flex>
}

export const DolaPayrollPage = () => {
  const [isSmaller] = useMediaQuery('(max-width: 500px)')
  const { account, provider } = useWeb3React<Web3Provider>();
  const { query } = useRouter()
  const userAddress = (query?.viewAddress as string) || account;

  const { data } = useEtherSWR([
    [DOLA_PAYROLL, 'balanceOf', userAddress],
    [DOLA_PAYROLL, 'recipients', userAddress],
    [DOLA, 'allowance', TREASURY, DOLA_PAYROLL],
    [DOLA, 'balanceOf', TREASURY],
  ]);

  const { events } = useContractEvents(DOLA_PAYROLL, DOLA_PAYROLL_ABI, 'AmountWithdrawn');

  const [lastClaim, ratePerSecond, startTime] = !!data ? data[1] : [0, 0, 0, 0];

  const widthdrawable = !!data ? parseFloat(formatUnits(data[0], TOKENS[DOLA].decimals)) : 0;
  const startTimestamp = parseInt(startTime.toString()) * 1000;
  const lastClaimTimestamp = parseInt(lastClaim.toString()) * 1000;
  const yearlyRate = getBnToNumber(ratePerSecond) * 3600 * 24 * 365;
  const monthlyRate = yearlyRate / 12;

  const allowance = data && data[2] ? getBnToNumber(data[2]) : 0;
  const dolaTreasury = data && data[3] ? getBnToNumber(data[3]) : 0;

  const formatDate = (timestamp: number, isSmaller: boolean) => {
    return `${moment(timestamp).format('MMM Do hh:mm A, YYYY')}${isSmaller ? '' : ` (${moment(timestamp).fromNow()})`}`
  }

  const userEvents = events.filter(event => {
    return event?.args[0].toLowerCase() === userAddress?.toLowerCase();
  });

  userEvents.sort((a, b) => b.blockNumber - a.blockNumber);

  return (
    <Layout>
      <Head>
        <title>Inverse Finance - Payroll</title>
        <meta name="og:title" content="Inverse Finance - Payroll" />
        <meta name="og:description" content="Payroll Portal" />
      </Head>
      <AppNav active="Governance" />
      <Flex justify="center" direction="column">
        <Flex w={{ base: 'full', xl: '4xl' }} justify="center" color="mainTextColor">
          <Container
            contentBgColor="gradient3"
            label="DOLA PayRoll"
            description="See Contract"
            maxWidth="1000px"
            minW="320px"
            contentProps={{ p: { base: '2', sm: '12' } }}
            href={`${getScanner(NetworkIds.mainnet)}/address/${DOLA_PAYROLL}`}
          >
            {
              !account ? <Text>Please Connect your wallet</Text> :
                <VStack spacing="10" alignItems="center" w="full">
                  {
                    !!data ?
                      <InfoMessage
                        alertProps={{ minW: '300px', w: 'full', py: isSmaller ? '10px' : '20px', fontSize: isSmaller ? '12px' : '14px' }}
                        description={
                          <VStack alignItems="left" spacing={{ base: '10px', sm: '10px' }}>
                            <Flex alignItems="center" justify="space-between">
                              <Text>
                                - <b>Start Time</b>:
                              </Text>
                              <Text fontWeight="extrabold">{!startTimestamp ? 'Not started yet' : formatDate(startTimestamp, isSmaller)}</Text>
                            </Flex>
                            <Flex alignItems="center" justify="space-between">
                              <Text>
                                - <b>Monthly Rate</b>:
                              </Text>
                              <Text fontWeight="extrabold">{commify(monthlyRate.toFixed(2))} DOLA {isSmaller ? '' : `(${commify(yearlyRate.toFixed(2))} yearly)`}</Text>
                            </Flex>
                            <Flex alignItems="center" justify="space-between">
                              <Text>
                                - <b>Last Claim</b>:
                              </Text>
                              <Text fontWeight="extrabold">{!lastClaimTimestamp ? 'Never claimed yet' : formatDate(lastClaimTimestamp, isSmaller)}</Text>
                            </Flex>
                            <Flex fontWeight="bold" alignItems="center" justify="space-between">
                              <Text color="secondary">
                                - <b>Withdrawable</b>:
                              </Text>
                              <Text fontWeight="extrabold" color="secondary">{commify(widthdrawable.toFixed(2))} DOLA</Text>
                            </Flex>
                          </VStack>
                        }
                      />
                      :
                      <Text>Loading...</Text>
                  }
                  <SubmitButton refreshOnSuccess={true} maxW="120px" disabled={!account && widthdrawable > 0} onClick={() => payrollWithdraw(provider?.getSigner()!)}>
                    Withdraw
                  </SubmitButton>
                  <VStack>
                    <HStack fontSize="12px">
                      <Text color="secondaryTextColor">
                        DolaPayroll's remaining allowance:
                      </Text>
                      <Text color="secondaryTextColor">
                        {shortenNumber(allowance, 2, false)} DOLA
                      </Text>
                    </HStack>
                    <HStack fontSize="12px">
                      <Text color="secondaryTextColor">
                        Treasury's balance:
                      </Text>
                      <Text color="secondaryTextColor">
                        {shortenNumber(dolaTreasury, 2, false)} DOLA
                      </Text>
                    </HStack>
                  </VStack>
                </VStack>
            }
          </Container>
        </Flex>
        {
          userEvents.length > 0 &&
          <Container
            noPadding
            contentBgColor="gradient3"
            label="Past Withdrawals"
            maxWidth="1000px"
            contentProps={{ p: { base: '2', sm: '12' } }}
          >
            <VStack w='full'>
              {
                userEvents?.map(e => {
                  return <EventInfos key={e.transactionHash} event={e} />
                })
              }
              {
                userEvents.length > 1 &&
                <Flex fontWeight="bold" justify="flex-start" w='full'>
                  Total withdrawn: {shortenNumber(userEvents.reduce((prev, curr) => prev + getBnToNumber(curr.args[1]), 0), 2)}
                </Flex>
              }
            </VStack>
          </Container>
        }
      </Flex>
    </Layout>
  )
}

export default DolaPayrollPage
