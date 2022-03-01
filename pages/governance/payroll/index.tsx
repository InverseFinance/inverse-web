import { Flex, Text, VStack, useMediaQuery } from '@chakra-ui/react'
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
import { getBnToNumber } from '@app/util/markets';
import moment from 'moment';
import { InfoMessage } from '@app/components/common/Messages';

const { DOLA_PAYROLL, TOKENS, DOLA } = getNetworkConfigConstants(NetworkIds.mainnet);

export const DolaPayrollPage = () => {
  const [isSmaller] = useMediaQuery('(max-width: 500px)')
  const { account, library } = useWeb3React<Web3Provider>();
  const { query } = useRouter()
  const userAddress = (query?.viewAddress as string) || account;
  const { data } = useEtherSWR([
    [DOLA_PAYROLL, 'balanceOf', userAddress],
    [DOLA_PAYROLL, 'recipients', userAddress],
  ]);

  const [lastClaim, ratePerSecond, startTime] = !!data ? data[1] : [0, 0, 0];

  const widthdrawable = !!data ? parseFloat(formatUnits(data[0], TOKENS[DOLA].decimals)) : 0;
  const startTimestamp = parseInt(startTime.toString()) * 1000;
  const lastClaimTimestamp = parseInt(lastClaim.toString()) * 1000;
  const yearlyRate = getBnToNumber(ratePerSecond) * 3600 * 24 * 365;
  const monthlyRate = yearlyRate / 12;

  const formatDate = (timestamp: number, isSmaller: boolean) => {
    return `${moment(timestamp).format('MMM Do hh:mm A, YYYY')}${isSmaller? '' : ` (${moment(timestamp).fromNow()})`}`
  }

  return (
    <Layout>
      <Head>
        <title>{process.env.NEXT_PUBLIC_TITLE} - Payroll</title>
      </Head>
      <AppNav active="Governance" />
      <Flex justify="center" direction="column">
        <Flex w={{ base: 'full', xl: '4xl' }} justify="center" color="mainTextColor">
          <Container
            contentBgColor="gradientContentBackground"
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
                        alertProps={{ minW: '300px', w: 'full', py: isSmaller ? '10px' : '30px', fontSize: isSmaller ? '12px' : '20px' }}
                        description={
                          <VStack alignItems="left" spacing={{ base: '10px', sm: '40px' }}>
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
                  <SubmitButton maxW="120px" disabled={!account && widthdrawable > 0} onClick={() => payrollWithdraw(library?.getSigner()!)}>
                    Withdraw
                  </SubmitButton>
                </VStack>
            }
          </Container>
        </Flex>
      </Flex>
    </Layout>
  )
}

export default DolaPayrollPage
