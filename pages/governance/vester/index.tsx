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
import { commify } from 'ethers/lib/utils';
import Container from '@app/components/common/Container';
import { getScanner } from '@app/util/web3';
import { vesterClaim } from '@app/util/payroll';
import { getBnToNumber } from '@app/util/markets';
import moment from 'moment';
import { InfoMessage } from '@app/components/common/Messages';
import { BigNumber } from 'ethers';
import { REWARD_TOKEN } from '@app/variables/tokens';

const { VESTERS } = getNetworkConfigConstants(NetworkIds.mainnet);

export const VesterPage = () => {
  const [isSmaller] = useMediaQuery('(max-width: 500px)')
  const { account, library } = useWeb3React<Web3Provider>();
  const { query } = useRouter();
  const userAddress = (query?.viewAddress as string) || account;

  const { data: vesterRecipients } = useEtherSWR([
    ...VESTERS.map(vesterAd => [vesterAd, 'recipient']),
  ]);

  const recipientIndex = (vesterRecipients || []).findIndex(recipient => recipient === userAddress);
  const vesterAddress = VESTERS[recipientIndex];

  const { data: recipientData } = useEtherSWR(
    !!vesterAddress ?
      [
        [vesterAddress, 'claimableINV'],
        [vesterAddress, 'vestingXinvAmount'],
        [vesterAddress, 'vestingBegin'],
        [vesterAddress, 'vestingEnd'],
        [vesterAddress, 'lastUpdate'],
        [vesterAddress, 'isCancellable'],
        [vesterAddress, 'isCancelled'],
      ]
      :
      [[]]
  );

  const isLoading = vesterRecipients === undefined && recipientData === undefined;
  const hasNoVester = !isLoading && !vesterAddress;

  const [claimableINV, vestingXinvAmount, vestingBegin, vestingEnd, lastUpdate, isCancellable, isCancelled] = recipientData || [BigNumber.from('0'), BigNumber.from('0'), BigNumber.from('0'), BigNumber.from('0'), BigNumber.from('0'), false, false];

  const widthdrawable = getBnToNumber(claimableINV, REWARD_TOKEN!.decimals);
  const startTimestamp = parseInt(vestingBegin.toString()) * 1000;
  const lastClaimTimestamp = parseInt(lastUpdate.toString()) * 1000;

  const formatDate = (timestamp: number, isSmaller: boolean) => {
    return `${moment(timestamp).format('MMM Do, YYYY')}${isSmaller ? '' : ` (${moment(timestamp).fromNow()})`}`
  }

  return (
    <Layout>
      <Head>
        <title>{process.env.NEXT_PUBLIC_TITLE} - Vester</title>
      </Head>
      <AppNav active="Governance" />
      <Flex justify="center" direction="column">
        <Flex w={{ base: 'full', xl: '4xl' }} justify="center" color="mainTextColor">
          <Container
            contentBgColor="gradient3"
            label="Personal INV Vester"
            description="See Contract"
            maxWidth="1000px"
            minW="320px"
            contentProps={{ p: { base: '2', sm: '12' } }}
            href={`${getScanner(NetworkIds.mainnet)}/address/${vesterAddress}`}
          >
            {
              !account ? <Text>Please Connect your wallet</Text> :
                <VStack spacing="10" alignItems="center" w="full">
                  {
                    !isLoading && !hasNoVester ?
                      <InfoMessage
                        alertProps={{ minW: '400px', w: 'full', py: isSmaller ? '10px' : '20px', fontSize: isSmaller ? '12px' : '14px' }}
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
                                - <b>Last Claim</b>:
                              </Text>
                              <Text fontWeight="extrabold">{!lastClaimTimestamp || lastClaimTimestamp === startTimestamp ? 'Never claimed yet' : formatDate(lastClaimTimestamp, isSmaller)}</Text>
                            </Flex>
                            <Flex fontWeight="bold" alignItems="center" justify="space-between">
                              <Text color="secondary">
                                - <b>Withdrawable</b>:
                              </Text>
                              <Text fontWeight="extrabold" color="secondary">{commify(widthdrawable.toFixed(2))} INV</Text>
                            </Flex>
                          </VStack>
                        }
                      />
                      :
                      isLoading ?
                        <Text>Loading...</Text>
                        : <Text>No Vester found for <b>{userAddress}</b></Text>

                  }
                  <SubmitButton refreshOnSuccess={true} maxW="120px" disabled={!account && widthdrawable > 0} onClick={() => vesterClaim(library?.getSigner()!, vesterAddress)}>
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

export default VesterPage
