import { Flex, Text, VStack, useMediaQuery, Stack, Divider } from '@chakra-ui/react'
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
import { commify, isAddress } from 'ethers/lib/utils';
import Container from '@app/components/common/Container';
import { getScanner } from '@app/util/web3';
import { vesterChangeDelegate, vesterChangeRecipient, vesterClaim } from '@app/util/payroll';
import { getBnToNumber, shortenNumber } from '@app/util/markets';
import moment from 'moment';
import { DangerMessage, InfoMessage, WarningMessage } from '@app/components/common/Messages';
import { BigNumber } from 'ethers';
import { REWARD_TOKEN } from '@app/variables/tokens';
import { Input } from '@app/components/common/Input';
import { useState } from 'react';
import { namedAddress } from '@app/util';
import Link from '@app/components/common/Link';
import { vesterCancel } from '@app/util/payroll';

const { VESTERS, XINV } = getNetworkConfigConstants(NetworkIds.mainnet);

const DelegateLink = ({ address }: { address: string }) => {
  return <Link fontWeight="bold" textDecoration="underline" display="inline-block" href={`/governance/delegates/${address}`}>{namedAddress(address)}</Link>
}

export const VesterPage = () => {
  const [isSmaller] = useMediaQuery('(max-width: 500px)')
  const { account, library } = useWeb3React<Web3Provider>();
  const { query } = useRouter();
  const userAddress = (query?.viewAddress as string) || account;
  const [vesterDelegate, setVesterDelegate] = useState('');
  const [newRecipient, setNewRecipient] = useState('');

  const { data: vesterRecipients } = useEtherSWR([
    ...VESTERS.map(vesterAd => [vesterAd, 'recipient']),
  ]);

  const recipientIndex = (vesterRecipients || []).findIndex(recipient => recipient === userAddress);
  const vesterAddress = VESTERS[recipientIndex];

  const { data: exRate } = useEtherSWR([XINV, 'exchangeRateStored']);

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
        [XINV, 'delegates', vesterAddress],
        [XINV, 'delegates', userAddress],
      ]
      :
      [[]]
  );

  const isLoading = vesterRecipients === undefined && recipientData === undefined;
  const hasNoVester = !isLoading && !vesterAddress;

  const [claimableINV, vestingXinvAmount, vestingBegin, vestingEnd, lastUpdate, isCancellable, isCancelled, currentVesterDelegate, accountDelegate] = recipientData || [BigNumber.from('0'), BigNumber.from('0'), BigNumber.from('0'), BigNumber.from('0'), BigNumber.from('0'), false, false, userAddress, userAddress];

  const widthdrawable = getBnToNumber(claimableINV, REWARD_TOKEN!.decimals);
  const totalIntialVested = getBnToNumber(vestingXinvAmount, REWARD_TOKEN!.decimals) * (getBnToNumber(exRate || 0));
  const startTimestamp = parseInt(vestingBegin.toString()) * 1000;
  const endTimestamp = parseInt(vestingEnd.toString()) * 1000;
  const lastClaimTimestamp = parseInt(lastUpdate.toString()) * 1000;
  const vestingPerc = Math.min((Date.now() - startTimestamp) / (endTimestamp - startTimestamp) * 100, 100);

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
            label="Account's INV Vester"
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
                      <>
                        <InfoMessage
                          alertProps={{ minW: { base: '40px', sm: '400px' }, w: 'full', py: isSmaller ? '10px' : '20px', fontSize: isSmaller ? '12px' : '14px' }}
                          description={
                            <VStack alignItems="left" spacing={{ base: '10px', sm: '10px' }}>
                              <Flex fontWeight="bold" alignItems="center" justify="space-between">
                                <Text>
                                  - <b>Vested Amount</b>:
                                </Text>
                                <Text fontWeight="extrabold">
                                  {commify(totalIntialVested.toFixed(2))} INV
                                </Text>
                              </Flex>
                              <Flex alignItems="center" justify="space-between">
                                <Text>
                                  - <b>Start Time</b>:
                                </Text>
                                <Text fontWeight="extrabold">
                                  {formatDate(startTimestamp, isSmaller)}
                                </Text>
                              </Flex>
                              <Flex alignItems="center" justify="space-between">
                                <Text>
                                  - <b>End Time</b>:
                                </Text>
                                <Text fontWeight="extrabold">
                                  {formatDate(endTimestamp, isSmaller)}
                                </Text>
                              </Flex>
                              <Flex fontWeight="bold" alignItems="center" justify="space-between">
                                <Text>
                                  - <b>Vesting Progress</b>:
                                </Text>
                                <Text fontWeight="extrabold">
                                  {shortenNumber(vestingPerc, 2)}%
                                </Text>
                              </Flex>
                              <Flex alignItems="center" justify="space-between">
                                <Text>
                                  - <b>Last Claim</b>:
                                </Text>
                                <Text fontWeight="extrabold">{!lastClaimTimestamp || lastClaimTimestamp === startTimestamp ? 'Never claimed yet' : formatDate(lastClaimTimestamp, isSmaller)}</Text>
                              </Flex>
                              <Flex fontWeight="bold" alignItems="center" justify="space-between">
                                <Text>
                                  - <b>Currently Claimable</b>:
                                </Text>
                                <Text fontWeight="extrabold">{commify(widthdrawable.toFixed(2))} INV</Text>
                              </Flex>
                              <Text textAlign="center" fontSize="12px">
                                Reminder: Vested Tokens are already staked on Anchor and generating yield
                              </Text>
                            </VStack>
                          }
                        />
                        <SubmitButton refreshOnSuccess={true} maxW="120px" disabled={!account && widthdrawable > 0} onClick={() => vesterClaim(library?.getSigner()!, vesterAddress)}>
                          Claim
                        </SubmitButton>
                        <Divider />
                        <Stack w='full'>
                          <VStack fontWeight="bold" alignItems="flex-start" justify="flex-start">
                            <Text>
                              Vester Contract's Delegate:
                            </Text>
                            {
                              accountDelegate.toLowerCase() !== currentVesterDelegate.toLowerCase() && <WarningMessage
                                alertProps={{ fontSize: '12px', w: 'full' }}
                                title="Vester's Delegation Not Synced with yours"
                                description={
                                  <Text fontWeight="normal">
                                    You are delegating to <DelegateLink address={accountDelegate} /> but your Vester Contract is currently delegating to <DelegateLink address={currentVesterDelegate} />
                                  </Text>
                                }
                              />
                            }
                            <Input textAlign="left" fontSize="12px" placeholder={currentVesterDelegate} value={vesterDelegate} onChange={(e) => setVesterDelegate(e.target.value)} />
                            <SubmitButton
                              refreshOnSuccess={true}
                              disabled={currentVesterDelegate.toLowerCase() === vesterDelegate.toLowerCase() || !vesterDelegate || !isAddress(vesterDelegate)}
                              onClick={() => vesterChangeDelegate(library?.getSigner()!, vesterAddress, vesterDelegate)}>
                              Change Vester Contract's Delegate
                            </SubmitButton>
                          </VStack>
                        </Stack>
                        <Divider />
                        <Stack w='full'>
                          <VStack fontWeight="bold" alignItems="flex-start" justify="flex-start">
                            <Text>
                              Vester Contract's Recipient:
                            </Text>
                            <DangerMessage
                              alertProps={{ fontSize: '12px', w: 'full'}}
                              title="Transfer Rights"
                              description={
                                <Text fontWeight="normal">
                                  Changing the <b>Recipient</b> Address means transferring rights on the Vested tokens to another address, make sure you type the right address
                                </Text>
                              }
                            />
                            <Input textAlign="left" fontSize="12px" placeholder={userAddress} value={newRecipient} onChange={(e) => setNewRecipient(e.target.value)} />
                            <SubmitButton
                              refreshOnSuccess={true}
                              disabled={newRecipient.toLowerCase() === userAddress.toLowerCase() || !newRecipient || !isAddress(newRecipient)}
                              onClick={() => vesterChangeRecipient(library?.getSigner()!, vesterAddress, newRecipient)}>
                              TRANSFER RIGHTS
                            </SubmitButton>
                          </VStack>
                        </Stack>
                        {
                          isCancellable && !isCancelled && <>
                            <Divider />
                            <Stack w='full'>
                              <VStack fontWeight="bold" alignItems="flex-start" justify="flex-start">
                                <Text>
                                  Cancel the Vester:
                                </Text>
                                <DangerMessage
                                  alertProps={{ fontSize: '12px', w: 'full' }}
                                  title="Claim and Return the Rest to Treasury"
                                  description={
                                    <Text fontWeight="normal">
                                      This is similar to a Work Contract termination, cancelling the Vesting will give you the proportion of INV available to be claimed at the moment and the rest will return to the Treasury
                                    </Text>
                                  }
                                />
                                <SubmitButton
                                  refreshOnSuccess={true}
                                  onClick={() => vesterCancel(library?.getSigner()!, vesterAddress)}>
                                  CANCEL VESTER
                                </SubmitButton>
                              </VStack>
                            </Stack>
                          </>
                        }
                      </>
                      :
                      isLoading ?
                        <Text>Loading...</Text>
                        : <Text>No Vester found for <b>{userAddress}</b></Text>

                  }
                </VStack>
            }
          </Container>
        </Flex>
      </Flex>
    </Layout>
  )
}

export default VesterPage
