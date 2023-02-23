import { Stack, Image, VStack, Text } from '@chakra-ui/react'
import Head from 'next/head';
import Layout from '@app/components/common/Layout';
import { AppNav } from '@app/components/common/Navbar';
import { BigNumber } from 'ethers';
import { BURN_ADDRESS, OTC_CONTRACT } from '@app/config/constants';
import useEtherSWR from '@app/hooks/useEtherSWR';
import { getBnToNumber } from '@app/util/markets';
import { usePrices } from '@app/hooks/usePrices';
import { useWeb3React } from '@web3-react/core';
import { useState } from 'react';
import { useAccount } from '@app/hooks/misc';
import { useDualSpeedEffect } from '@app/hooks/useDualSpeedEffect';
import { InfoMessage } from '@app/components/common/Messages';
import { OtcDealer } from '@app/components/OTC/OtcDealer';
import { SkeletonBlob } from '@app/components/common/Skeleton';
import { OtcCreator } from '@app/components/OTC/OtcCreator';

const zero = BigNumber.from('0');

export const useOTC = (buyer = BURN_ADDRESS) => {
  const { data, error } = useEtherSWR([
    [OTC_CONTRACT, 'owner'],
    [OTC_CONTRACT, 'deals', buyer],
  ]);

  const [
    owner, deal
  ] = data || ['', ['', zero, zero, zero]];

  const token = deal[0];

  const { data: decimalsData } = useEtherSWR([
    [token, 'decimals'],
  ]);

  return {
    isLoading: !data && !error,
    owner,
    deal: {
      token,
      tokenAmount: data ? getBnToNumber(deal[1], parseFloat(decimalsData?.toString() || '18')) : 0,
      invAmount: data ? getBnToNumber(deal[2], parseFloat(decimalsData?.toString() || '18')) : 0,
      deadline: data ? getBnToNumber(deal[3], 0) * 1000 : 0,
    },
  }
}

export const OTCPage = () => {
  const { library, account } = useWeb3React();
  const viewAddress = useAccount();
  const otcData = useOTC(viewAddress);
  const { prices } = usePrices();
  const [isConnected, setConnected] = useState(true);

  const {
    isLoading,
    owner,
    deal,
  } = otcData;

  useDualSpeedEffect(() => {
    setConnected(!!account);
  }, [account], !account, 1000);

  return (
    <Layout>
      <Head>
        <title>{process.env.NEXT_PUBLIC_TITLE} - OTC</title>
        <meta name="og:title" content="Inverse Finance - OTC" />
        <meta name="description" content="Inverse Finance OTC" />
        <meta name="og:description" content="Inverse Finance OTC" />
      </Head>
      <AppNav hideAnnouncement={true} />
      <VStack w={{ base: 'full' }} justify="center" alignItems="center" pt="0">
        <Stack
          alignItems="center"
          direction={{ base: 'column', sm: 'row' }}
          spacing="0"
          bgColor="#111"
          justify="space-evenly"
          py="0"
          px="4"
          w={{ base: 'full' }}
        >
          <Text w={{ sm: '250px' }} color="white" textAlign="center" fontWeight="extrabold" fontSize="30px">OTC</Text>
          <Image src="/assets/partners/inv-handshake.png" w="50%" maxW='200px' />
          <Text w={{ sm: '250px' }} color="white" textAlign="center" fontWeight="extrabold" fontSize="30px">Inverse Finance</Text>
        </Stack>
        <VStack w='full' pt="4" maxW="500px">
          {
            isConnected && !isLoading ?
              (account === owner) ?
                <OtcCreator signer={library?.getSigner()} owner={owner} />
                :
                !!deal.token ?
                  <OtcDealer signer={library?.getSigner()} owner={owner} deal={deal} /> :
                  <InfoMessage description="No OTC Deal found for your connected address" /> :
              isLoading ? <SkeletonBlob /> :
                <InfoMessage description="Please connect your wallet" />
          }
        </VStack>
      </VStack>
    </Layout>
  )
}

export default OTCPage