import { useState, useEffect } from 'react'
import { Box, Divider, Flex, Text, Textarea, useClipboard } from '@chakra-ui/react'
import { Avatar } from '@inverse/components/common/Avatar'
import { Breadcrumbs } from '@inverse/components/common/Breadcrumbs'
import Container from '@inverse/components/common/Container'
import { DelegatorsPreview, VotingWallet } from '@inverse/components/Governance'
import Layout from '@inverse/components/common/Layout'
import { AppNav } from '@inverse/components/common/Navbar'
import { SkeletonBlob, SkeletonTitle } from '@inverse/components/common/Skeleton'
import { useDelegates, useTopDelegates } from '@inverse/hooks/useDelegates'
import { namedAddress } from '@inverse/util'
import { isAddress } from 'ethers/lib/utils'
import { useRouter } from 'next/dist/client/router'
import { useWeb3React } from '@web3-react/core';
import { Web3Provider } from '@ethersproject/providers';
import { InfoMessage } from '@inverse/components/common/Messages'
import { SubmitButton } from '@inverse/components/common/Button'
import { getDelegationSig } from '../../../util/delegation';
import { NetworkIds } from '@inverse/types'

const DelegateOverview = () => {
  const [signature, setSignature] = useState('')
  const [hasLastSigCopied, setHasLastSigCopied] = useState(false)
  const { hasCopied, onCopy } = useClipboard(signature)
  const { query } = useRouter()
  const { chainId, library, active } = useWeb3React<Web3Provider>()
  const { delegates, isLoading } = useDelegates()
  const { delegates: topDelegates } = useTopDelegates()

  useEffect(() => {
    if (!hasCopied) { return }
    setHasLastSigCopied(true);
  }, [hasCopied]);

  useEffect(() => {
    setHasLastSigCopied(false);
  }, [signature]);

  const address = query.address as string
  if (!address || isLoading || !delegates || !delegates[address]) {
    return (
      <Container label={<SkeletonTitle />}>
        <SkeletonBlob />
      </Container>
    )
  }

  const { ensName } = delegates[address]
  const rank = topDelegates.findIndex((topDelegate) => address === topDelegate.address) + 1

  const handleDelegation = async () => {
    const sig = await getDelegationSig(library?.getSigner(), address);
    setSignature(sig);
  }

  const signDisabled = !active || chainId?.toString() !== NetworkIds.mainnet;

  return (
    <Container
      label={namedAddress(address, chainId, ensName)}
      description={address}
      href={`https://etherscan.io/address/${address}`}
      image={<Avatar boxSize={12} address={address} />}
      right={rank && <Text fontWeight="medium" fontSize="sm" color="purple.200">{`Rank ${rank}`}</Text>}

    >
      <Box>
        <Text fontSize="20" fontWeight="bold">Sign Delegation</Text>
        <Divider mt="3" mb="5" />
        <InfoMessage
          description={
            <>
              You are about to delegate your <b>voting power</b> to the address above.
              <Text mt="2" mb="2">This action will <b>not cost you any gas fees</b>.</Text>
              Previous delegations to other addresses (including yours) will be withdrawn.
              You can also change your delegate at any time in the future.
              <Text mt="2" mb="2" fontWeight="bold">Once signed, you will need to send the signature data shown to the delegatee</Text>
            </>
          } />

        <SubmitButton mt="2" onClick={handleDelegation} disabled={signDisabled}>
          {signDisabled ? 'Please connect to Mainnet first' : 'Sign Delegation'}
        </SubmitButton>

        {
          signature ?
            <Flex direction="column" mt="3">
              <Text>Delegation Signature :</Text>
              <Textarea value={signature} borderWidth="0" fontSize="sm" p={1.5} />
              <SubmitButton mt="2" onClick={onCopy}>{hasLastSigCopied ? 'Copied !' : 'Copy'}</SubmitButton>
            </Flex>
            : null
        }
        {
          hasLastSigCopied ? <Text align="center" mt="5">Now please send the copied signature to your delegatee 😀</Text> : null
        }
      </Box>
    </Container>
  )
}

export const DelegateView = () => {
  const { chainId } = useWeb3React<Web3Provider>()
  const { query } = useRouter()

  const address = query.address as string
  const title = isAddress(address) ? namedAddress(address, chainId) : address

  return (
    <Layout>
      <AppNav active="Governance" />
      <Breadcrumbs
        w="7xl"
        breadcrumbs={[
          { label: 'Governance', href: '/governance' },
          { label: 'Delegates', href: '/governance/delegates' },
          { label: title, href: '#' },
        ]}
      />
      <Flex w="full" justify="center" direction={{ base: 'column', xl: 'row' }}>
        <Flex direction="column">
          <Flex w={{ base: 'full', xl: '4xl' }} justify="center">
            <DelegateOverview />
          </Flex>
        </Flex>
        <Flex direction="column">
          <Flex w={{ base: 'full', xl: 'sm' }} justify="center">
            <VotingWallet address={address} />
          </Flex>
          <Flex w={{ base: 'full', xl: 'sm' }} justify="center">
            <DelegatorsPreview address={address} />
          </Flex>
        </Flex>
      </Flex>
    </Layout>
  )
}

export default DelegateView
