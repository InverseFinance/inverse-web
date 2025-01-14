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
import { BigNumber, Contract } from 'ethers';
import { REWARD_TOKEN, RTOKEN_CG_ID } from '@app/variables/tokens';
import { Input } from '@app/components/common/Input';
import { useEffect, useState } from 'react';
import { namedAddress, shortenAddress } from '@app/util';
import Link from '@app/components/common/Link';
import { vesterCancel } from '@app/util/payroll';
import { useContractEvents } from '@app/hooks/useContractEvents';
import { INV_ABI, VESTER_ABI, VESTER_FACTORY_ABI } from '@app/config/abis';
import { usePricesV2 } from '@app/hooks/usePrices';
import { ETH_MANTISSA } from '@app/config/constants';
import { AnimatedInfoTooltip } from '@app/components/common/Tooltip';
import { useCustomSWR } from '@app/hooks/useCustomSWR';
import { RadioCardGroup } from '@app/components/common/Input/RadioCardGroup';

const { XINV, INV, XINV_VESTOR_FACTORY } = getNetworkConfigConstants(NetworkIds.mainnet);

const DelegateLink = ({ address }: { address: string }) => {
  return <Link fontWeight="bold" textDecoration="underline" display="inline-block" href={`/governance/delegates/${address}`}>{namedAddress(address)}</Link>
}

// increase number when a new proposal adds new vesters, can be more but not less than the nb of vesters deployed
// contract factory does not have data of the numbers of vesters
const vestersToCheck = [...Array(45).keys()];

export const VesterPage = () => {
  const [isSmaller] = useMediaQuery('(max-width: 500px)')
  const { account, provider } = useWeb3React<Web3Provider>();
  const { query } = useRouter();
  const userAddress = (query?.viewAddress as string) || account;
  const [vesterDelegate, setVesterDelegate] = useState('');
  const [newRecipient, setNewRecipient] = useState('');
  const [alreadyClaimed, setAlreadyClaimed] = useState(0);
  const [selectedVesterIndex, setSelectedVesterIndex] = useState(0);
  const { prices } = usePricesV2();

  const { data: vestersData } = useCustomSWR(`vesters-list-${account}`, async () => {
    const contract = new Contract(XINV_VESTOR_FACTORY, VESTER_FACTORY_ABI, provider?.getSigner());
    const results = await Promise.allSettled([
      ...vestersToCheck.map((v, i) => contract.vesters(i))
    ])
    return results;
  });

  const vesters = vestersData ? vestersData.filter(r => r.status === 'fulfilled').map(r => r.value) : [];

  const { data: vesterRecipients } = useEtherSWR({ 
    args: [...vesters.map(vesterAd => [vesterAd, 'recipient'])], 
    abi: VESTER_ABI,
   });

  const myVesters = (vesterRecipients || [])
    .map((v, i) => ({
      recipient: v,
      vester: vesters[i],
    }))
    .filter(({ recipient }) => recipient.toLowerCase() === userAddress?.toLowerCase())
    .map(({ vester }) => vester);

  const vesterAddress = myVesters?.length ? myVesters[selectedVesterIndex] : undefined;

  const { data: exRate } = useEtherSWR([XINV, 'exchangeRateStored']);

  const myVestersDataReq = [
    ...myVesters.reduce((prev, vesterAd) => [
      ...prev,
      ...[
        [vesterAd, 'claimableINV'],
        [vesterAd, 'vestingBegin'],
        [vesterAd, 'vestingEnd'],
        [vesterAd, 'lastUpdate'],
        [vesterAd, 'isCancellable'],
        [vesterAd, 'isCancelled'],
      ],
    ], [])
  ]

  const { data: myVestersData } = useEtherSWR({
    args: myVestersDataReq,
    abi: VESTER_ABI,
  });

  const { data: xinvDatas } = useEtherSWR([
    ...myVesters.reduce((prev, vesterAd) => [
      ...prev,
      ...[
        [XINV, 'delegates', vesterAd],
        [XINV, 'delegates', userAddress],
        [XINV, 'balanceOf', vesterAd],
      ],
    ], [])
  ])

  const nbDataPerVester = myVesters.length > 0 ? myVestersDataReq.length / myVesters.length : 0;

  const selectedVesterData = myVestersData && myVestersData.slice(nbDataPerVester * selectedVesterIndex, nbDataPerVester + nbDataPerVester * selectedVesterIndex);
  const selectedXinvVesterData = xinvDatas && xinvDatas.slice(3 * selectedVesterIndex, 3 + selectedVesterIndex * 3);

  const [claimableINV, vestingBegin, vestingEnd, lastUpdate, isCancellable, isCancelled] = selectedVesterData || [BigNumber.from('0'), BigNumber.from('0'), BigNumber.from('0'), BigNumber.from('0'), false, false];
  const [currentVesterDelegate, accountDelegate, xinvBalance] = selectedXinvVesterData || [userAddress, userAddress, BigNumber.from('0')];
  const currentVestedAmount = (xinvBalance / ETH_MANTISSA) * ((exRate || 0) / ETH_MANTISSA);

  const isLoading = vesterRecipients === undefined && selectedVesterData === undefined;
  const hasNoVester = !isLoading && !vesterAddress;

  const widthdrawable = getBnToNumber(claimableINV, REWARD_TOKEN!.decimals);
  const startTimestamp = parseInt(vestingBegin.toString()) * 1000;
  const endTimestamp = parseInt(vestingEnd.toString()) * 1000;
  const lastClaimTimestamp = parseInt(lastUpdate.toString()) * 1000;
  const vestingPerc = Math.min((Date.now() - startTimestamp) / (endTimestamp - startTimestamp) * 100, 100);

  const formatDate = (timestamp: number, isSmaller: boolean) => {
    return `${moment(timestamp).format('MMM Do, YYYY')}${isSmaller ? '' : ` (${moment(timestamp).fromNow()})`}`
  }

  const { events } = useContractEvents(INV, INV_ABI, 'Transfer', [vesterAddress], true, `vester-claims-${vesterAddress}`);

  useEffect(() => {
    const alreadyClaimed = events
      .filter(e => e.args.to.toLowerCase() !== XINV.toLowerCase())
      .reduce((prev, curr) => prev + getBnToNumber(curr.args.amount, REWARD_TOKEN?.decimals), 0);
    setAlreadyClaimed(alreadyClaimed);
  }, [events, vesterAddress]);

  const invPrice = (prices && prices[RTOKEN_CG_ID]?.usd) || 0;

  const totalVested = myVesters.length > 0 && xinvDatas && exRate ?
    myVesters.reduce((prev, vesterAd, i) => prev + (xinvDatas[2 + 3 * i] / ETH_MANTISSA) * ((exRate || 0) / ETH_MANTISSA), 0)
    :
    0;

  return (
    <Layout>
      <Head>
        <title>Inverse Finance - Vester</title>
        <meta name="og:title" content="Inverse Finance - Vester Portal" />
        <meta name="og:description" content="Vester Portal" />
      </Head>
      <AppNav active="Governance" />
      <Flex justify="center" direction="column">
        <Flex w={{ base: 'full', xl: '4xl' }} justify="center" color="mainTextColor">
          <VStack w='full'>
            {
              myVesters?.length > 1 && <VStack px="6" w='full' mt="5" w='full' alignItems="flex-start">
                <Text fontSize="30px" fontWeight='bold'>Select one of the Vester Contracts Found:</Text>
                <Text fontSize="20px" fontWeight='bold'>
                  Total Currently Vested: {commify((totalVested).toFixed(2))} INV ({shortenNumber(totalVested * invPrice, 2, true)})
                </Text>
                <RadioCardGroup
                  wrapperProps={{ overflow: 'auto', position: 'relative', justify: 'left', mt: '2', mb: '2', maxW: { base: '90vw', sm: '100%' } }}
                  group={{
                    name: 'selectedVesterIndex',
                    defaultValue: '0',
                    onChange: (v: string) => setSelectedVesterIndex(parseInt(v)),
                  }}
                  radioCardProps={{ w: '160px', fontSize: '14px', textAlign: 'center', p: '1', position: 'relative' }}
                  options={myVesters.map((v, i) => {
                    return { label: `#${i + 1} - ${shortenAddress(v)}`, value: i.toString() }
                  })}
                />
              </VStack>
            }
            <Container
              contentBgColor="gradient3"
              label="INV Vester"
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
                                    - <b>Current Vested Amount</b>:
                                  </Text>
                                  <Link href={`/frontier?viewAddress=${vesterAddress}`} isExternal>
                                    <AnimatedInfoTooltip message="View the Vester on Frontier">
                                      <Text fontWeight="extrabold" textDecoration="underline">
                                        {currentVestedAmount ? commify((currentVestedAmount).toFixed(2)) : ''} INV
                                        ({shortenNumber(currentVestedAmount * invPrice, 2, true)})
                                      </Text>
                                    </AnimatedInfoTooltip>
                                  </Link>
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
                                <Flex alignItems="center" justify="space-between">
                                  <Text>
                                    - <b>Already Claimed</b>:
                                  </Text>
                                  <Text fontWeight="extrabold">
                                    {shortenNumber(alreadyClaimed, 2)} INV ({shortenNumber(alreadyClaimed * invPrice, 2, true)})
                                  </Text>
                                </Flex>
                                <Flex fontWeight="bold" alignItems="center" justify="space-between">
                                  <Text>
                                    - <b>Currently Claimable</b>:
                                  </Text>
                                  <Text fontWeight="extrabold">
                                    {commify(widthdrawable.toFixed(2))} INV ({shortenNumber(widthdrawable * invPrice, 2, true)})
                                  </Text>
                                </Flex>
                                <Text textDecoration="underline" textAlign="center" fontSize="12px">
                                  Reminder: Vested Tokens are already staked on Frontier and generating yield
                                </Text>
                              </VStack>
                            }
                          />
                          <SubmitButton refreshOnSuccess={true} maxW="120px" disabled={!account && widthdrawable > 0} onClick={() => vesterClaim(provider?.getSigner()!, vesterAddress)}>
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
                                onClick={() => vesterChangeDelegate(provider?.getSigner()!, vesterAddress, vesterDelegate)}>
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
                                alertProps={{ fontSize: '12px', w: 'full' }}
                                title="Transfer Rights"
                                description={
                                  <Text fontWeight="normal">
                                    Changing the <b>Recipient</b> Address means transferring rights on the Vested tokens to another address, make sure you type the right address
                                  </Text>
                                }
                              />
                              <Input textAlign="left" fontSize="12px" placeholder={userAddress} value={newRecipient} onChange={(e) => setNewRecipient(e.target.value)} />
                              <SubmitButton
                                themeColor="red.500"
                                refreshOnSuccess={true}
                                disabled={newRecipient.toLowerCase() === userAddress.toLowerCase() || !newRecipient || !isAddress(newRecipient)}
                                onClick={() => vesterChangeRecipient(provider?.getSigner()!, vesterAddress, newRecipient)}>
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
                                    themeColor="red.500"
                                    refreshOnSuccess={true}
                                    onClick={() => vesterCancel(provider?.getSigner()!, vesterAddress)}>
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
          </VStack>
        </Flex>
      </Flex>
    </Layout>
  )
}

export default VesterPage
