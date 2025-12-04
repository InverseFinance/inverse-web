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
import { payrollV2Withdraw, payrollV2WithdrawMax, payrollWithdraw } from '@app/util/payroll';
import { getBnToNumber, shortenNumber } from '@app/util/markets';
import { InfoMessage } from '@app/components/common/Messages';
import { Event } from 'ethers';
import { useContractEvents } from '@app/hooks/useContractEvents';
import { DOLA_PAYROLL_ABI } from '@app/config/abis';
import { useBlockTimestamp } from '@app/hooks/useBlockTimestamp';
import { formatDate, timeSince } from '@app/util/time';
import { DOLA_PAYROLL_V2 } from '@app/config/constants';
import { SimpleAmountForm } from '@app/components/common/SimpleAmountForm';

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
        {timeSince(timestamp)} - {formatDate(timestamp)}
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
    [DOLA_PAYROLL_V2, 'balanceOf', userAddress],
    [DOLA_PAYROLL_V2, 'recipients', userAddress],
    [DOLA, 'allowance', TREASURY, DOLA_PAYROLL_V2],
    [DOLA, 'balanceOf', TREASURY],
  ]);

  const { events } = useContractEvents(DOLA_PAYROLL_V2, DOLA_PAYROLL_ABI, 'AmountWithdrawn');

  const [lastClaim, ratePerSecond, endTime] = !!data ? data[1] : [0, 0, 0, 0];

  const widthdrawable = !!data ? parseFloat(formatUnits(data[0], TOKENS[DOLA].decimals)) : 0;
  const endTimestamp = parseInt(endTime.toString()) * 1000;
  const lastClaimTimestamp = parseInt(lastClaim.toString()) * 1000;
  const yearlyRate = getBnToNumber(ratePerSecond) * 3600 * 24 * 365;
  const monthlyRate = yearlyRate / 12;

  const allowance = data && data[2] ? getBnToNumber(data[2]) : 0;
  const dolaTreasury = data && data[3] ? getBnToNumber(data[3]) : 0;

  const _formatDate = (timestamp: number, isSmaller: boolean) => {
    return `${formatDate(timestamp)}${isSmaller ? '' : ` (${timeSince(timestamp)})`}`
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
            label="DOLA PayRoll v2"
            description="See Contract"
            maxWidth="1000px"
            minW="320px"
            contentProps={{ p: { base: '2', sm: '12' } }}
            href={`${getScanner(NetworkIds.mainnet)}/address/${DOLA_PAYROLL_V2}`}
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
                                - <b>End Time</b>:
                              </Text>
                              <Text fontWeight="extrabold">{!endTimestamp ? '-' : _formatDate(endTimestamp, isSmaller)}</Text>
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
                              <Text fontWeight="extrabold">{!lastClaimTimestamp ? 'Never claimed yet' : _formatDate(lastClaimTimestamp, isSmaller)}</Text>
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
                  <SimpleAmountForm
                    address={DOLA_PAYROLL_V2}
                    destination={DOLA_PAYROLL_V2}
                    signer={provider?.getSigner()!}
                    decimals={18}
                    onAction={({ bnAmount }) => payrollV2Withdraw(provider?.getSigner(), bnAmount)}
                    onMaxAction={() => payrollV2WithdrawMax(provider?.getSigner())}
                    actionLabel="Withdraw"
                    maxActionLabel="Withdraw Max"
                    showMaxBtn={true}
                    showBalance={false}
                    needApprove={false}
                  />
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
