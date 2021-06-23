import { Flex } from '@chakra-ui/react'
import { Breadcrumbs } from '@inverse/components/Breadcrumbs'
import { AgainstVotes, ForVotes, ProposalActions, ProposalDetails, VoteButton } from '@inverse/components/Governance'
import Layout from '@inverse/components/Layout'
import { AppNav } from '@inverse/components/Navbar'
import { useRouter } from 'next/dist/client/router'

export const Governance = () => {
  const { query } = useRouter()

  const id = parseInt(query.id as string, 10)

  return (
    <Layout>
      <AppNav active="Governance" />
      <Breadcrumbs
        breadcrumbs={[
          { label: 'Governance', href: '/governance' },
          { label: 'Proposals', href: '/governance/proposals' },
          { label: `Proposal ${id}`, href: '#' },
        ]}
      />
      <Flex w="full" justify="center" direction={{ base: 'column', xl: 'row' }}>
        <Flex direction="column">
          <Flex w={{ base: 'full', xl: '4xl' }} justify="center">
            <ProposalDetails id={id} />
          </Flex>
          <Flex w={{ base: 'full', xl: '4xl' }} justify="center">
            <ProposalActions id={id} />
          </Flex>
        </Flex>
        <Flex direction="column">
          <Flex w={{ base: 'full', xl: 'sm' }} justify="center">
            <VoteButton id={id} />
          </Flex>
          <Flex w={{ base: 'full', xl: 'sm' }} justify="center">
            <ForVotes id={id} />
          </Flex>
          <Flex w={{ base: 'full', xl: 'sm' }} justify="center">
            <AgainstVotes id={id} />
          </Flex>
        </Flex>
      </Flex>
    </Layout>
  )
}

export default Governance
