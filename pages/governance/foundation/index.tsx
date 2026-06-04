import { Flex } from '@chakra-ui/react'
import Layout from '@app/components/common/Layout'
import { AppNav } from '@app/components/common/Navbar'
import Head from 'next/head';
import { useWeb3React } from '@web3-react/core';
import { Web3Provider } from '@ethersproject/providers';
import useEtherSWR from '@app/hooks/useEtherSWR';
import { getNetworkConfigConstants } from '@app/util/networks';
import { NetworkIds } from '@app/types';
import { DOLA_PAYROLL_V2 } from '@app/config/constants';

const { TOKENS, DOLA, TREASURY } = getNetworkConfigConstants(NetworkIds.mainnet);

export const InverseFoundationPage = () => {
  const { account, provider } = useWeb3React<Web3Provider>();
  const userAddress = (query?.viewAddress as string) || account;

  const { data } = useEtherSWR([
    [DOLA_PAYROLL_V2, 'balanceOf', userAddress],
    [DOLA_PAYROLL_V2, 'recipients', userAddress],
    [DOLA, 'allowance', TREASURY, DOLA_PAYROLL_V2],
    [DOLA, 'balanceOf', TREASURY],
  ]);

  return (
    <Layout>
      <Head>
        <title>Inverse Finance - Foundation</title>
        <meta name="og:title" content="Inverse Finance - Foundation" />
        <meta name="og:description" content="Foundation" />
      </Head>
      <AppNav active="Governance" />
      <Flex justify="center" direction="column">
        
      </Flex>
    </Layout>
  )
}

export default InverseFoundationPage
