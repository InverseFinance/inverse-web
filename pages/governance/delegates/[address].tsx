import { Flex, Text, useDisclosure } from '@chakra-ui/react'
import { Web3Provider } from '@ethersproject/providers'
import { Avatar } from '@inverse/components/Avatar'
import { Breadcrumbs } from '@inverse/components/Breadcrumbs'
import { ClaimButton } from '@inverse/components/Button'
import Container from '@inverse/components/Container'
import { ChangeDelegatesModal } from '@inverse/components/Governance'
import Layout from '@inverse/components/Layout'
import { AppNav } from '@inverse/components/Navbar'
import { SkeletonBlob, SkeletonTitle } from '@inverse/components/Skeleton'
import { useDelegates } from '@inverse/hooks/useDelegates'
import { namedAddress } from '@inverse/util'
import { useWeb3React } from '@web3-react/core'
import { isAddress } from 'ethers/lib/utils'
import { useRouter } from 'next/dist/client/router'

const DelegateOverview = () => {
  const { active } = useWeb3React<Web3Provider>()
  const { query } = useRouter()
  const { isOpen, onOpen, onClose } = useDisclosure()
  const { delegates, isLoading } = useDelegates()

  if (!query.address || isLoading || !delegates) {
    return (
      <Container label={<SkeletonTitle />}>
        <SkeletonBlob />
      </Container>
    )
  }

  const address = query.address as string
  const { ensName } = delegates[address]

  return (
    <Container
      label={namedAddress(address, ensName)}
      description={address}
      image={<Avatar boxSize={12} address={address} />}
      right={active && <ClaimButton onClick={onOpen}>Delegate</ClaimButton>}
    >
      <Text color="purple.200" fontSize="sm">
        Coming soon...
      </Text>
      <ChangeDelegatesModal isOpen={isOpen} onClose={onClose} address={query.address as string} />
    </Container>
  )
}

export const Delegate = () => {
  const { query } = useRouter()

  // @ts-ignore
  const title = isAddress(query.address) ? namedAddress(query.address) : (query.address as string)

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
      <Flex w="full" align="center" direction="column">
        <Flex w={{ base: 'full', xl: '7xl' }} align="center">
          <DelegateOverview />
        </Flex>
      </Flex>
    </Layout>
  )
}

export default Delegate
