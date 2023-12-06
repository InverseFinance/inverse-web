import { Flex, Image, Text, VStack } from '@chakra-ui/react'

import Layout from '@app/components/common/Layout'
import { AppNav } from '@app/components/common/Navbar'
import Head from 'next/head'
import { TransparencyTabs } from '@app/components/Transparency/TransparencyTabs'
import { useDAO } from '@app/hooks/useDAO'
import { MultisigsFlowChart } from '@app/components/Transparency/MultisigsFlowChart'
import { ShrinkableInfoMessage } from '@app/components/common/Messages'
import { usePricesV2 } from '@app/hooks/usePrices'
import { Funds } from '@app/components/Transparency/Funds'
import Link from '@app/components/common/Link'
import { ExternalLinkIcon } from '@chakra-ui/icons';
import { Multisig, NetworkIds } from '@app/types';
import { RadioGridCardGroup } from '@app/components/common/Input/RadioCardGroup';
import { useEffect, useState } from 'react'
import { getNetworkConfigConstants, getNetworkImage } from '@app/util/networks';

const { MULTISIGS } = getNetworkConfigConstants()

const MultisigTabLabel = ({ multisig }: { multisig: Multisig }) => {
  return <Flex alignItems="center">
    <Image src={getNetworkImage(multisig.chainId)} ignoreFallback={true} alt="Network" w={5} h={5} mr="2" />
    <Text>{multisig.shortName}</Text>
  </Flex>
}

export const MultisigsDiagram = () => {
  const { multisigs } = useDAO();
  const { prices } = usePricesV2(true);

  const [multisigAd, setMultisigAd] = useState('');
  const [multisig, setMultisig] = useState<Multisig | null>(null);

  useEffect(() => {
    const newM = multisigs.find(m => m.address === multisigAd)
    if (newM) {
      setMultisig(newM);
    }
  }, [multisigAd])

  useEffect(() => {
    if (!multisigAd && multisigs?.length > 0) {
      setMultisigAd(multisigs[0].address);
    }
  }, [multisigs])

  return (
    <Layout>
      <Head>
        <title>Inverse Finance - Transparency Multisigs</title>
        <meta name="og:title" content="Inverse Finance - Transparency" />
        <meta name="og:description" content="Multisigs" />
        <meta name="og:image" content="https://inverse.finance/assets/social-previews/transparency-portal.png" />
        <meta name="description" content="Inverse Finance Multisigs" />
        <meta name="keywords" content="Inverse Finance, dao, transparency, multisigs" />
      </Head>
      <AppNav active="Transparency" activeSubmenu="Multisig Wallets" hideAnnouncement={true} />
      <TransparencyTabs active="multisigs" />
      <Flex w="full" justify="center" direction={{ base: 'column', xl: 'row' }}>
        <Flex direction="column">
          <Flex maxW="800px" p="4">
            <RadioGridCardGroup
              wrapperProps={{ w: 'full', minChildWidth: '120px', spacing: '4', mt: '4', color: 'mainTextColor' }}
              group={{
                name: 'multisig',
                defaultValue: MULTISIGS[0].address,
                onChange: (t) => setMultisigAd(t),
              }}
              radioCardProps={{ minW: '120px', textAlign: 'center', p: '2', fontSize: '12px' }}
              options={
                multisigs.map(m => ({
                  label: <MultisigTabLabel multisig={m} />,
                  value: m.address,
                }))
              }
            />
          </Flex>
          {!!multisig && <MultisigsFlowChart chainId={multisig.chainId} multisigs={[multisig]} />}
        </Flex>

        <VStack spacing={4} direction="column" pt="4" px={{ base: '4', xl: '0' }} w={{ base: 'full', xl: 'sm' }}>
          {
            multisig &&
            <ShrinkableInfoMessage
              title={
                <Flex fontSize="16px" fontWeight="bold" alignItems="center">
                  👥 {multisig.name}
                </Flex>
              }
              description={
                <VStack alignItems="flex-start" spacing="2">
                  <Flex pt="2" direction="row" w='full' justify="space-between">
                    <Text>- Required approvals to act:</Text>
                    <Text>{multisig.threshold} out of {multisig.owners.length} the members</Text>
                  </Flex>
                  <Flex direction="row" w='full'>
                    <Text>-</Text>
                    <Link
                      ml="1"
                      isExternal
                      href={`https://debank.com/profile/${multisig.address}`}>
                      View on Debank <ExternalLinkIcon mb="2px" />
                    </Link>
                  </Flex>
                  {
                    !!multisig.governanceLink && <Link href={multisig.governanceLink}>
                      - 🏛️ Related Governance Proposal
                    </Link>
                  }
                  <Text fontWeight="bold">- 🎯 Objective:</Text>
                  <Text as="i">{multisig.purpose}</Text>
                  <VStack spacing="0" w="full">
                    <Flex direction="row" w='full' justify="space-between">
                      <Text fontWeight="bold">Multisig Wallet Funds:</Text>
                    </Flex>
                    <Funds prices={prices} funds={multisig.funds} showPerc={false} />
                  </VStack>
                </VStack>
              }
            />
          }
        </VStack>
      </Flex>
    </Layout>
  )
}

export default MultisigsDiagram
